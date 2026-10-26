from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BlacklistCreate(BaseModel):
    identifier_type: str = Field(..., description="Phone number, UPI ID, Website URL, etc.")
    identifier_value: str = Field(..., min_length=2, max_length=255)
    verification_status: str = Field(default="Under Review", description="Reported, Under Review, Verified")
    reason: str = Field(..., min_length=5, max_length=2000)
    related_complaint_id: Optional[str] = None

class BlacklistUpdate(BaseModel):
    identifier_type: Optional[str] = None
    identifier_value: Optional[str] = None
    verification_status: Optional[str] = None
    reason: Optional[str] = None

class BlacklistResponse(BaseModel):
    id: str
    identifier_type: str
    identifier_value: str
    verification_status: str
    reason: str
    related_complaint_id: Optional[str] = None
    related_complaint_number: Optional[str] = None
    created_by_id: str
    creator_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
