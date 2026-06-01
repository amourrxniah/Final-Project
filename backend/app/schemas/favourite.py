from pydantic import BaseModel
from datetime import datetime

class FavouriteCreate(BaseModel):
    activity_id: str

class FavouriteResponse(BaseModel):
    id: int
    user_id: int
    activity_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
    