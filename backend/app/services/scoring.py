import math

def normalise_cat(categories):
    if not categories:
        return []
    if isinstance(categories, str):
        return [categories]
    return categories

mood_keywords = {
    "low": ["museum", "gallery", "park", "relax", "nature"],
    "neutral": ["cafe", "restaurant", "shop", "cinema"],
    "high": ["nightclub", "fitness", "sports", "entertainment"]
}

INDOOR_KEYWORDS = [
    "cafe", "restaurant", "cinema", "museum",
    "gallery", "mall", "gym"
]

OUTDOOR_KEYWORDS = [
    "park", "nature", "trail", "beach", "stadium"
]

def mood_score(mood: str, categories: list, rating: float = 0, popularity: float = 0):
    categories = normalise_cat(categories)
    
    allowed = mood_keywords.get(mood, [])
    matches = sum(
        1 for c in categories
        if any(k in c.lower() for k in allowed)
    )

    base = 0.4 if matches == 0 else min(1.0, 0.6 + matches * 0.15)
    
    rating_boost = min(0.2, rating / 25) if rating else 0
    popularity_boost = min(0.1, popularity * 0.1) if popularity else 0
    
    return min(1.0, base + rating_boost + popularity_boost)

def weather_score(weather: str, categories: list):
    categories = normalise_cat(categories)

    if not weather or not categories:
        return 0.5
    
    bad_weather = any(w in weather.lower() for w in ["rain", "storm", "snow", "cold"])
    
    matches = 0
    for c in categories:
        c = c.lower()
        if bad_weather and any(k in c for k in INDOOR_KEYWORDS):
            matches += 1
        if not bad_weather and any(k in c for k in OUTDOOR_KEYWORDS):
            matches += 1
    
    return 0.3 if matches == 0 else min(1.0, 0.6 + matches * 0.2)

def distance_score(distance_km: float, max_km: float = 5.0):
    if distance_km <= 0:
        return 1.0
    if distance_km >= max_km:
        return 0.1
    
    return math.exp(-distance_km / max_km)

def price_score(price: int, mood: str):
    if not price:
        return 0.5
    
    if mood == "low":
            return 1.0 if price <= 2 else 0.7
    if mood == "high":
        return 0.9
    
    return 0.9 if price <= 3 else 0.7

def time_score(time_of_day: str, categories: list):
    categories = normalise_cat(categories)
    
    if not time_of_day:
        return 0.5

    morning = ["cafe", "park", "nature", "gym"]
    afternoon = ["museum", "shopping", "park", "gallery"]
    evening = ["cinema", "restaurant", "bar", "theatre"]
    night = ["bar", "nightclub", "entertainment"]

    map_time = {
        "morning": morning,
        "afternoon": afternoon,
        "evening": evening,
        "night": night,
    }

    allowed = map_time.get(time_of_day.lower(), [])

    matches = sum(
        1 for c in categories
        if any(k in c.lower() for k in allowed)
    )

    return 0.3 if matches == 0 else min(1.0, 0.6 + matches * 0.2)
    
def total_score(
    mood_sc: float, 
    weather_sc: float, 
    distance_sc: float,
    time_sc: float,
    price_sc: float = 0.5
):
    return (
        (mood_sc * 0.35) + 
        (weather_sc * 0.20) + 
        (distance_sc * 0.25) + 
        (time_sc * 0.15) + 
        (price_sc * 0.10))

