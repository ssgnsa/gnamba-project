"""Legacy compatibility shim for immobilier.

This module intentionally exposes no routes. The canonical API lives in
app.api.v1.immobilier.__init__ and the subrouters under the same package.
Keeping the old duplicate router active causes nested paths such as
/api/v1/immobilier/api/v1/immobilier/... and breaks the real contract.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/immobilier", tags=["immobilier"])

__all__ = ["router"]