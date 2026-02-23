import requests
from app.config import GEOAPIFY_API_KEY

BASE_URL = "https://api.geoapify.com/v2/places"

BASE_CATEGORIES = [
    "catering",
    "entertainment",
    "leisure",
    "tourism",
    "sport",
    "commercial",
]

# -------------------- FETCH PLACES --------------------
def get_places(lat, lon, limit=30):
    params = {
        "categories": ",".join(BASE_CATEGORIES),
        "filter": f"circle:{lon},{lat},5000",
        "limit": limit,
        "apiKey": GEOAPIFY_API_KEY
    }

    try:
        res = requests.get(BASE_URL, params=params, timeout=0.5)
        res.raise_for_status()
    except Exception as e:
        print("Geoapify error:", e)
        return []
    
    data = res.json()
    features = data.get("features", [])

    places = []
    for f in features:
        p = f.get("properties", {})
        g = f.get("geometry", {}).get("coordinates", [None, None])

        if not g[0] or not g[1]:
            continue

        places.append({
            "place_id": p.get("place_id"),
            "title": p.get("name", "Unamed Place"),
            "subtitle": p.get("address_line2", ""),
            "categories": p.get("categories", []),
            "category_names": [c.split(".")[-1] for c in p.get("categories", [])],
            "lat": g[1],
            "lon": g[0],
            "distance": (p.get("distance", 0)  or 0)/ 1000,
            "rating": p.get("rating", 0),
            "price": p.get("price_level", 0),
            "popularity": p.get("popularity", 0),
        })

    return places