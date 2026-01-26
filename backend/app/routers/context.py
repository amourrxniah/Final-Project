from fastapi import APIRouter
from app.services.weather import get_weather

router = APIRouter(
    prefix="/context",
    tags=["Context"]
)

@router.get("/")
def get_context(lat: float, lon: float):
    weather = get_weather(lat, lon)
    return {"weather": weather}