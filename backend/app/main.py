from fastapi import FastAPI
from services.weather import get_weather
from services.activities import get_nearby_activities
from recommender import recommend

app = FastAPI(title="MoodSync API")

@app.get("/recommend")
def get_recommendation(
    mood: str,
    lat: float,
    lon: float
):
    weather = get_weather()
    activities = get_nearby_activities(lat, lon)
    recommendations = recommend(mood, weather["condition"], activities)

    return {
        "weather": weather,
        "recommendations": recommendations
    }