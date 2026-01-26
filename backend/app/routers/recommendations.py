from fastapi import APIRouter, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.activity import Activity
from app.services.opentripmap import get_places, get_place_details

router = APIRouter()

def score_activity(distance, mood):
    mood_weight = {"low": 1.2, "neutral": 1.0, "high": 0.8}
    return round((1 / (distance + 0.1)) * mood_weight.get(mood, 1), 3)

@router.get("/recommendations")
def recommendations(
    mood: str = Query(...),
    weather: str = Query(None),
    lat: float = Query(...),
    lon: float = Query(...)
):
    db: Session = SessionLocal()

    #fresh OpenTripMap places
    places = get_places(lat, lon, mood, weather) or []
    enriched = []

    for p in places:
        details = get_place_details(p["xid"])
        score = score_activity(p["distance"], mood)

        activity = Activity(
            id=p["xid"],
            name=p["name"],
            description=details.get("wikipedia_extracts", {}).get(
                "text", "A great match for your mood."
            ),
            distance=p["distance"],
            mood=mood,
            weather=weather,
            score=score
        )

        db.merge(activity)
        db.commit()
        enriched.append(activity)

    #if less than 4
    if len(enriched) < 4:
        needed = 4 - len(enriched)

        db_matches = (
            db.query(Activity)
            .filter(Activity.mood == mood)
            .order_by(desc(Activity.score))
            .limit(needed)
            .all()
        )

        for a in db_matches:
            if a.id not in {e.id for e in enriched}:
                enriched.append(a)

    ranked = sorted(enriched, key=lambda x: x.score, reverse=True)

    return [
        {
            "id": a.id,
            "rank": i + 1,
            "name": a.name,
            "description": a.description,
            "distance": a.distance,
            "tag": mood.capitalize(),
        }
        for i, a in enumerate(ranked[:4])
    ]

     
    