from __future__ import annotations

import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_admin_user
from app.services.dashboard.service import DashboardService

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(require_admin_user)],
)


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard statistics (alias for /stats)
    """
    dashboard_service = DashboardService(db)
    stats = dashboard_service.get_dashboard_data()
    return stats


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard statistics
    """
    dashboard_service = DashboardService(db)
    stats = dashboard_service.get_dashboard_data()
    return stats


@router.get("/logs")
def get_logs(
    lines: int = Query(100, gt=0, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get application logs (last N lines)
    """
    log_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend.log")
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail="Log file not found")
    try:
        with open(log_path, "r") as f:
            lines_to_read = []
            for line in (f.readlines()[-lines:] if lines else []):
                lines_to_read.append(line.strip())
        return {"logs": lines_to_read}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read log file: {str(e)}")


@router.get("/report")
def get_report(
):
    """
    Data export remains prohibited until a separate business decision is signed.
    """
    raise HTTPException(status_code=403, detail="Les exports sont interdits")
