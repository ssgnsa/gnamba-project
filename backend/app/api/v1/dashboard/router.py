from __future__ import annotations

import csv
import io
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.dashboard.service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a CSV report of financial transactions for the current month.
    """
    dashboard_service = DashboardService(db)
    now = datetime.now()
    start_date = datetime(now.year, now.month, 1)
    if now.month == 12:
        end_date = datetime(now.year + 1, 1, 1)
    else:
        end_date = datetime(now.year, now.month + 1, 1)

    transactions = dashboard_service.get_transactions_for_period(start_date, end_date)
    if not transactions:
        # Return a CSV with just a header and a message
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Type", "Category", "Description", "Amount"])
        writer.writerow([start_date.strftime("%Y-%m-%d"), "No data", "", "No transactions found for the specified period", "0"])
        csv_content = output.getvalue()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{start_date.strftime('%Y_%m')}.csv"}
        )

    # Prepare CSV
    output = io.StringIO()
    writer = csv.writer(output)
    # Header
    writer.writerow(["Date", "Type", "Category", "Description", "Amount"])
    # Data
    for t in transactions:
        writer.writerow([
            t.get("date_transaction", ""),
            t.get("type_transaction", ""),
            t.get("categorie", ""),
            t.get("description", ""),
            t.get("montant", 0)
        ])
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{start_date.strftime('%Y_%m')}.csv"}
    )