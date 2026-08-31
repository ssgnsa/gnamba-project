from fastapi import APIRouter
from app.api.v1.auth.router import router as v1_auth_router
from app.api.v1.users.router import router as users_router
from app.api.v1.employees.router import router as employees_router
from app.api.v1.finance.router import router as finance_router
from app.api.v1.foncier.router import router as foncier_router
from app.api.v1.immobilier import immobilier_router
from app.api.v1.leads.router import router as leads_router
from app.api.v1.media.router import router as v1_media_router
from app.api.v1.products.router import router as products_router
from app.api.v1.projects.router import router as projects_router
from app.api.v1.rpc.router import router as rpc_router
from app.api.v1.settings.router import router as v1_settings_router
from app.api.v1.site_content.router import router as v1_site_content_router
from app.api.v1.page_layouts.router import router as v1_page_layouts_router
from app.api.v1.site.router import router as v1_site_router
from app.api.v1.suppliers.router import router as suppliers_router
from app.api.v1.tables.router import router as tables_router
from app.api.v1.dashboard.router import router as dashboard_router
from app.api.v1.clients.router import router as clients_router
from app.api.v1.tasks.router import router as tasks_router
from app.api.v1.tenants.router import router as tenants_router
from app.api.v1.entities.router import router as entities_router
from app.api.v1.notifications.router import router as notifications_router

router = APIRouter()
router.include_router(v1_settings_router)
router.include_router(v1_site_content_router)
router.include_router(v1_page_layouts_router)
router.include_router(v1_site_router)
router.include_router(v1_media_router)
router.include_router(v1_auth_router)
router.include_router(users_router)
router.include_router(projects_router)
router.include_router(employees_router)
router.include_router(suppliers_router)
router.include_router(products_router)
router.include_router(finance_router)
router.include_router(immobilier_router)
router.include_router(foncier_router)
router.include_router(leads_router)
router.include_router(rpc_router)
router.include_router(tables_router)
router.include_router(dashboard_router)
router.include_router(clients_router)
router.include_router(tasks_router)
router.include_router(tenants_router)
router.include_router(entities_router)
router.include_router(notifications_router)