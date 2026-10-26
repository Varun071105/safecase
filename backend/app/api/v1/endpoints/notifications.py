from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(50)
    
    result = await db.execute(query)
    notifications = result.scalars().all()

    unread_count = sum(1 for n in notifications if not n.is_read)

    return {
        "items": [NotificationResponse.model_validate(n) for n in notifications],
        "unread_count": unread_count
    }

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    notif = (await db.execute(select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ))).scalars().first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}
