import requests
import time
import random
from app.config import GEOAPIFY_API_KEY

BASE_URL = "https://api.geoapify.com/v2/places"

# curated categories
CATEGORY_GROUPS = [
    ["catering.restaurant", "catering.cafe"],
    ["entertainment.cinema","entertainment.museum"],
    ["leisure.park"],
    ["sport.fitness"]
]

# -------------------- FETCH PLACES --------------------
def get_places(lat, lon, limit=30):
    all_places = []
    seen_ids = set()

    if not lat or not lon:
        return []

    per_group_limit = max(1, limit // len(CATEGORY_GROUPS))

    for group in CATEGORY_GROUPS:

        params = {
            "categories": ",".join(group),
            "filter": f"circle:{lon},{lat},5000",
            "bias": f"proximity:{lon},{lat}",
            "limit": per_group_limit,
            "lang": "en",
            "apiKey": GEOAPIFY_API_KEY,
        }

        try:
            res = requests.get(BASE_URL, params=params, timeout=8)

            if res.status_code == 401:
                print("GEOAPIFY 401 - check API key")
                return []
            
            if res.status_code == 400:
                print("GEOAPIFY 400 BAD REQUEST:", res.text)
                continue
            
            res.raise_for_status()
            data = res.json()

            features = data.get("features", [])

            for f in features:
                props = f.get("properties", {})
                coords = f.get("geometry", {}).get("coordinates", [])
                
                if not coords or len(coords) < 2:
                    continue

                pid = props.get("place_id")
                if not pid or pid in seen_ids:
                    continue

                seen_ids.add(pid)

                categories = props.get("categories", [])
                title = (
                    props.get("name")
                    or props.get("street")
                    or (categories[0].split(".")[-1].title () if categories else "Nearby Place")
                )

                # randomise
                rating = round(random.uniform(3.8, 4.8), 1)
                price = random.choice([1, 2, 2, 3])
                popularity = round(random.uniform(0.4,1.0), 2)

                all_places.append({
                    "place_id": pid,
                    "title": title,
                    "subtitle": props.get("formatted", ""),
                    "categories": categories,
                    "category_names": categories,
                    "latitude": coords[1],
                    "longitude": coords[0],
                    "distance": (props.get("distance", 0) or 0) / 1000,

                    # fallback scoring
                    "rating": rating,
                    "price": price,
                    "popularity": popularity,
                })
        except requests.exceptions.Timeout:
            print("GEOAPIFY TIMEOUT")
            time.sleep(1)

        except Exception as e:
            print("Parsing error:", e)
            continue

    random.shuffle(all_places)
        
    return all_places