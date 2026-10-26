from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from app.schemas.evidence import EvidenceResponse
from app.schemas.status_history import StatusHistoryResponse
from app.schemas.note import NoteResponse

class ComplaintCreate(BaseModel):
    scam_type: str = Field(..., description="Category of scam")
    amount_lost: Decimal = Field(default=Decimal("0.00"), ge=0, description="Amount lost in INR")
    incident_date: datetime = Field(..., description="Date of incident")
    scammer_identifier_type: str = Field(..., description="Phone, UPI ID, URL, Email, etc.")
    scammer_identifier: str = Field(..., min_length=2, max_length=255)
    transaction_reference: Optional[str] = Field(None, max_length=255)
    incident_description: str = Field(..., min_length=20, max_length=10000)
    incident_location: Optional[str] = Field(None, max_length=255)
    consent_given: bool = Field(..., description="Consent and declaration checkbox")

    @field_validator("consent_given")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must confirm the accuracy and agree to the terms.")
        return v

class ComplaintResponse(BaseModel):
    id: str
    complaint_number: str
    user_id: str
    scam_type: str
    amount_lost: Decimal
    incident_date: datetime
    scammer_identifier_type: str
    scammer_identifier: str
    transaction_reference: Optional[str] = None
    incident_description: str
    incident_location: Optional[str] = None
    consent_given: bool
    status: str
    priority: str
    assigned_investigator_id: Optional[str] = None
    resolution_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    complainant_name: Optional[str] = None
    complainant_email: Optional[str] = None
    assigned_investigator_name: Optional[str] = None
    evidence_count: int = 0

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    evidence: List[EvidenceResponse] = []
    status_history: List[StatusHistoryResponse] = []
    notes: List[NoteResponse] = []

class StatusUpdateRequest(BaseModel):
    new_status: str = Field(..., description="Target status")
    public_remarks: Optional[str] = Field(None, description="Remarks visible to complainant")
    internal_remarks: Optional[str] = Field(None, description="Internal remarks for investigators only")
    resolution_summary: Optional[str] = Field(None, description="Resolution summary if resolving/closing")

class AssignmentUpdateRequest(BaseModel):
    assigned_investigator_id: Optional[str] = None
    priority: Optional[str] = None
