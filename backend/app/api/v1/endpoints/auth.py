from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone, timedelta

from app.db.session import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User
from app.models.refresh_session import RefreshSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserResponse, UserUpdate
from app.api.deps import get_current_user
from app.services.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Create citizen user
    user = User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name.strip(),
        phone_number=data.phone_number.strip() if data.phone_number else None,
        role="CITIZEN",
        is_active=True
    )
    db.add(user)
    await db.flush()

    # Create tokens
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    # Store refresh session
    session = RefreshSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_revoked=False
    )
    db.add(session)

    # Audit log
    await log_action(
        db=db,
        action="AUTH_REGISTER",
        target_type="User",
        target_id=user.id,
        actor_id=user.id,
        details=f"User registered with email: {user.email}",
        ip_address=request.client.host if request.client else None
    )

    await db.commit()
    await db.refresh(user)

    # Set secure HttpOnly cookie for session
    response.set_cookie(
        key="safecase_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # Can be True in HTTPS production
        max_age=86400
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email.lower()))
    user = result.scalars().first()

    if not user or not verify_password(data.password, user.hashed_password):
        # Audit failed login attempt
        await log_action(
            db=db,
            action="AUTH_LOGIN_FAILED",
            target_type="User",
            target_id=user.id if user else None,
            details=f"Failed login attempt for email: {data.email}",
            ip_address=request.client.host if request.client else None
        )
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator."
        )

    # Create tokens
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id)

    # Store refresh session
    session = RefreshSession(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_revoked=False
    )
    db.add(session)

    # Log successful login
    await log_action(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        target_type="User",
        target_id=user.id,
        actor_id=user.id,
        details=f"Successful login for {user.email} (Role: {user.role})",
        ip_address=request.client.host if request.client else None
    )

    await db.commit()
    await db.refresh(user)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key="safecase_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    session_res = await db.execute(
        select(RefreshSession).where(
            RefreshSession.refresh_token == data.refresh_token,
            RefreshSession.is_revoked == False
        )
    )
    session = session_res.scalars().first()
    if not session or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or revoked session")

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive account")

    # Rotate tokens
    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id)

    session.is_revoked = True
    new_session = RefreshSession(
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_revoked=False
    )
    db.add(new_session)
    await db.commit()

    response.set_cookie(
        key="safecase_token",
        value=new_access_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    response.delete_cookie(key="safecase_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number.strip()
    
    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")
        current_user.hashed_password = get_password_hash(data.new_password)

    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.delete("/me")
async def deactivate_my_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.is_active = False
    await log_action(
        db=db,
        action="USER_SELF_DEACTIVATE",
        target_type="User",
        target_id=current_user.id,
        actor_id=current_user.id,
        details="User requested self-deactivation"
    )
    await db.commit()
    return {"message": "Account has been deactivated."}
