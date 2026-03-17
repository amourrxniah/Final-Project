from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    activity_id: int
    feedback: Optional[str] = None #up or down
    rating: Optional[int] = None