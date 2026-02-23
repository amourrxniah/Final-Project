from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import math
import logging

from app.database import get_db
from app.models.activity import Activity
from app.services.geoapify import get_places
from app.services.scoring import (
    mood_score, 
    weather_score, 
    distance_score, 
    price_score, 
    time_score,
    total_score
)

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
        logger.info(
            f"Recommendations | mood={mood} weather={weather} time={time_of_day}")

        results = []
        seen_ids = set()

        # ---------- DB FALLBACK ----------
        nearby_db = db.query(Activity).filter(
            func.abs(Activity.latitude - lat) <= 0.15,
            func.abs(Activity.longitude - lon) <= 0.15
        ).all()

        for activity in nearby_db:
            dist = distance_km(lat, lon, activity.latitude, activity.longitude)
            if dist > 10:
                continue

            score = total_score(
                mood_score(mood, activity.categories, activity.rating, activity.popularity),
                weather_score(weather, activity.categories),
                distance_score(dist),
                time_score(time_of_day, activity.categories),
                price_score(activity.price, mood)
            )

            if score < 0.25:
                continue

            results.append({
                "id": activity.id,
                "title": activity.title,
                "subtitle": activity.subtitle,
                "category": activity.categories,
                "category_names": activity.category_names,
                "distance": round(dist, 2),
                "rating": activity.rating,
                "price": activity.price,
                "popularity": activity.popularity,
                "score": round(score, 3)
            })

            seen_ids.add(activity.id)

            if len(results) >= 25:
                break

        # --------------- FETCH FROM API ---------------
        api_places = get_places(lat=lat, lon=lon, limit=30)
        logger.info(f"Geoapify returned {len(api_places)} places")

        if api_places:
            place_ids = [p["place_id"] for p in api_places if p.get("place_id")]

            existing = db.query(Activity).filter(
                Activity.place_id.in_(place_ids)
            ).all()

            existing_map = {a.place_id: a for a in existing}
        
            # --------------- PROCESS API PLACES ---------------
            for place in api_places:
                if len(results) >= 25:
                    break

                place_id = place.get("place_id")
                if not place_id:
                    continue

                categories = place.get("categories", [])

                activity = existing_map.get(place_id)

                if not activity:
                    activity = Activity(
                        place_id=place_id,
                        title=place.get("title"),
                        subtitle=place.get("subtitle"),
                        categories=categories,
                        category_names=place.get("category_names"),
                        latitude=place.get("lat"),
                        longitude=place.get("lon"),
                        rating=place.get("rating") or 4.0,
                        price=place.get("price") or 2,
                        popularity=place.get("popularity") or 0.5,
                        mood=mood,
                        weather=weather
                    )
                    db.add(activity)
                    db.flush()
                else:
                    #keep DB in sync with API data
                    activity.title = place.get("title")
                    activity.subtitle = place.get("subtitle")
                    activity.categories = categories
                    activity.category_names = place.get("category_names")
                    activity.latitude = place.get("lat")
                    activity.longitude = place.get("lon")
                    activity.rating = place.get("rating") or activity.rating
                    activity.price = place.get("price") or activity.price
                    activity.popularity = place.get("popularity") or activity.popularity
                    activity.mood = mood,
                    activity.weather = weather

                dist = place.get("distance") or distance_km(
                    lat, lon, activity.latitude, activity.longitude
                )

                score = total_score(
                    mood_score(mood, categories, activity.rating, activity.popularity),
                    weather_score(weather, categories),
                    distance_score(dist),
                    time_score(time_of_day, categories),
                    price_score(activity.price, mood)
                )

                activity.score = score

                if activity.id in seen_ids:
                    continue

                results.append({
                    "id": activity.id,
                    "title": activity.title,
                    "subtitle": activity.subtitle,
                    "category": activity.categories,
                    "category_names": activity.category_names,
                    "distance": round(dist, 2),
                    "rating": activity.rating,
                    "price": activity.price,
                    "popularity": activity.popularity,
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