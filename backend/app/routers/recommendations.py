from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import math
import logging

from app.database import get_db
from app.models.activity import Activity
from app.services.geoapify import get_places
from app.services.user_preferences import UserPreferenceEngine
from app.services.scoring import *

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# -------------------- DISTANCE HELPER --------------------
def distance_km(lat1, lon1, lat2, lon2):
    R = 6371 #radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(lat1)) * 
        math.cos(math.radians(lat2)) * 
        math.sin(dlon / 2) ** 2
    )
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# -------------------- CLEAN DATA FOR DB --------------------
def clean_place_data(p: dict):
    """remove fields not in Activity model"""
    allowed_fields = {
        "place_id",
        "title",
        "subtitle",
        "categories",
        "category_names",
        "latitude",
        "longitude",
        "rating",
        "price",
        "popularity",
    }

    return {k: v for k, v in p.items() if k in allowed_fields}

# -------------------- PERSONALISED HELPERS --------------------
def diversity_penalty(category, seen_categories):
    """penalise repeating same categories"""
    if not category:
        return 1.0
    
    count = seen_categories.get(category, 0)
    return max(0.6, 1 - (count * 0.15))

def recency_penalty(activity_id, recent_ids):
    """avoid recommending recently opened items"""
    if activity_id in recent_ids:
        return 0.5
    return 1.0
    
def preference_boost(categories, user_prefs):
    """boost categories user interacts with"""
    if not categories or not user_prefs:
        return 1.0
    
    boost = 0
    for c in categories:
        for pref, weight in user_prefs.items():
            if pref in c.lower():
                boost += min(0.5, weight * 0.15)

    return min(1.3, 1 + boost)

# -------------------- RECOMMENDATIONS ENDPOINT --------------------
@router.get("/")
def recommendations(
    mood: str = Query(..., description="low | neutral | high"),
    weather: str | None = Query(None),
    time_of_day: str | None = Query(None, description="morning | afternoon | evening | night"),
    lat: float = Query(...),
    lon: float = Query(...),
    user_id: str | None = Query(None),
    db: Session = Depends(get_db)
):
    try:
        results = []
        seen_ids = set()
        seen_categories = {}

        # simulate user behaviour
        recent_ids = set()
        try:
            if user_id:
                engine = UserPreferenceEngine(db, user_id)
                user_prefs = engine.get_user_prefs().get("categories", {})
            else:
                user_prefs = {}
        except Exception:
            user_prefs = {}

        # ---------- 1. load from db ----------
        db_items = db.query(Activity).filter(
            func.abs(Activity.latitude - lat) <= 0.2,
            func.abs(Activity.longitude - lon) <= 0.2
        ).all()

        for activity in db_items:
            dist = distance_km(lat, lon, activity.latitude, activity.longitude)
            categories = activity.category_names or []

            base_score = total_score(
                mood_score(mood, categories, activity.rating, activity.popularity),
                weather_score(weather, categories),
                distance_score(dist),
                time_score(time_of_day, categories),
                price_score(activity.price, mood)
            )

            category_main = categories[0] if categories else None

            score = (
                base_score *
                diversity_penalty(category_main, seen_categories) *
                recency_penalty(activity.id, recent_ids) *
                preference_boost(categories, user_prefs)
            )

            if score < 0.1:
                continue

            results.append({
                "id": activity.id,
                "title": activity.title,
                "subtitle": activity.subtitle,
                "category": activity.categories,
                "category_names": categories,
                "distance": round(dist, 2),
                "score": round(score, 3)
            })

            seen_ids.add(activity.id)

            if category_main:
                seen_categories[category_main] = seen_categories.get(category_main, 0) + 1

        # --------------- 2. fetch from geoapify ---------------
        api_places = get_places(lat, lon, 30)

        place_ids = [p["place_id"] for p in api_places if p.get("place_id")]

        existing = db.query(Activity).filter(
            Activity.place_id.in_(place_ids)
        ).all()

        existing_map = {e.place_id: e for e in existing}
        
        # --------------- 3. process api data ---------------
        for p in api_places:
            if len(results) >= 25:
                break

            pid = p.get("place_id")
            if not pid:
                continue
            
            clean_data = clean_place_data(p)
            activity = existing_map.get(pid)

            # ---------- CREATE NEW (LEARNING) ----------
            if not activity:
                activity = Activity(**clean_data)
                db.add(activity)
                db.flush()
                db.refresh(activity)
            else:
                #keep DB synced
                for k, v in clean_data.items():
                    setattr(activity, k, v)

            # distance
            dist = p.get("distance") or distance_km(
                lat, lon, 
                activity.latitude, 
                activity.longitude
            )

            categories = clean_data.get("category_names", [])

            # score
            base_score = total_score(
                mood_score(mood, categories, activity.rating, activity.popularity),
                weather_score(weather, categories),
                distance_score(dist),
                time_score(time_of_day, categories),
                price_score(activity.price, mood)
            )

            category_main = categories[0] if categories else None

            score = (
                base_score *
                diversity_penalty(category_main, seen_categories) *
                recency_penalty(activity.id, recent_ids) *
                preference_boost(categories, user_prefs)
            )

            if score < 0.1:
                continue

            activity.score = score

            # add to results
            if activity.id not in seen_ids:
                results.append({
                    "id": activity.id,
                    "title": activity.title,
                    "subtitle": activity.subtitle,
                    "category": activity.categories,
                    "category_names": activity.category_names,
                    "distance": round(dist, 2),
                    "score": round(score, 3)
                })
                seen_ids.add(activity.id)

                if category_main:
                    seen_categories[category_main] = seen_categories.get(category_main, 0) + 1

        db.commit()
        
        #final ranking
        results.sort(key=lambda x: x["score"], reverse=True)
        
        return results[:25]

    except Exception as e:
        logger.exception("Recommendation error")
        raise HTTPException(status_code=500, detail="Failed to fetch")