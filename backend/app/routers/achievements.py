from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.security import get_current_user
from app.models.favourite import Favourite

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("")
def get_achievements(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # count activities via favourites
    activities_count = (
        db.query(Favourite)
        .filter(Favourite.user_id == user.id)
        .count()
    )
    
    achievements = [
        {
            # first sync
            "title": "First Sync",
            "desc": "Completed your first mood sync",
            "completed": user.total_syncs >= 1,
        },
        {
            # getting started
            "title": "Getting Started",
            "desc": "Completed 5 mood logs",
            "completed": user.total_syncs >= 5,
        },
        {
            # self aware
                "title": "Self Aware",
                "desc": "Completed 20 mood syncs",
                "completed": user.total_syncs >= 20,
        },
        {
            # streak
                "title": "Consistency King",
                "desc": "Maintained a 30-day streak",
                "completed": user.current_streak >= 30,
        },
        {
            # streak
                "title": "Weekly Warrior",
                "desc": "7 day streak",
                "completed": user.current_streak >= 7,
        },
        {
            # explorer
                "title": "Activity Explorer",
                "desc": "Tried 15 activities",
                "completed": activities_count >= 15
        
        },
        {
            # legend
                "title": "Legend",
                "desc": "100 total syncs",
                "completed": user.total_syncs >= 100,
        },
    ]

    return achievements