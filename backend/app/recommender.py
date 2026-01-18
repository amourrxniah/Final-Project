def recommend(mood, weather, activities):
    results = []

    for activity in activities:
        if mood == "low" and weather != "Rain":
            results.append(activity)
        elif mood == "high":
            results.append(activity)

    return results