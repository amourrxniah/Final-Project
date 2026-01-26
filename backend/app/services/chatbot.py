from app.services.intent import detect_intent
from app.database import SessionLocal
from app.models.response import ChatResponse

def get_ai_response(messages, mood: str):
    """
    messages: list of {role, content}
    mood: selected mood from frontend
    """

    if not messages:
        return "Hey! How are you feeling today? 😊"
    
    user_message = messages[-1]["content"]

    intent = detect_intent(user_message)
    
    #get response from DB
    db = SessionLocal()

    response = (
        db.query(ChatResponse)
        .filter(ChatResponse.intent == intent)
        .order_by(ChatResponse.id.desc())
        .first()
    )
    db.close()

    if response:
        return response.text
    
    return "I didn't quite get that — can you rephrase?"