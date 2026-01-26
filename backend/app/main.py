from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers.chat import router as chat_router
from app.routers.context import router as context_router
from app.services.weather import get_weather
from app.routers import recommendations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MoodSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(context_router)
app.include_router(recommendations.router)
