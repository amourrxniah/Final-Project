import requests
from config import OPENTRIPMAP_API_KEY

def get_nearby_activities(lat, lon, radius=5000):
    url = "https://api.opentripmap.com/0.1/en/places/radius"
    
    params = {
        "radius": radius,
        "lat": lat,
        "lon": lon,
        "rate": 2,
        "format": "json",
        "apikey": OPENTRIPMAP_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()
    
    activities = []
    for item in data:
        activities.append({
            "name": item.get("name"),
            "kind": item.get("kinds"),
            "distance": item.get("dist")
        })
    
    return activities