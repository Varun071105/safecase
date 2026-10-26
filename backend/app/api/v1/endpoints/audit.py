from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).options(selectinload(AuditLog.actor))

    if action:
        query = query.where(AuditLog.action == action)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                AuditLog.action.ilike(s),
                AuditLog.details.ilike(s),
                AuditLog.target_id.ilike(s)
            )
        )

    query = query.order_by(desc(AuditLog.created_at)).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        AuditLogResponse(
            id=log.id,
            actor_id=log.actor_id,
            actor_name=log.actor.full_name if log.actor else "System / Anonymous",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            ip_address=log.ip_address,
            created_at=log.created_at
        ) for log in logs
    ]
