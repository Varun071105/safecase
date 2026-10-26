import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from decimal import Decimal
from datetime import datetime, timezone

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.category import ScamCategory
from app.models.complaint import Complaint

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True
)

TestAsyncSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestAsyncSessionLocal() as session:
        # Seed test category
        cat = ScamCategory(name="UPI Fraud", display_order=1, is_active=True)
        session.add(cat)
        
        # Seed test users
        citizen = User(
            id="user-citizen-123",
            email="test.citizen@example.com",
            hashed_password=get_password_hash("Password123#"),
            full_name="Test Citizen",
            role="CITIZEN",
            is_active=True
        )
        investigator = User(
            id="user-investigator-456",
            email="test.investigator@safecase.gov",
            hashed_password=get_password_hash("InvestigatorPass123#"),
            full_name="Test Officer",
            role="INVESTIGATOR",
            is_active=True
        )
        admin = User(
            id="user-admin-789",
            email="test.admin@safecase.gov",
            hashed_password=get_password_hash("AdminPass123#"),
            full_name="Test Admin",
            role="ADMIN",
            is_active=True
        )
        session.add_all([citizen, investigator, admin])
        await session.commit()
        
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
def citizen_token():
    return create_access_token(subject="user-citizen-123", role="CITIZEN")

@pytest.fixture
def investigator_token():
    return create_access_token(subject="user-investigator-456", role="INVESTIGATOR")

@pytest.fixture
def admin_token():
    return create_access_token(subject="user-admin-789", role="ADMIN")
