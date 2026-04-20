from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.consent import get_consent, save_consent

router = APIRouter(prefix="/consent", tags=["Consent"])

@router.get("/me")
def check_consent(user_id: int, db: Session = Depends(get_db)):
    consent = get_consent(db, user_id)
    
    if not consent:
        return {"accepted": False}
    
    return {
        "accepted": True,
        "data": consent
    }

@router.post("/accept")
def accept_consent(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    device_id = data.get("device_id")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    return save_consent(db, user_id, device_id)