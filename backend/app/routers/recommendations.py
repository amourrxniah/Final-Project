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

# -------------------- WELLBEING ACTIVITIES --------------------
WELLBEING_ACTIVITIES = [
    {
        "id": "wb_book",
        "title": "Read a Book",
        "subtitle": "Slow down and enjoy a calming read",
        "category_names": ["book", "library", "relax"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.8,
        "price": 1,
        "popularity": 0.7
    },
    {
        "id": "wb_meditation",
        "title": "Meditation",
        "subtitle": "Find a quiet space and meditate for 10 minutes",
        "category_names": ["meditation", "wellness", "relax"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.8,
        "price": 1,
        "popularity": 0.75
    },
    {
        "id": "wb_yoga",
        "title": "Yoga Practice",
        "subtitle": "Do a 20-minute yoga routine",
        "category_names": ["yoga", "fitness", "wellness"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.9,
        "price": 1,
        "popularity": 0.8
    },
    {
        "id": "wb_walk",
        "title": "Nature Walk",
        "subtitle": "Take a 30-minute walk in a nearby park",
        "category_names": ["walk", "nature", "park"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.7,
        "price": 1,
        "popularity": 0.85
    },
    {
        "id": "wb_music",
        "title": "Listen to Music",
        "subtitle": "Play your favorite songs and relax",
        "category_names": ["music", "entertainment", "relax", "concert"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.6,
        "price": 1,
        "popularity": 0.8
    },
    {
        "id": "wb_breathing",
        "title": "Breathing Exercise",
        "subtitle": "Try a 5-minute guided breathing exercise",
        "category_names": ["breathing", "wellness", "relax"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.9,
        "price": 1,
        "popularity": 0.65
    },
    {
        "id": "wb_journaling",
        "title": "Journaling",
        "subtitle": "Write down your thoughts and feelings for 15 minutes",
        "category_names": ["journal", "mindfulness", "wellness", "creative", "writing"],
        "categories": ["wellbeing"],
        "distance": 0,
        "rating": 4.7,
        "price": 1,
        "popularity": 0.65
    }
]

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
        return 0.1 # hard block
    
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
            ).all()

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
                preference_boost(categories, user_prefs) *
                night_safety_filter(categories, time_of_day)
            )

            # exploration
            score *= random.uniform(0.95, 1.05)

            return score

        for activity in db_items:
            dist = distance_km(lat, lon, activity.latitude, activity.longitude)
            categories = activity.category_names or []

            score = score_activity(activity, categories, dist)

            if score < 0.05:
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

        
        # --------------- wellbeing activities ---------------
        for wb in WELLBEING_ACTIVITIES:
            categories = wb["category_names"]

            score = total_score(
                mood_score(
                    mood,
                    categories,
                    wb["rating"],
                    wb["popularity"]
                ),
                weather_score(weather, categories),
                1.0, # home = perfect distance 
                time_score(time_of_day, categories),
                price_score(wb["price"], mood)
            )

            score *= preference_boost(categories, user_prefs)

            results.append({
                "id": wb["id"],
                "title": wb["title"],
                "subtitle": wb["subtitle"],
                "category": wb["categories"],
                "category_names": categories,
                "distance": 0,
                "score": round(score, 3),
                "virtual": True
            })

        # --------------- 2. fetch from geoapify ---------------
        api_places = get_places(lat, lon, 30)

        place_ids = [
            p["place_id"] 
            for p in api_places 
            if p.get("place_id")
        ]

        existing = []
        
        if place_ids:
            existing = (
                db.query(Activity)
                .filter(Activity.place_id.in_(place_ids))
                .all()
            )

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

            if score < 0.05:
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

        # ---------- FORCE DIVERSITY + WELLBEING ----------
        final = []
        used_categories = set()

        # separate wellbeing + API
        wellbeing_items = [
            r for r in results
            if r.get("virtual") is True
        ]

        place_items = [
            r for r in results
            if not r.get("virtual")
        ]

        # keep top wellbeing
        top_wellbeing = wellbeing_items[:7]

        for item in top_wellbeing:
            final.append(item)
        
        # fill with normal activities        
        for item in place_items:
            categories = (item.get("category_names") or ["other"])[0]

            if categories not in used_categories or len(final) < 20:
                final.append(item)
                used_categories.add(categories)
            
            if len(final) >= 50:
                break
        
        # ---------- SAVE HISTORY ----------
        if user_id:
            for item in final:

                # skip home / vrtual activities
                if item.get("virtual"):
                    continue

                db.add(RecommendationHistory(
                    user_id=user_id,
                    activity_id=item["id"]
                ))
            db.commit()

        return final
        

    except Exception as e:
        logger.exception("Recommendation error")
        raise HTTPException(status_code=500, detail="Failed to fetch")