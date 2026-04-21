import requests
import time
from app.config import GEOAPIFY_API_KEY

BASE_URL = "https://api.geoapify.com/v2/places"

# curated categories
CATEGORIES = [
    "catering.restaurant",
    "catering.cafe",
    "entertainment.cinema",
    "tourism.museum",
    "leisure.park",
    "sport.fitness",
]

# -------------------- FETCH PLACES --------------------
def get_places(lat, lon, limit=30):
    params = {
         "categories": ",".join(CATEGORIES),
         "filter": f"circle:{lon},{lat},5000",
         "limit": limit,
         "apiKey": GEOAPIFY_API_KEY,
    }

    data = None

    for attempt in range(3):
        try:
            res = requests.get(BASE_URL, params=params, timeout=8)

            if res.status_code == 401:
                print("GEOAPIFY 401 - check API key")
                return []
            
            if res.status_code == 400:
                print("GEOAPIFY 400 BAD REQUEST:", res.text)
                return []
            
            res.raise_for_status()
            data = res.json()
            break

        except requests.exceptions.Timeout:
            print(f"Geoapify timeout attempt {attempt+1}")
            time.sleep(1)

        except Exception as e:
            print(f"Geoapify error:", e)
            return []
    
    if not data:
        return []
    
    features = data.get("features", [])
    places = []

    for f in features:
        try:
            props = f.get("properties", {})
            coords = f.get("geometry", {}).get("coordinates", [])
            
            if not coords or len(coords) < 2:
                continue

            categories = props.get("categories", []) or []

            places.append({
                "place_id": props.get("place_id"),
                "title": props.get("name", "Unknown"),
                "subtitle": props.get("formatted", ""),
                "categories": categories,
                "category_names": categories,
                "latitude": coords[1],
                "longitude": coords[0],
                "distance": (props.get("distance", 0) or 0) / 1000,

                # fallback scoring
                "rating": 4.2,
                "price": 2,
                "popularity": 0.7,
            })

        except Exception as e:
            print("Parsing error:", e)
            continue
        
    return places