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

    # Admin MFA is mandatory by the approved decision. Authentication currently
    # has no MFA verifier, so an unverified admin session fails closed.
    if role == "admin" and user.get("mfa_verified") is not True:
        return False

    # /tables is read-only for every role and is never an authorization bypass.
    if module == "erp_table":
        return (
            role in {"admin", "gestionnaire"}
            and action in _GENERIC_TABLE_ACTIONS
            and resource in MANAGER_READ_TABLES
        )

    # Exports require a separate business decision for every role.
    if action in _EXPORT_ACTIONS:
        return False

    # Scopes for manager and employee access are not reliably represented in
    # the current schema. Dedicated routes must enforce a verified object scope
    # before any such permission is added here.
    if role != "admin":
        return False

    return True
