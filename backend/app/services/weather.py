import requests
from app.config import OPENWEATHERMAP_API_KEY

def get_weather(lat: float, lon: float):
    res = requests.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHERMAP_API_KEY,
            "units": "metric"
        },
        timeout=10
    )
    
    data = res.json()

    if "weather" not in data or "main" not in data:
        print("Weather API error:", data)
        return None
    
    return {
        "condition": data["weather"][0]["description"],
        "temperature": round(data["main"]["temp"])
    }