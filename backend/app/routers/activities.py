from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.favourite import Favourite
from app.models.activity import Activity
from app.models.activity_log import ActivityLog
from app.services.security import get_current_user
from app.models.feedback import Feedback

router = APIRouter(prefix="/activities", tags=["activities"])

@router.get("/my")
def get_my_activities(
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):

    # get user interaction IDs
    fav_ids = {
        f.activity_id 
        for f in db.query(Favourite)
        .filter(Favourite.user_id == user.id)
        .order_by(Favourite.id.desc())
    }

    done_ids = {
        l.activity_id 
        for l in db.query(ActivityLog)
        .filter(ActivityLog.user_id == user.id)
        .all()
    }

    feedbacks = db.query(Feedback).filter(
        Feedback.user_id == user.id
    ).all()

    feedback_map = {
        f.activity_id: f 
        for f in feedbacks
    }
    
    result = []

    # combine ALL interacted activity IDs
    interacted_ids = set()
    interacted_ids.update(fav_ids)
    interacted_ids.update(done_ids)
    interacted_ids.update(feedback_map.keys())

    if not interacted_ids:
        return []

    # only fetch activities the user interacted with
    activities = db.query(Activity).filter(
        Activity.id.in_(interacted_ids)
    ).all()

    result = []

    for activity in activities:
        feedback = feedback_map.get(activity.id)

        is_favourite = activity.id in fav_ids
        is_done = activity.id in done_ids
        is_liked = feedback.type == "up" if feedback else False
        is_disliked = feedback.type == "down" if feedback else False
        
        #only include activities user interacted with
        result.append({
            "id": activity.id,
            "title": activity.title,
            "description": activity.subtitle,

            "category_names": activity.category_names,
            "categories": activity.categories,

            "latitude": activity.latitude,
            "longitude": activity.longitude,

            "price": activity.price,
            "rating": feedback.rating if feedback else activity.rating,

            # user state
            "is_favourite": is_favourite,
            "is_helpful": is_liked,
            "not_for_me": is_disliked,
            "is_done": is_done,
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
    user=Depends(get_current_user)
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

    results = [
        {
            "id": a.id,
            "title": a.title,
            "description": a.subtitle
        }
        for a in ranked if score(a) > 0
    ][:8] # limit results

    return results