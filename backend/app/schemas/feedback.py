from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    activity_id: Optional[str] = None
    virtual_activity_id: Optional[str] = None
    feedback: Optional[str] = None #up or down
    rating: Optional[int] = None