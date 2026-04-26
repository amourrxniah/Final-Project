from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.security import get_current_user
import os
import time

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

@router.post("/upload-profile-img")
async def  upload_profile_img(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    try:
        timestamp = int(time.time())

        filename= f"{user.id}_{timestamp}.jpg"
        file_location = os.path.join(UPLOAD_DIR, filename)

        contents = await file.read()

        with open(file_location, "wb") as f:
            f.write(contents)

        BASE_URL = "https://final-project-8-q2v4.onrender.com"

        user.profile_image = f"{BASE_URL}/uploads/{filename}"
        db.commit()

        return {"profile_image": user.profile_image}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/me")
def update_user_profile(
    data: dict,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if "name" in data:
        user.name = data["name"]

    db.commit()
    db.refresh(user)

    return {"status": "updated"}

@router.get("/settings")
def get_settings(user = Depends(get_current_user)):
    return user.settings or {}

@router.put("/settings")
def update_settings(
    data: dict = Body(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    user.settings = data
    db.commit()
    return {"status": "saved"}