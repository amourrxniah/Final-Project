from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers.chat import router as chat_router
from pydantic import BaseModel
from typing import List, Optional
from app.services.chatbot import get_ai_response
from services.weather import get_weather

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MoodSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/context")
def get_context(lat: float, lon: float):
    weather = get_weather(lat, lon)

    return {
        "weather": weather
    }