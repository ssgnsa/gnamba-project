from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class HealthStatus:
    status: str = "ok"
    service: str = "egs-local-api"
    database: str = "unknown"
