from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.audit_log import AuditLog

async def log_action(
    db: AsyncSession,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    log_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        details=details,
        ip_address=ip_address
    )
    db.add(log_entry)
    await db.flush()
    return log_entry
