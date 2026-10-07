"""Services layer."""
from app.services.foncier import (
    get_village_service, get_lotissement_service, get_ilot_service,
    get_lot_service, get_attestation_service, get_audit_service,
    get_user_access_service
)

__all__ = [
    "get_village_service", "get_lotissement_service", "get_ilot_service",
    "get_lot_service", "get_attestation_service", "get_audit_service",
    "get_user_access_service"
]