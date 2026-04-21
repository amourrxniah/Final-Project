from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import math
import logging

from app.database import get_db
from app.models.activity import Activity
from app.services.geoapify import get_places
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

# -------------------- RECOMMENDATIONS ENDPOINT --------------------
@router.get("/")
def recommendations(
    mood: str = Query(..., description="low | neutral | high"),
    weather: str | None = Query(None),
    time_of_day: str | None = Query(None, description="morning | afternoon | evening | night"),
    lat: float = Query(...),
    lon: float = Query(...),
    db: Session = Depends(get_db)
):
    try:
        results = []
        seen_ids = set()

        # ---------- DB FIRST (LEARNING) ----------
        db_items = db.query(Activity).filter(
            func.abs(Activity.latitude - lat) <= 0.2,
            func.abs(Activity.longitude - lon) <= 0.2
        ).all()

        for activity in db_items:
            dist = distance_km(lat, lon, activity.latitude, activity.longitude)

            score = total_score(
                mood_score(mood, activity.categories, activity.rating, activity.popularity),
                weather_score(weather, activity.categories),
                distance_score(dist),
                time_score(time_of_day, activity.categories),
                price_score(activity.price, mood)
            )

            if score < 0.15:
                continue

            results.append({
                "id": activity.id,
                "title": activity.title,
                "subtitle": activity.subtitle,
                "category": activity.categories,
                "category_names": activity.category_names or [],
                "distance": round(dist, 2),
                "score": round(score, 3)
            })

            seen_ids.add(activity.id)

        # --------------- FETCH FROM API (GEOAPIFY) ---------------
        api_places = get_places(lat, lon, 30)

        place_ids = [p["place_id"] for p in api_places if p.get("place_id")]

        existing = db.query(Activity).filter(
            Activity.place_id.in_(place_ids)
        ).all()

        existing_map = {e.place_id: e for e in existing}
        
        # --------------- PROCESS API PLACES ---------------
        for p in api_places:
            if len(results) >= 25:
                break

            pid = p.get("place_id")
            if not pid:
                continue
            
            activity = existing_map.get(pid)

            # ---------- CREATE NEW (LEARNING) ----------
            if not activity:
                activity = Activity(**p)
                db.add(activity)
                db.flush()
                db.refresh(activity)
            else:
                #keep DB synced
                for k, v in p.items():
                    setattr(activity, k, v)

                # distance
                dist = p.get("distance") or distance_km(
                    lat, lon, 
                    activity.latitude, 
                    activity.longitude
                )

                categories = p.get("category_names", [])

                # score
                score = total_score(
                    mood_score(mood, categories, activity.rating, activity.popularity),
                    weather_score(weather, categories),
                    distance_score(dist),
                    time_score(time_of_day, categories),
                    price_score(activity.price, mood)
                )

                if score < 0.15:
                    continue

                activity.score = score

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

            db.commit()
        
        #sort by score and limit results
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:25]

    except Exception as e:
        logger.exception("Recommendation error")
        raise HTTPException(status_code=500, detail="Failed to fetch")