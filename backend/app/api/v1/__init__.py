from fastapi import APIRouter

from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.auth.router import router as v1_auth_router
from backend.app.api.v1.employees import router as employees_router
from backend.app.api.v1.finance import router as finance_router
from backend.app.api.v1.foncier import router as foncier_router
from backend.app.api.v1.immobilier import router as immobilier_router
from backend.app.api.v1.leads import router as leads_router
from backend.app.api.v1.media import router as media_router
from backend.app.api.v1.media import v1_media_router
from backend.app.api.v1.products import router as products_router
from backend.app.api.v1.projects import router as projects_router
from backend.app.api.v1.settings import router as settings_router
from backend.app.api.v1.settings import v1_settings_router, v1_site_content_router
from backend.app.api.v1.suppliers import router as suppliers_router
from backend.app.api.v1.tables import router as tables_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.users.router import router as v1_users_router

router = APIRouter()
router.include_router(settings_router)
router.include_router(v1_settings_router)
router.include_router(v1_site_content_router)
router.include_router(media_router)
router.include_router(v1_media_router)
router.include_router(auth_router)
router.include_router(v1_auth_router)
router.include_router(users_router)
router.include_router(v1_users_router)
router.include_router(projects_router)
router.include_router(employees_router)
router.include_router(suppliers_router)
router.include_router(products_router)
router.include_router(finance_router)
router.include_router(immobilier_router)
router.include_router(foncier_router)
router.include_router(leads_router)
router.include_router(tables_router)
