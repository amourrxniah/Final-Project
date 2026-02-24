from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

from app.models.user import User
from app.models.consent import UserConsent

from app.routers.chat import router as chat_router
from app.routers.users import router as users_router
from app.routers.context import router as context_router
from app.routers.recommendations import router as recommendations_router
from app.routers.favourites import router as favourites_router
from app.routers.consent import router as consent_router
from app.routers.auth import router as auth_router
from app.routers.mood import router as mood_router

from dotenv import load_dotenv
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MoodSync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(users_router)
app.include_router(context_router)
app.include_router(recommendations_router)
app.include_router(favourites_router) 
app.include_router(consent_router)
app.include_router(auth_router)
app.include_router(mood_router)

@app.get("/")
def health():
    return {"status": "ok"}
