from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    activity_id: str
    feedback: Optional[str] = None #up or down
    rating: Optional[int] = None