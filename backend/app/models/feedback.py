from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_id = Column(Integer, ForeignKey("activities.id"))
    
    type = Column(String, nullable=True) #up/down
    rating = Column(Integer, nullable=True) #1-5

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    #prevent fuplicate feedback
    __table_args__ = (
        UniqueConstraint(
            "user_id", 
            "activity_id", 
            name="unique_user_activity_feedback"
        ),
    )