from sqlalchemy import String, Boolean, DateTime, Numeric, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
from decimal import Decimal
import uuid
from typing import List, Optional, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.evidence import ComplaintEvidence
    from app.models.status_history import ComplaintStatusHistory
    from app.models.note import InvestigationNote
    from app.models.blacklist import BlacklistEntry

class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_number: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    scam_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    amount_lost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    incident_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    scammer_identifier_type: Mapped[str] = mapped_column(String(50), nullable=False)
    scammer_identifier: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    incident_description: Mapped[str] = mapped_column(Text, nullable=False)
    incident_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default="Submitted", index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)
    
    assigned_investigator_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resolution_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complainant: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="complaints")
    assigned_investigator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_investigator_id], back_populates="assigned_cases")
    
    evidence: Mapped[List["ComplaintEvidence"]] = relationship(
        "ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintEvidence.created_at.desc()"
    )
    status_history: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintStatusHistory.created_at.asc()"
    )
    notes: Mapped[List["InvestigationNote"]] = relationship(
        "InvestigationNote", back_populates="complaint", cascade="all, delete-orphan", order_by="InvestigationNote.created_at.desc()"
    )
    blacklist_entries: Mapped[List["BlacklistEntry"]] = relationship(
        "BlacklistEntry", back_populates="related_complaint"
    )

# Composite index for filtering
Index("idx_complaint_status_scamtype", Complaint.status, Complaint.scam_type)
Index("idx_complaint_user_created", Complaint.user_id, Complaint.created_at.desc())
