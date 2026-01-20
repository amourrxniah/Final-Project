import requests
from app.config import WEATHERSTACK_API_KEY


def get_weather(lat: float, lon: float):
    url = "http://api.weatherstack.com/current"
    params = {
        "access_key": WEATHERSTACK_API_KEY,
        "query": f"{lat}, {lon}",
        "units": "m"
    }

    res = requests.get(url, params=params)
    data = res.json()
    
    return {
        "condition": data["current"]["weather_descriptions"][0],
        "temperature": data["current"]["temperature"]
    }