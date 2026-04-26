from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, index=True)
    activity_id = Column(Integer, index=True)

    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
        )
