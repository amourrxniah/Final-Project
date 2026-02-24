from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.user import User
from app.models.activity import Activity

class Favourite(Base):
    __tablename__ = "favourites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="favourites")
    activity = relationship("Activity", back_populates="favourited_by")

#add relationship in User model:
User.favourites = relationship("Favourite", back_populates="user", cascade="all, delete-orphan")

#add relationship in Activity model:
Activity.favourited_by = relationship("Favourite", back_populates="activity", cascade="all, delete-orphan")