from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models.category import ScamCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.api.deps import require_admin
from app.services.audit import log_action

router = APIRouter(prefix="/categories", tags=["Scam Categories"])

@router.get("/", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScamCategory).where(ScamCategory.is_active == True).order_by(ScamCategory.display_order))
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]

@router.get("/all", response_model=List[CategoryResponse])
async def list_all_categories(
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ScamCategory).order_by(ScamCategory.display_order))
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(ScamCategory).where(ScamCategory.name == data.name.strip()))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Category already exists")

    cat = ScamCategory(
        name=data.name.strip(),
        description=data.description,
        is_active=data.is_active,
        display_order=data.display_order
    )
    db.add(cat)

    await log_action(
        db=db,
        action="CATEGORY_CREATE",
        target_type="ScamCategory",
        target_id=cat.id,
        actor_id=current_user.id,
        details=f"Created scam category '{cat.name}'"
    )

    await db.commit()
    await db.refresh(cat)
    return CategoryResponse.model_validate(cat)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    cat = (await db.execute(select(ScamCategory).where(ScamCategory.id == category_id))).scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if data.name is not None:
        cat.name = data.name.strip()
    if data.description is not None:
        cat.description = data.description
    if data.is_active is not None:
        cat.is_active = data.is_active
    if data.display_order is not None:
        cat.display_order = data.display_order

    await log_action(
        db=db,
        action="CATEGORY_UPDATE",
        target_type="ScamCategory",
        target_id=cat.id,
        actor_id=current_user.id,
        details=f"Updated scam category '{cat.name}'"
    )

    await db.commit()
    await db.refresh(cat)
    return CategoryResponse.model_validate(cat)

@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    cat = (await db.execute(select(ScamCategory).where(ScamCategory.id == category_id))).scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    await log_action(
        db=db,
        action="CATEGORY_DELETE",
        target_type="ScamCategory",
        target_id=cat.id,
        actor_id=current_user.id,
        details=f"Deleted scam category '{cat.name}'"
    )

    await db.delete(cat)
    await db.commit()
    return {"message": "Category deleted"}
