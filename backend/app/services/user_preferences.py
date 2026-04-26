from sqlalchemy.orm import Session
from app.models.user_preference import UserPreference

class UserPreferenceEngine:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    # ----- GET PREFS FROM DB -----
    def get_user_prefs(self):
        prefs = self.db.query(UserPreference).filter_by(
            user_id=self.user_id
        ).all()

        result = {
            "categories": {},
            "moods": "",
            "time": {}
        }

        for p in prefs:
            if p.type == "category":
                result["categories"][p.key] = p.weight
            elif p.type == "mood":
                result["moods"][p.key] = p.weight
            elif p.type == "time":
                result["time"][p.key] = p.weight
        return result