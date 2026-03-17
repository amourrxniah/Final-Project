from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime, timezone
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
def get_trend(
    mode: str,
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    now = datetime.now(timezone.utc)

    # --- DEFAULT RANGES ---
    if mode == "live":
        start = now - timedelta(hours=24)
        bucket_minutes = 60
    
    elif mode == "yesterday":
        start = now - timedelta(days=1)
        bucket_minutes = 120

    elif mode == "week":
        start = now - timedelta(days=7)
        bucket_minutes = 720
    
    elif mode == "month":
        start = now - timedelta(days=30)
        bucket_minutes = 1440
    
    else:
        start = now - timedelta(days=7)
        bucket_minutes = 720

    logs = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == user.id)
        .filter(MoodLog.timestamp >= start)
        .order_by(MoodLog.timestamp)
        .all()
    )

    mood_map = {
        "low": 0,
        "neutral": 1,
        "high": 2,
    }

    buckets = {}

    for log in logs:
        delta = log.timestamp - start
        bucket = int(delta.total_seconds() / (bucket_minutes * 60))

        value = mood_map.get(log.mood, 1)

        if bucket not in buckets:
            buckets[bucket] = []

        buckets[bucket].append(value)
    
    max_bucket = int((now - start).total_seconds() / (bucket_minutes * 60))

    result = []

    for i in range(max_bucket + 1):

        if i in buckets:
            avg = round(sum(buckets[i]) / len(buckets[i]))
            has_data = True
        else:
            avg = 1
            has_data = False

        time_point = start + timedelta(minutes=i * bucket_minutes)

        if mode in ["live", "yesterday"]:
            label = time_point.strftime("%H:%M")
        else:
            label = time_point.strftime("%d %b")
            
        result.append({
            "value": avg,
            "time": label,
            "has_data": has_data 
        })

    return result

@router.post("/activity/view")
def log_activity_view(
    data: dict, 
    db: Session= Depends(get_db), 
    user=Depends(get_current_user)
):
    existing = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_id == data.get("id")
    ).first()

    if not existing:
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
    activity_logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).all()

    mood_logs = db.query(MoodLog).filter(
        MoodLog.user_id == user.id
    ).all()

    combined = []

    for a in activity_logs:
        combined.append({
            "type": "activity",
            "activity_id": a.activity_id,
            "title": a.title,
            "timestamp": a.timestamp
        })

    for m in mood_logs:
        combined.append({
            "type": "mood",
            "mood": m.mood,
            "timestamp": m.timestamp
        })

    combined.sort(key=lambda x: x["timestamp"], reverse=True)

    return combined[:15]