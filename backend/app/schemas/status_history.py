from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StatusHistoryResponse(BaseModel):
    id: str
    complaint_id: str
    actor_id: str
    previous_status: str
    new_status: str
    public_remarks: Optional[str] = None
    internal_remarks: Optional[str] = None
    created_at: datetime
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None

    class Config:
        from_attributes = True
