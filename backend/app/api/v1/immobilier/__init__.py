# Immobilier API Module
# Expose tous les sous-routers: properties, contracts, payments

from .properties_router import router as properties_router
from .contracts_router import router as contracts_router
from .payments_router import router as payments_router

# Combine all routers into one
from fastapi import APIRouter

immobilier_router = APIRouter(prefix="/api/v1/immobilier", tags=["immobilier"])

# Include the canonical routers only. The legacy module duplicates the same
# prefix and creates nested routes such as /api/v1/immobilier/api/v1/immobilier.
immobilier_router.include_router(properties_router)
immobilier_router.include_router(contracts_router)
immobilier_router.include_router(payments_router)

__all__ = ["immobilier_router", "properties_router", "contracts_router", "payments_router"]