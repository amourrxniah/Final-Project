from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.favourite import Favourite
from app.models.activity import Activity
from app.schemas.favourite import FavouriteCreate, FavouriteResponse
from app.services.security import get_current_user

router = APIRouter(prefix="/favourites", tags=["Favourites"])

@router.post("", response_model=FavouriteResponse)
def create_favourite(
    fav: FavouriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if the activity exists
    activity = db.query(Activity).filter(Activity.id == fav.activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Check if the user has already favourited this activity
    existing = db.query(Favourite).filter(
        Favourite.user_id == current_user.id,
        Favourite.activity_id == fav.activity_id
    ).first()
    if existing:
        return existing

    # Create new favourite
    favourite = Favourite(user_id=current_user.id, activity_id=fav.activity_id)
    
    db.add(favourite)
    db.commit()
    db.refresh(favourite)
    return favourite

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favourite(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favourite = db.query(Favourite).filter(
        Favourite.user_id == current_user.id,
        Favourite.activity_id == activity_id
    ).first()

    if not favourite:
        raise HTTPException(status_code=404, detail="Favourite not found")

    db.delete(favourite)
    db.commit()
    return