from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=5000)
    is_internal: bool = True

class NoteResponse(BaseModel):
    id: str
    complaint_id: str
    author_id: str
    content: str
    is_internal: bool
    created_at: datetime
    author_name: Optional[str] = None
    author_role: Optional[str] = None

    class Config:
        from_attributes = True
