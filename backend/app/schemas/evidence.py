from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EvidenceResponse(BaseModel):
    id: str
    complaint_id: str
    uploaded_by_id: str
    filename: str
    file_size: int
    content_type: str
    created_at: datetime
    uploader_name: Optional[str] = None

    class Config:
        from_attributes = True
