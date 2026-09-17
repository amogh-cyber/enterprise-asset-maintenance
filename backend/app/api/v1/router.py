from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    users,
    assets,
    requests,
    work_orders,
    parts,
    pm,
    reports,
    audit,
    integrations
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(assets.router)
api_router.include_router(requests.router)
api_router.include_router(work_orders.router)
api_router.include_router(parts.router)
api_router.include_router(pm.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(integrations.router)
