from sqlalchemy import Column, Integer, String, Date, Boolean
from app.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String)
    provider = Column(String, default="manual") # google | apple | manual | anonymous
    device_id = Column(String, unique=True, nullable=True)
    date_of_birth = Column(Date)
    is_verified = Column(Boolean, default=False)

    total_syncs = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    last_logged_date = Column(Date, nullable=True)

    favourites = relationship(
        "Favourite",
        back_populates="user",
        cascade="all, delete"
    )