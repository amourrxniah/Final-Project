from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    device_id = Column(String, unique=True, nullable=True)  
    accepted = Column(Boolean, default=False)
    accepted_at = Column(DateTime(timezone=True), server_default=func.now())