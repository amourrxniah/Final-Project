from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_preference import UserPreference

router = APIRouter(prefix="/interactions", tags=["Interactions"])

# -------------------- HELPER --------------------
def update_weight(db, user_id, pref_type, key, delta):
    if not key:
        return
    
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
    
    activities = data.get("activities", [])
    categories = data.get("categories", [])
    mood = data.get("mood")
    time_of_day = data.get("time_of_day")
    
    # ----- CLICK -----
    if interaction_type == "click":
        for c in categories:
            update_weight(db, user_id, "category", c.lower(), +1.0)

        update_weight(db, user_id, "mood", mood, +0.5)
        update_weight(db, user_id, "time", time_of_day, +0.3)

    # ----- SKIP -----
    elif interaction_type == "skip_batch":
        
        for item in activities:
            for c in item.get("categories", []):
                update_weight(db, user_id, "category", c.lower(), -0.15)

        update_weight(db, user_id, "mood", mood, -0.1)

    db.commit()

    return {"status": "ok"}
