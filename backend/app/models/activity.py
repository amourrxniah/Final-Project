from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True)
    place_id = Column(String, unique=True, index=True)

    title = Column(String)
    subtitle = Column(String)

    categories = Column(JSON)
    category_names = Column(JSON)

    latitude = Column(Float)
    longitude = Column(Float)

    rating = Column(Float)
    price = Column(Integer)
    popularity = Column(Float)

    mood = Column(String)
    weather = Column(String)
    score = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    favourited_by = relationship(
        "Favourite",
        back_populates="activity",
        cascade="all, delete"
    )