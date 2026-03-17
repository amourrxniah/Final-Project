from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate
from app.services.security import get_current_user

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/")
def save_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    activity_id = data.activity_id
    feedback_type = data.feedback
    rating = data.rating

    #check if feedback already exists
    existing = db.query(Feedback).filter(
        Feedback.user_id == user.id,
        Feedback.activity_id == activity_id
    ).first()

    if existing:

        if feedback_type is not None:
            existing.type = feedback_type
        
        if rating is not None:
            existing.rating = rating

    else:
        new_feedback = Feedback(
            user_id=user.id,
            activity_id=activity_id,
            type=feedback_type,
            rating=rating
        )

        db.add(new_feedback)
    
    db.commit()

    return {"success": True}

@router.get("/{activity_id}")
def get_feedback(
    activity_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    feedback = db.query(Feedback).filter(
        Feedback.user_id == user.id,
        Feedback.activity_id == activity_id
    ).first()

    if not feedback:
        return {}
    
    return {
        "type": feedback.type,
        "rating": feedback.rating
    }