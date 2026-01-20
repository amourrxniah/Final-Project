from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: str
    messages: List[Message]
    mood: Optional[str] = "neutral"

class ChatResponse(BaseModel):
    reply: str
