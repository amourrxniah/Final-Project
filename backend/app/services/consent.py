from sqlalchemy.orm import Session
from app.models.consent import UserConsent

def get_consent(db: Session, user_id: int):
    return db.query(UserConsent).filter(
        UserConsent.user_id == user_id
    ).first()

def save_consent(db: Session, user_id: int):
    consent = get_consent(db, user_id)
    if consent:
        return consent 
    
    consent = UserConsent(user_id=user_id)
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent