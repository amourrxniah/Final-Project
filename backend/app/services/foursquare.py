import requests
import time
from app.config import FOURSQUARE_API_KEY

BASE_URL = "https://api.foursquare.com/v3/places/search"

# curated categories
CATEGORY_IDS = [
    "13065", # restaurant 
    "13032", # cafe 
    "10027", # museum 
    "10000", # arts + entertainment 
    "16000", # park/outdoors 
    "18000", # sports/fitness 
]

# -------------------- FETCH PLACES --------------------
def get_places(lat, lon, limit=30):
    headers = {
         "Authorization": FOURSQUARE_API_KEY,
         "Accept": "application/json"
    }

    params = {
         "ll": f"{lat},{lon}",
         "radius": 5000,
         "limit": limit,
         "categories": ",".join(CATEGORY_IDS),
         "sort": "RELEVANCE"
    }

    for attempt in range(2):
        try:
            res = requests.get(BASE_URL, headers=headers, params=params, timeout=6)
            res.raise_for_status()
            data = res.json()
            break
        except Exception as e:
            print(f"Foursquare error attempt {attempt+1}:", e)
            if attempt == 1:
                return []
            time.sleep(1)

    results = data.get("results", [])
    places = []

    for p in results:
        try:
            geocode = p.get("geocodes", {}).get("main", {})
            if not geocode:
                continue

            categories = p.get("categories", [])
            category_names = [c.get("name", "") for c in categories]

            places.append({
                "place_id": p.get("fsq_id"),
                "title": p.get("name", "Unknown"),
                "subtitle": p.get("location", {}).get("formatted_address", ""),
                "categories": category_names,
                "category_names": category_names,
                "lat": geocode.get("latitude"),
                "lon": geocode.get("longitude"),
                "distance": (p.get("distance", 0) or 0) / 1000,

                # fallback scoring
                "rating": 4.2,
                "price": p.get("price", 2) or 2,
                "popularity": 0.7,
            })

        except Exception as e:
            print("Parsing error:", e)
            continue
        
    return places