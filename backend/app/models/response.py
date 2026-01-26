from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class ChatResponse(Base):
    __tablename__ = "chat_responses"

    id = Column(Integer, primary_key=True, index=True)
    intent = Column(String, index=True)
    text = Column(Text)