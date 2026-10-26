from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserAdminCreate, UserAdminUpdate
from app.api.deps import require_admin, require_investigator
from app.core.security import get_password_hash
from app.services.audit import log_action

router = APIRouter(prefix="/users", tags=["Users Management"])

@router.get("/investigators", response_model=List[UserResponse])
async def list_active_investigators(
    current_user: User = Depends(require_investigator),
    db: AsyncSession = Depends(get_db)
):
    """Returns list of active investigators and admins for assigning casework."""
    query = select(User).where(
        User.role.in_(["INVESTIGATOR", "ADMIN"]),
        User.is_active == True
    ).order_by(User.full_name)
    result = await db.execute(query)
    return [UserResponse.model_validate(u) for u in result.scalars().all()]

@router.get("/", response_model=List[UserResponse])
async def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                User.email.ilike(s),
                User.full_name.ilike(s),
                User.phone_number.ilike(s)
            )
        )
    query = query.order_by(desc(User.created_at))
    result = await db.execute(query)
    return [UserResponse.model_validate(u) for u in result.scalars().all()]

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    data: UserAdminCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    if data.role not in ("CITIZEN", "INVESTIGATOR", "ADMIN"):
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user = User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        role=data.role,
        is_active=True
    )
    db.add(user)
    await db.flush()

    await log_action(
        db=db,
        action="USER_ADMIN_CREATE",
        target_type="User",
        target_id=user.id,
        actor_id=current_user.id,
        details=f"Admin created user {user.email} with role {user.role}"
    )

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user_admin(
    user_id: str,
    data: UserAdminUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating or demoting themselves
    if user.id == current_user.id:
        if data.is_active is False:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account")
        if data.role and data.role != "ADMIN":
            raise HTTPException(status_code=400, detail="Cannot demote your own administrator account")

    if data.full_name is not None:
        user.full_name = data.full_name.strip()
    if data.phone_number is not None:
        user.phone_number = data.phone_number.strip()
    if data.role is not None:
        if data.role not in ("CITIZEN", "INVESTIGATOR", "ADMIN"):
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.password:
        user.hashed_password = get_password_hash(data.password)

    await log_action(
        db=db,
        action="USER_ADMIN_UPDATE",
        target_type="User",
        target_id=user.id,
        actor_id=current_user.id,
        details=f"Updated user {user.email}: role={user.role}, is_active={user.is_active}"
    )

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
