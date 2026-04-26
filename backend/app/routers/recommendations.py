from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import math
import logging
import random

from app.database import get_db
from app.models.activity import Activity
from app.models.activity_log import ActivityLog
from app.models.recommendation_history import RecommendationHistory
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

    return max(0.4, 1 - (count * 0.25))

def recency_penalty(activity_id, recent_logs, recent_recs):
    """avoid recommending recently opened items"""
    if activity_id in recent_logs:
        return 0.3 # hard block
    
    if activity_id in recent_recs:
        return 0.6 # soft block
    
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

        now = datetime.now(timezone.utc)

        # ---------- user history ----------
        recent_logs = set()
        recent_recs = set()
        user_prefs = {}

        if user_id:
            # last 3 days logs
            logs = db.query(ActivityLog).filter(
                ActivityLog.user_id == user_id,
                ActivityLog.timestamp >= now - timedelta(days=3)
            ).all()
            recent_logs = {l.activity_id for l in logs}

            # last 24h recommendations
            recs = db.query(RecommendationHistory).filter(
                RecommendationHistory.user_id == user_id,
                RecommendationHistory.timestamp >= now - timedelta(hours=24)
            )
            recent_recs = {r.activity_id for r in recs}

        # preferences
        try:
            engine = UserPreferenceEngine(db, user_id)
            user_prefs = engine.get_user_prefs().get("categories", {})
        except Exception:
            user_prefs = {}

        # ---------- 1. load from db ----------
        db_items = db.query(Activity).filter(
            func.abs(Activity.latitude - lat) <= 0.2,
            func.abs(Activity.longitude - lon) <= 0.2
        ).all()

        def score_activity(activity, categories, dist):
            base = total_score(
                mood_score(mood, categories, activity.rating, activity.popularity),
                weather_score(weather, categories),
                distance_score(dist),
                time_score(time_of_day, categories),
                price_score(activity.price, mood)
            )

            category_main = categories[0] if categories else None

            score = (
                base *
                diversity_penalty(category_main, seen_categories) *
                recency_penalty(activity.id, recent_logs, recent_recs) *
                preference_boost(categories, user_prefs)
            )

            # exploration
            score *= random.uniform(0.9, 1.1)

            return score

        for activity in db_items:
            dist = distance_km(lat, lon, activity.latitude, activity.longitude)
            categories = activity.category_names or []

            score = score_activity(activity, categories, dist)

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

            if categories:
                seen_categories[categories[0]] = seen_categories.get(categories[0], 0) + 1

        # --------------- 2. fetch from geoapify ---------------
        api_places = get_places(lat, lon, 30)

        place_ids = [p["place_id"] for p in api_places if p.get("place_id")]

        existing = db.query(Activity).filter(
            Activity.place_id.in_(place_ids)
        ).all()

        existing_map = {e.place_id: e for e in existing}
        
        # --------------- 3. process api data ---------------
        for p in api_places:
            if len(results) >= 40:
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

            score = score_activity(activity, categories, dist)

            if score < 0.1:
                continue

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

                if categories:
                    seen_categories[categories[0]] = seen_categories.get(categories[0], 0) + 1

        db.commit()
        
        #final ranking
        results.sort(key=lambda x: x["score"], reverse=True)

        # ---------- FORCE DIVERSITY ----------
        final = []
        used_categories = set()

        for item in results:
            categories = (item.get("category_names") or ["other"])[0]

            if categories not in used_categories or len(final) < 10:
                final.append(item)
                used_categories.add(categories)
            
            if len(final) >= 25:
                break
        
        # ---------- SAVE HISTORY ----------
        if user_id:
            for item in final:
                db.add(RecommendationHistory(
                    user_id=user_id,
                    activity_id=item["id"]
                ))
            db.commit()
            
        return final
        

    except Exception as e:
        logger.exception("Recommendation error")
        raise HTTPException(status_code=500, detail="Failed to fetch")