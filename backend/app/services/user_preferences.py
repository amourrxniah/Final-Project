from collections import defaultdict

class UserPreferenceEngine:
    def __init__(self):
        self.category_weights = defaultdict(float)
        self.mood_affinity = defaultdict(float)
        self.time_affinity = defaultdict(float)

# ----- CLICK LEARNING -----
def register_click(self, activity, mood, time_of_day):
    categories = activity.get("category_names", [])

    for c in categories:
        self.category_weights[c] += 1.0

    self.mood_affinity[mood] += 0.5
    self.time_affinity[time_of_day] += 0.3

# ----- SKIP LEARNING -----
def register_skip(self, activities, mood):

    for a in activities:
        for c in a.get("category_names", []):
            self.category_weights[c] -= 0.2

    self.mood_affinity[mood] -= 0.1

# ----- SCORE BOOST -----
def get_user_prefs(self):
    return {
        "categories": dict(self.category_weights),
        "moods": dict(self.mood_affinity),
        "time": dict(self.time_affinity),
    }