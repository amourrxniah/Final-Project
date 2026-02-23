from pydantic import BaseModel
from datetime import datetime

class ConsentResponse(BaseModel):
    accepted: bool
    accepted_at: datetime

    class Config:
        from_attributes = True