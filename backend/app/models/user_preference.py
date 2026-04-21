from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class UserPreference(Base):
    __tablename__= "user_preferences"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, index=True)

    # type = category/mood/time
    type = Column(String, index=True)

    key = Column(String, index=True)  #cafe, park, night
    weight = Column(Float, default=0.0)