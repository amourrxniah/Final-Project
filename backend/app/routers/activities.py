from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.favourite import Favourite
from app.models.activity import Activity
from app.models.activity_log import ActivityLog
from app.services.security import get_current_user
from app.models.feedback import Feedback

router = APIRouter(prefix="/activities", tags=["activities"])

# helpers
def calc_trending_score(activity, fav_count, done_count, avg_rating):
    """
    REAL trending logic:
    - popularity (global)
    - engagement (favourites + completions)
    - rating quality
    - recency boost
    """

    base = (fav_count * 2) + (done_count * 3) + (avg_rating or 0)

    # recency boost (last 7 days)
    days_since = (datetime.now(timezone.utc) - activity.created_at).days
    recency_boost = max(0, 7 - days_since)

    return base + recency_boost

# main user data
@router.get("/my")
def get_my_activities(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    # user data
    favs = db.query(Favourite).filter(
        Favourite.user_id == user.id).all()
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id).all()
    feedbacks = db.query(Feedback).filter(
        Feedback.user_id == user.id).all()
    
    fav_ids = {f.activity_id for f in favs}
    done_map = {l.activity_id: l for l in logs}
    feedback_map = {f.activity_id: f for f in feedbacks}

    # only interacted ids
    interacted_ids = fav_ids | set(done_map.keys()) | set(feedback_map.keys())

    if not interacted_ids:
        return []
    
    activities = db.query(Activity).filter(
        Activity.id.in_(interacted_ids)
    ).all()
    
    # global data for trending
    all_favs = db.query(Favourite).all()
    all_logs = db.query(ActivityLog).all()
    all_feedback = db.query(Feedback).all()

    fav_count_map = {}
    done_count_map = {}
    rating_map = {}

    for f in all_favs:
        fav_count_map[f.activity_id] = fav_count_map.get(f.activity_id, 0) + 1
    
    for l in all_logs:
        done_count_map[l.activity_id] = done_count_map.get(l.activity_id, 0) + 1
    
    for fb in all_feedback:
        if fb.rating:
            rating_map.setdefault(fb.activity_id, []).append(fb.rating)

    avg_rating_map = {
        k: sum(v) / len(v) for k, v in rating_map.items()
    }

    result = []

    for a in activities:
        fb = feedback_map.get(a.id)

        is_favourite = a.id in fav_ids
        is_done = a.id in done_map
        is_liked = fb.type == "up" if fb else False
        is_disliked = fb.type == "down" if fb else False
        
        trending_score = calc_trending_score(
            a,
            fav_count_map.get(a.id, 0),
            done_count_map.get(a.id, 0),
            avg_rating_map.get(a.id, a.rating or 0),
        )

        #only include activities user interacted with
        result.append({
            "id": a.id,
            "title": a.title,
            "subtitle": a.subtitle,
            "description": a.subtitle,

            "category_names": a.category_names,
            "category": (a.category_names or ["other"])[0],

            "latitude": a.latitude,
            "longitude": a.longitude,

            "price": a.price,
            "rating": fb.rating if fb and fb.rating is not None else a.rating,

            # user state
            "is_favourite": is_favourite,
            "is_liked": is_liked,
            "is_disliked": is_disliked,
            "is_done": is_done,
            "completed_at": done_map[a.id].timestamp if is_done else None,

            # trending
            "trending_score": trending_score
        })

    return result

@router.post("/log/{activity_id}")
def log_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    existing = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_id == activity_id
    ).first()

    if existing:
        return {"message": "Already logged"}
    
    activity = db.query(Activity).filter(
        Activity.id == activity_id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    log = ActivityLog(
        user_id=user.id,
        activity_id=activity_id,
        title=activity.title
    )

    db.add(log)
    db.commit()

    return {"status": "Activity logged successfully"}

@router.get("/search")
def search_activities(
    q: str,
    db: Session = Depends(get_db),
):
    if not q:
        return []
    
    query = q.lower()
    activities = db.query(Activity).all()

    def score(activity):
        title = activity.title.lower()
        score = 0
        if title.startswith(query):
            score += 3
        if query in title:
            score += 2
        return score
    
    ranked = sorted(
        activities, 
        key=score, 
        reverse=True
    )

    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.subtitle
        }
        for a in ranked if score(a) > 0
    ][:8] # limit results