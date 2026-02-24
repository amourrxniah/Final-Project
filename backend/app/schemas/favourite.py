from pydantic import BaseModel
from datetime import datetime

class FavouriteCreate(BaseModel):
    activity_id: int

class FavouriteResponse(BaseModel):
    id: int
    user_id: int
    activity_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
    