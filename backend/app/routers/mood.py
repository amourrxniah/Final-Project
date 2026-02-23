from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.database import get_db
from app.database import  User
from app.models.mood_log import MoodLog
from app.models.activity_log import ActivityLog
from app.services.security import get_current_user

router = APIRouter(prefix="/mood", tags=["mood"])

@router.post("/log")
def log_mood(
    mood: str, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    today = date.today()

    entry = MoodLog(
        user_id=user.id, 
        mood=mood
    )

    db.add(entry)

    #update total syncs
    user.total_syncs += 1

    #update streak logic
    if user.last_logged_date:
        if user.last_logged_date == today:
            pass #already logged today
        
        elif user.last_logged_date == today - timedelta(days=1):
            user.current_streak += 1
        else:
            user.current_streak = 1
    else:
        user.current_streak = 1

    user.last_logged_date = today

    db.commit()

    return {"Success": True}

@router.post("/stats")
def log_mood(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    logs = db.query(MoodLog).filter(
        MoodLog.user_id == user.id
    ).all()

    #most common mood
    moods = [l.mood for l in logs]
    most_common = max(set(moods), key=moods.count) if moods else None

    return {
        "total_syncs": user.total_syncs,
        "current_streak": user.current_streak,
        "most_common_mood": most_common
    }

@router.post("/activity/view")
def log_activity_view(
    data: dict, 
    db: Session= Depends(get_db), 
    user=Depends(get_current_user)
):
    entry = ActivityLog(
        user_id=user.id,
        activity_id=data.get("id"),
        title=data["title"]
    )

    db.add(entry)
    db.commit()

    return {"Success": True}

@router.get("/activity/recent")
def recent_activity(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    activities = (
        db.query(ActivityLog).
        filter(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(10)
        .all())
    
    return activities