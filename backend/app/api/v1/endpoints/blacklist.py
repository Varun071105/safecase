from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.db.session import get_db
from app.models.user import User
from app.models.blacklist import BlacklistEntry
from app.models.complaint import Complaint
from app.schemas.blacklist import BlacklistCreate, BlacklistUpdate, BlacklistResponse
from app.api.deps import require_investigator, require_admin
from app.services.audit import log_action

router = APIRouter(prefix="/blacklist", tags=["Blacklist"])

@router.get("/")
async def list_blacklist(
    search: Optional[str] = None,
    identifier_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    query = select(BlacklistEntry).options(
        selectinload(BlacklistEntry.creator),
        selectinload(BlacklistEntry.related_complaint)
    )

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                BlacklistEntry.identifier_value.ilike(s),
                BlacklistEntry.reason.ilike(s)
            )
        )
    if identifier_type:
        query = query.where(BlacklistEntry.identifier_type == identifier_type)
    if verification_status:
        query = query.where(BlacklistEntry.verification_status == verification_status)

    query = query.order_by(desc(BlacklistEntry.created_at))
    result = await db.execute(query)
    entries = result.scalars().all()

    total = len(entries)
    paginated = entries[(page - 1) * page_size : page * page_size]

    items = []
    for e in paginated:
        items.append(
            BlacklistResponse(
                id=e.id,
                identifier_type=e.identifier_type,
                identifier_value=e.identifier_value,
                verification_status=e.verification_status,
                reason=e.reason,
                related_complaint_id=e.related_complaint_id,
                related_complaint_number=e.related_complaint.complaint_number if e.related_complaint else None,
                created_by_id=e.created_by_id,
                creator_name=e.creator.full_name if e.creator else "Staff",
                created_at=e.created_at,
                updated_at=e.updated_at
            )
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.post("/", response_model=BlacklistResponse, status_code=status.HTTP_201_CREATED)
async def create_blacklist_entry(
    data: BlacklistCreate,
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    # Normalize identifier
    norm_val = data.identifier_value.strip().lower()
    
    # Check if duplicate exists
    existing = await db.execute(
        select(BlacklistEntry).where(
            BlacklistEntry.identifier_type == data.identifier_type,
            BlacklistEntry.identifier_value == norm_val
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This identifier is already listed in the blacklist database.")

    # Validate related complaint if provided
    comp_number = None
    if data.related_complaint_id:
        c = (await db.execute(select(Complaint).where(Complaint.id == data.related_complaint_id))).scalars().first()
        if c:
            comp_number = c.complaint_number

    entry = BlacklistEntry(
        identifier_type=data.identifier_type,
        identifier_value=norm_val,
        verification_status=data.verification_status or "Under Review",
        reason=data.reason.strip(),
        related_complaint_id=data.related_complaint_id,
        created_by_id=current_user.id
    )
    db.add(entry)

    await log_action(
        db=db,
        action="BLACKLIST_ADD",
        target_type="BlacklistEntry",
        target_id=entry.id,
        actor_id=current_user.id,
        details=f"Listed {entry.identifier_type}: {entry.identifier_value} ({entry.verification_status})"
    )

    await db.commit()
    await db.refresh(entry)

    return BlacklistResponse(
        id=entry.id,
        identifier_type=entry.identifier_type,
        identifier_value=entry.identifier_value,
        verification_status=entry.verification_status,
        reason=entry.reason,
        related_complaint_id=entry.related_complaint_id,
        related_complaint_number=comp_number,
        created_by_id=entry.created_by_id,
        creator_name=current_user.full_name,
        created_at=entry.created_at,
        updated_at=entry.updated_at
    )

@router.put("/{entry_id}", response_model=BlacklistResponse)
async def update_blacklist_entry(
    entry_id: str,
    data: BlacklistUpdate,
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    query = select(BlacklistEntry).options(
        selectinload(BlacklistEntry.creator),
        selectinload(BlacklistEntry.related_complaint)
    ).where(BlacklistEntry.id == entry_id)
    
    result = await db.execute(query)
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Blacklist entry not found")

    old_status = entry.verification_status
    if data.verification_status:
        entry.verification_status = data.verification_status
    if data.reason:
        entry.reason = data.reason.strip()
    if data.identifier_value:
        entry.identifier_value = data.identifier_value.strip().lower()
    if data.identifier_type:
        entry.identifier_type = data.identifier_type

    await log_action(
        db=db,
        action="BLACKLIST_UPDATE",
        target_type="BlacklistEntry",
        target_id=entry.id,
        actor_id=current_user.id,
        details=f"Updated status from '{old_status}' to '{entry.verification_status}'"
    )

    await db.commit()
    await db.refresh(entry)

    return BlacklistResponse(
        id=entry.id,
        identifier_type=entry.identifier_type,
        identifier_value=entry.identifier_value,
        verification_status=entry.verification_status,
        reason=entry.reason,
        related_complaint_id=entry.related_complaint_id,
        related_complaint_number=entry.related_complaint.complaint_number if entry.related_complaint else None,
        created_by_id=entry.created_by_id,
        creator_name=entry.creator.full_name if entry.creator else "Staff",
        created_at=entry.created_at,
        updated_at=entry.updated_at
    )

@router.delete("/{entry_id}")
async def delete_blacklist_entry(
    entry_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    entry = (await db.execute(select(BlacklistEntry).where(BlacklistEntry.id == entry_id))).scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Blacklist entry not found")

    await log_action(
        db=db,
        action="BLACKLIST_DELETE",
        target_type="BlacklistEntry",
        target_id=entry.id,
        actor_id=current_user.id,
        details=f"Deleted blacklist record for {entry.identifier_type}: {entry.identifier_value}"
    )

    await db.delete(entry)
    await db.commit()
    return {"message": "Blacklist entry removed"}
