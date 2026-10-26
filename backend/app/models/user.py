from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from typing import List, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.evidence import ComplaintEvidence
    from app.models.status_history import ComplaintStatusHistory
    from app.models.note import InvestigationNote
    from app.models.blacklist import BlacklistEntry
    from app.models.notification import Notification
    from app.models.audit_log import AuditLog

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(30), default="CITIZEN", index=True, nullable=False)  # CITIZEN, INVESTIGATOR, ADMIN
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaints: Mapped[List["Complaint"]] = relationship(
        "Complaint", back_populates="complainant", foreign_keys="[Complaint.user_id]", cascade="all, delete-orphan"
    )
    assigned_cases: Mapped[List["Complaint"]] = relationship(
        "Complaint", back_populates="assigned_investigator", foreign_keys="[Complaint.assigned_investigator_id]"
    )
    uploaded_evidence: Mapped[List["ComplaintEvidence"]] = relationship(
        "ComplaintEvidence", back_populates="uploader"
    )
    status_updates: Mapped[List["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory", back_populates="actor"
    )
    notes: Mapped[List["InvestigationNote"]] = relationship(
        "InvestigationNote", back_populates="author"
    )
    created_blacklist_entries: Mapped[List["BlacklistEntry"]] = relationship(
        "BlacklistEntry", back_populates="creator"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="actor"
    )
