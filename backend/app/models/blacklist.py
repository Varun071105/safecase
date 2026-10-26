from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from typing import Optional, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.complaint import Complaint

class BlacklistEntry(Base):
    __tablename__ = "scammer_blacklist"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # Phone number, UPI ID, Website URL, Email address, Account number, etc.
    identifier_value: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), default="Under Review", index=True, nullable=False)  # Reported, Under Review, Verified
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    
    related_complaint_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    creator: Mapped["User"] = relationship("User", back_populates="created_blacklist_entries")
    related_complaint: Mapped[Optional["Complaint"]] = relationship("Complaint", back_populates="blacklist_entries")

Index("idx_blacklist_type_val", BlacklistEntry.identifier_type, BlacklistEntry.identifier_value)
