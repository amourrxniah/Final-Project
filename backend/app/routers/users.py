from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/anonymous")
def create_anonymous_user(data: dict, db: Session = Depends(get_db)):
    device_id = data.get("device_id")
    
    if not device_id:
        return {"error": "device_id required"}
    
    #reuse existing user if device_id already exists
    user = db.query(User).filter(User.device_id == device_id).first()

    if not user:
        user = User(
            device_id=device_id,
            provider="anonymous"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {"id": user.id}

@router.post("/link-device")
def link_device(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    device_id = data.get("device_id")

    if not user_id or not device_id:
        raise HTTPException(400, "user_id and device_id required")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.device_id = device_id
    db.commit()

    return {"status": "linked"}