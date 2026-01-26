import requests
from app.config import OPENTRIPMAP_API_KEY

BASE_URL = "https://api.opentripmap.com/0.1/en/places"

MOOD_KINDS = {
    "low": [
        "libraries",
        "parks",
        "gardens",
        "spas",
        "museums"
    ],
    "neutral": [
        "cafes",
        "cinemas",
        "shopping",
        "galleries"
    ],
    "high": [
        "bars",
        "pubs",
        "nightclubs",
        "music_venues",
        "sport"
    ]
}

INDOOR_ONLY = {
    "libraries",
    "cinemas",
    "museums",
    "galleries",
    "cafes",
    "shopping"
}

def get_places(lat, lon, mood, weather):
    kinds = MOOD_KINDS.get(mood, ["interesting_places"])

    #weather filter
    if weather and "rain" in weather.lower():
        kinds = [k for k in kinds if k in INDOOR_ONLY]

    response = requests.get(
        f"{BASE_URL}/radius",
        params={
            "radius": 4000,
            "lat": lat,
            "lon": lon,
            "kinds": ",".join(kinds),
            "rate": 2,
            "limit": 8,
            "apikey": OPENTRIPMAP_API_KEY,
        }
    )

    data = response.json()
    results = []

    for place in data.get("features", []):
        p = place["properties"]

        results.append({
            "xid": p["xid"],
            "name": p.get("name", "Unknown place"),
            "distance": round(p.get("dist", 0) / 1609, 1)
        })
    return results
    
def get_place_details(xid):
    res = requests.get(
        f"{BASE_URL}/xid/{xid}",
        params={"apikey": OPENTRIPMAP_API_KEY}
    )
    return res.json()