from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.favourite import Favourite
from app.models.activity import Activity
from app.models.activity_log import ActivityLog
from app.services.security import get_current_user
from app.models.feedback import Feedback
from app.routers.recommendations import WELLBEING_ACTIVITIES

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

    base = (
        fav_count * 2 
        + done_count * 3
        + (avg_rating or 0)
    )

    # wellbeing dict
    if isinstance(activity, dict):
        return base

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
        Favourite.user_id == user.id
    ).all()

    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).all()

    feedbacks = db.query(Feedback).filter(
        Feedback.user_id == user.id
    ).all()
    
    # normal ids
    fav_ids = {
        f.activity_id 
        for f in favs
        if f.activity_id is not None
    }

    done_map = {
        l.activity_id: l 
        for l in logs
        if l.activity_id is not None
    }
    
    feedback_map = {
        f.activity_id: f 
        for f in feedbacks
        if f.activity_id is not None
    }

    # virtual wellbeing ids
    fav_virtual_ids = {
        f.virtual_activity_id
        for f in favs
        if f.virtual_activity_id
    }

    done_virtual_map = {
        l.virtual_activity_id: l
        for l in logs
        if l.virtual_activity_id
    }

    feedback_virtual_map = {
        f.virtual_activity_id: f
        for f in feedbacks
        if f.virtual_activity_id
    }

    # only interacted ids
    interacted_ids = (
        fav_ids | 
        set(done_map.keys()) | 
        set(feedback_map.keys())
    )

    activities = []

    if interacted_ids:
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
        key = f.virtual_activity_id or f.activity_id
        if key is not None:
            fav_count_map[key] = (
                fav_count_map.get(key, 0) + 1
            )

    for l in all_logs:
        key = l.virtual_activity_id or l.activity_id
        if key is not None:
            done_count_map[key] = (
                done_count_map.get(key, 0) + 1
            )

    for fb in all_feedback:
        if fb.rating:
            key = fb.virtual_activity_id or fb.activity_id
            if key is not None:
                rating_map.setdefault(
                    key, 
                    []
                ).append(fb.rating)

    avg_rating_map = {
        k: sum(v) / len(v) for k, v in rating_map.items()
    }
    
    result = []
    
    # ---------- NORMAL DB ACTIVITIES ----------
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

    # ---------- VIRTUAL WELLBEING ACTIVITIES ----------
    for wb in WELLBEING_ACTIVITIES:
        wb_id = wb["id"]

        if (
            wb_id not in fav_virtual_ids and 
            wb_id not in done_virtual_map and 
            wb_id not in feedback_virtual_map
        ):
            continue

        fb = feedback_virtual_map.get(wb_id)

        is_favourite = wb_id in fav_virtual_ids
        is_done = wb_id in done_virtual_map
        is_liked = fb.type == "up" if fb else False
        is_disliked = fb.type == "down" if fb else False
        
        trending_score = calc_trending_score(
            wb,
            fav_count_map.get(wb_id, 0),
            done_count_map.get(wb_id, 0),
            avg_rating_map.get(wb_id, wb.get("rating") or 0),
        )

        #only include activities user interacted with
        result.append({
            "id": wb_id,
            "title": wb["title"],
            "subtitle": wb["subtitle"],
            "description": wb["subtitle"],

            "category_names": wb["category_names"],
            "category": (wb["category_names"] or ["wellbeing"])[0],

            "price": wb["price"],
            "rating": fb.rating if fb and fb.rating is not None else wb["rating"],
            "virtual": True,

            # user state
            "is_favourite": is_favourite,
            "is_liked": is_liked,
            "is_disliked": is_disliked,
            "is_done": is_done,
            "completed_at": (
                done_virtual_map[wb_id].timestamp 
                if wb_id in done_virtual_map 
                else None
            ),

            # trending
            "trending_score": trending_score
        })


    return result

@router.post("/log/{activity_id}")
def log_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # virtual wellbeing
    if activity_id.startswith("wb_"):

        existing = db.query(ActivityLog).filter(
            ActivityLog.user_id == user.id,
            ActivityLog.virtual_activity_id == activity_id
        ).first()
        
        if existing:
            return {"message": "Already logged"}   
    
        log = ActivityLog(
            user_id=user.id,
            virtual_activity_id=activity_id,
            title=activity_id
        )

        db.add(log)
        db.commit()
            
        return {"status": "Wellbeing activity logged successfully"}
    
    # normal activity
    activity_id_int = int(activity_id)

    existing = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.activity_id == activity_id_int
    ).first()
    
    if existing:
        return {"message": "Already logged"}   
    
    activity = db.query(Activity).filter(
        Activity.id == activity_id_int
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    log = ActivityLog(
        user_id=user.id,
        activity_id=activity_id_int,
        title=activity.title
    )

    db.add(log)
    db.commit()
        
    return {"status": "Wellbeing activity logged successfully"}

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