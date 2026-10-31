"""Central server-side authorization for EGS API resources."""
from __future__ import annotations

from typing import Any


# Decision 010 only permits these aggregate reads through the transitional API.
# visites_du_jour is excluded because its schema contains name and phone fields.
MANAGER_READ_TABLES = frozenset(
    {
        "stats_journalieres",
    }
)

_GENERIC_TABLE_ACTIONS = frozenset({"read"})
_EXPORT_ACTIONS = frozenset({"export", "EXPORT"})

# Module read access is granted to roles the frontend exposes the module to.
# This keeps the FastAPI authorization contract coherent with the frontend's
# ACCESS_LEVEL_MODULES in src/context/AuthContext.tsx.
_MODULE_READ_ROLES = frozenset({"admin", "gerant", "gestionnaire", "secretaire"})

# Fonctionnelles Foncier : rôles autorisés à initier ces actions au niveau route.
# Le contrôle territorial fin (niveau d'accès sur le village spécifique) reste
# du ressort du service (check_access). La dérogation admin globale s'applique
# aussi ici.
_FONCIER_WRITE_ROLES = frozenset({"admin", "gerant", "gestionnaire", "secretaire"})


def has_permission(
    user: dict[str, Any] | None,
    module: str,
    action: str,
    *,
    resource: str | None = None,
) -> bool:
    """Return a conservative role/action decision; object scopes stay route-owned."""
    if not user:
        return False
    role = user.get("role")

    # Admin MFA (step-up) n'est exigé que pour les mutations. Un admin authentifié
    # (AAL1) peut lire même lorsque la MFA est requise mais pas encore vérifiée.
    if role == "admin" and user.get("mfa_required") and user.get("mfa_verified") is not True:
        if action != "read":
            return False

    # /tables is read-only. Admin may read any exposed table except the
    # privacy-restricted ones (visites_du_jour carries name/phone per Decision
    # 010; tasks is withheld by the same allowlist decision). Gestionnaire is
    # restricted to the MANAGER_READ_TABLES allowlist. It is never an
    # authorization bypass for writes.
    if module == "erp_table":
        if role == "admin":
            # Admin can read and write operational tables, but writes
            # require MFA step-up (AAL2) — enforced by checking mfa_verified
            # in current_user (populated by get_current_user when the
            # session is marked mfa_verified in DB). Privacy-restricted
            # tables stay read-excluded for everyone.
            if resource in {"visites_du_jour", "tasks"}:
                return action == "read" and False
            if action == "read":
                return True
            # Write (create/update/delete): admin needs MFA verified
            return user.get("mfa_verified") is True
        if action != "read":
            return False
        return role == "gestionnaire" and resource in MANAGER_READ_TABLES

    # Exports require a separate business decision for every role.
    if action in _EXPORT_ACTIONS:
        return False

    # Module read access is granted to roles the frontend exposes the module to.
    if action == "read" and role in _MODULE_READ_ROLES:
        return True

    # Fonctionnelles d'écriture Foncier : accessibles aux rôles du module,
    # le contrôle territorial fin restant au service.
    if module == "foncier" and action in {"validate", "archive", "deliver", "revoke"}:
        return role in _FONCIER_WRITE_ROLES

    # Write/mutation actions remain admin-only.
    if role != "admin":
        return False

    return True
