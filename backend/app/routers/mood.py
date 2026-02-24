from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from pydantic import BaseModel
from collections import Counter

from app.database import get_db
from app.models.mood_log import MoodLog
from app.models.activity_log import ActivityLog
from app.services.security import get_current_user

router = APIRouter(prefix="/mood", tags=["mood"])

class MoodRequest(BaseModel):
    mood: str

@router.post("/log")
def log_mood(
    data: MoodRequest,
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    today = date.today()

    entry = MoodLog(
        user_id=user.id, 
        mood=data.mood
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

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    logs = db.query(MoodLog).filter(
        MoodLog.user_id == user.id
    ).all()

    #most common mood
    moods = [l.mood for l in logs]
    
    most_common = None
    if moods:
        most_common = Counter(moods).most_common(1)[0][0]

    return {
        "total_syncs": user.total_syncs,
        "current_streak": user.current_streak,
        "most_common_mood": most_common
    }

@router.get("/trend")
def get_7_day_trend(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    today = date.today()
    seven_days_ago = today - timedelta(days=6)

    logs = db.query(MoodLog).filter(
        MoodLog.user_id == user.id,
        MoodLog.timestamp >= seven_days_ago
    ).all()

    mood_map = {
        "low": 0,
        "neutral": 1,
        "high": 2
    }

    trend = []

    for i in range(7):
        day = seven_days_ago + timedelta(days=i)

        day_log = next(
            (l for l in logs if l.timestamp.date() == day), 
            None
        )

        value = mood_map.get(day_log.mood, 0) if day_log else 0

        trend.append({
            "day": day.strftime("%a"),
            "value": value
        })

    return trend

@router.post("/activity/view")
def log_activity_view(
    data: dict, 
    db: Session= Depends(get_db), 
    user=Depends(get_current_user)
):
    entry = ActivityLog(
        user_id=user.id,
        activity_id=data.get("id"),
        title=data.get("title", "Unknown")
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