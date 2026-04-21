from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from app.services.chatbot import get_ai_response
from app.models.chat import ChatMessage
from app.database import SessionLocal

router = APIRouter(prefix="/chat", tags=["Chat"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: str
    mood: str
    messages: List[Message]

class ChatAPIResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatAPIResponse)
def chat(request: ChatRequest):
    
    #save user messages
    db = SessionLocal()
    for m in request.messages:
        db_msg = ChatMessage(
            session_id=request.session_id,
            role=m.role,
            content=m.content,
            mood=request.mood
        )
        db.add(db_msg)
    db.commit()

    reply = get_ai_response([m.dict() for m in request.messages], request.mood)

    return {"reply": reply}
