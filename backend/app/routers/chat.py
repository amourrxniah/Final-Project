from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot import get_ai_response
from app.models.chat import ChatMessage

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    
    #save user messages
    for m in req.messages:
        db.add(ChatMessage(
            session_id=req.session_id,
            role=m.role,
            content=m.content,
            mood=req.mood
        ))

    db.commit()

    reply = get_ai_response(
        messages=[m.dict() for m in req.messages],
        mood=req.mood
    )

    #save ai reply 
    db.add(ChatMessage(
        session_id=req.session_id,
        role="assistant",
        content=reply,
        mood=req.mood
    ))
    db.commit()

    return {"reply": reply}
