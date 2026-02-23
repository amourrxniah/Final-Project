from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.consent import get_consent, save_consent

router = APIRouter(prefix="/consent", tags=["Consent"])

@router.get("/me")
def check_consent(user_id: str, db: Session = Depends(get_db)):
    consent = get_consent(db, user_id)
    if not consent:
        raise HTTPException(status_code=404)
    return consent

@router.post("/accept")
def accept_consent(user_id: str, db: Session = Depends(get_db)):
    return save_consent(db, user_id)