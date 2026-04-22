from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_preference import UserPreference

router = APIRouter(prefix="/interactions", tags=["Interactions"])

# -------------------- HELPER --------------------
def update_weight(db, user_id, pref_type, key, delta):
    pref = db.query(UserPreference).filter_by(
        user_id=user_id,
        type=pref_type,
        key=key
    ).first()

    if not pref:
        pref = UserPreference(
            user_id=user_id,
            type=pref_type,
            key=key,
            weight=0
        )
        db.add(pref)
    
    pref.weight += delta

# -------------------- MAIN ENDPOINT --------------------
@router.post("/")
def track_interaction(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    interaction_type = data.get("type")

    if not user_id:
        return {"status": "no user"}
    
    # ----- CLICK -----
    if interaction_type == "click":
        categories = data.get("categories", [])
        mood = data.get("mood")
        time_of_day = data.get("timeOfDay")

        for c in categories:
            update_weight(db, user_id, "category", c.lower(), +1.0)

        if mood:
            update_weight(db, user_id, "mood", mood.lower(), +0.5)

        if time_of_day:
            update_weight(db, user_id, "time", time_of_day.lower(), +0.3)

    # ----- SKIP -----
    elif interaction_type == "skip":
        activities = data.get("activities", [])
        categories = data.get("categories", [])
        mood = data.get("mood")

        for c in categories:
            update_weight(db, user_id, "category", c.lower(), -0.2)

        if mood:
            update_weight(db, user_id, "mood", mood.lower(), -0.1)

    db.flush()
    db.commit()


    return {"status": "ok"}
