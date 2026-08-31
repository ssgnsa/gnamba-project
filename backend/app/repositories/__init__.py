"""Data access layer."""
from app.repositories.foncier import (
    get_village_repo, get_lotissement_repo, get_ilot_repo,
    get_lot_repo, get_attestation_repo, get_audit_repo,
    get_user_village_access_repo
)

__all__ = [
    "get_village_repo", "get_lotissement_repo", "get_ilot_repo",
    "get_lot_repo", "get_attestation_repo", "get_audit_repo",
    "get_user_village_access_repo"
]