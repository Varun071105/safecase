from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
