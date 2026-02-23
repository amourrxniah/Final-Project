from datetime import datetime
import requests

from app.services.intent import detect_intent
from app.database import SessionLocal
from app.models.response import ChatResponse
from app.config import OPENWEATHERMAP_API_KEY

def get_time_of_day():
    hour = datetime.now().hour
    if hour < 12:
        return "morning"
    if hour < 18:
        return "afternoon"
    return "evening"

def get_weather():
    try:
        lat, lon = 51.5074, -0.1278
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
        )
        r = requests.get(url, timeout=3)
        data = r.json()
        return data["weather"][0]["main"].lower()
    except Exception:
        return "clear"
    
def generate_human_fallback(mood: str):
    tod = get_time_of_day()
    weather = get_weather()

    base = f"Good {tod}! "

    if mood == "low":
        return base + (
            f"It's {weather} outside. Maybe something gently like a short walk, "
            f"journaling, or a warm drink could help a little. I'm here with you."
        )
    elif mood == "high":
        return base + (
            f"Love the energy! Since it's {weather}, maybe try an outdoor activity "
            f"or meet a friend."
        )
    else:
        return base + (
            f"How about doing something refreshing? Since it's {weather}, "
            f"a change of scenery might feel nice."
        )

def get_ai_response(messages, mood: str):
    if not messages:
        return "Hey! How are you feeling today? 😊"
    
    user_message = messages[-1]["content"]
    intent = detect_intent(user_message)

    #greetings should feel human
    if intent == "greeting":
        tod = get_time_of_day()
        return f"Hey there! Good {tod} 😊 How can I help you today?"
    
    #get response from DB
    db = SessionLocal()

    try:
        #only reuse DB answers for specific knowledge intents
        if intent in ["moodsync_explain"]:
            response = (
                db.query(ChatResponse)
                .filter(ChatResponse.intent == intent)
                .order_by(ChatResponse.id.desc())
                .first()
            )

            if response:
                return response.text
        
        #generate new contextual response
        reply = generate_human_fallback(mood)

        #save it so it learned
        learned = ChatResponse(intent=intent, text=reply)
        db.add(learned)
        db.commit()

        return reply
        
    finally:
        db.close()