from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from typing import Optional, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.complaint import Complaint
    from app.models.user import User

class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[str] = mapped_column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    previous_status: Mapped[str] = mapped_column(String(50), nullable=False)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    public_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    internal_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="status_history")
    actor: Mapped["User"] = relationship("User", back_populates="status_updates")
