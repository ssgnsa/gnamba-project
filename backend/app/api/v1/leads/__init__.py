from .router import router as leads_router
from .automation_routes import router as automation_router
from .campaign_routes import router as campaign_router

__all__ = ["leads_router", "automation_router", "campaign_router"]
