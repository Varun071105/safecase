from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    complaints,
    evidence,
    blacklist,
    analytics,
    users,
    categories,
    notifications,
    audit
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(complaints.router)
api_router.include_router(evidence.router)
api_router.include_router(blacklist.router)
api_router.include_router(analytics.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(notifications.router)
api_router.include_router(audit.router)
