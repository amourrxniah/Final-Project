from sqlalchemy import Column, String, Float, Integer
from app.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    distance = Column(Float)
    mood = Column(String)
    weather = Column(String)
    score = Column(Float)