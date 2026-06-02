from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class FavouriteCreate(BaseModel):
    activity_id: str | int
    virtual_activity_id: Optional[str] = None

class FavouriteResponse(BaseModel):
    id: int
    user_id: int
    activity_id: Optional[int] = None
    virtual_activity_id: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
    