from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
