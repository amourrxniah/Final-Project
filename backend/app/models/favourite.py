from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Favourite(Base):
    __tablename__ = "favourites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=True)
    virtual_activity_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship(
        "User", 
        back_populates="favourites"
    )
    activity = relationship(
        "Activity", 
        back_populates="favourited_by"
    )