import requests
from config import WEATHERSTACK_API_KEY

def get_weather(city="London"):
    url = "http://api.weatherstack.com/current"
    params = {
        "access_key": WEATHERSTACK_API_KEY,
        "query": city
    }

    response = requests.get(url, params=params)
    data = response.json()
    
    return {
        "temperature": data["current"]["temperature"],
        "condition": data["current"]["weather_descriptions"][0]
    }