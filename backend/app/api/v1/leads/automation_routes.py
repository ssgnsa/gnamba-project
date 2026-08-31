"""
Automation Engine API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from app.core.database import get_db
from app.services.lead.automation_engine import AutomationEngine, get_automation_engine
from app.services.entity_service import get_entity_service


def get_automation_engine_dep(db: Session = Depends(get_db)) -> AutomationEngine:
    """Dependency to get automation engine with database session"""
    return get_automation_engine(db)


router = APIRouter(tags=["leads-automation"])


@router.post("/{lead_id}/evaluate-automation")
async def evaluate_lead_automation(
    lead_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    automation_engine: AutomationEngine = Depends(get_automation_engine_dep)
):
    """
    Evaluate automation rules for a specific lead
    """
    # Get the lead entity
    entity_service = get_entity_service(db)
    lead_entity = entity_service.get(lead_id)

    if not lead_entity or lead_entity.type != "lead":
        raise HTTPException(status_code=404, detail="Lead not found")

    # Evaluate rules
    actions = await automation_engine.evaluate_lead(lead_entity)

    # Execute actions in background
    if actions:
        background_tasks.add_task(
            _execute_automation_actions,
            lead_id,
            actions,
            db,
            automation_engine
        )

    return {
        "success": True,
        "lead_id": str(lead_id),
        "rules_evaluated": len(automation_engine.rules),
        "actions_triggered": len(actions)
    }


async def _execute_automation_actions(
    lead_id: UUID,
    actions: List[Dict[str, Any]],
    db: Session,
    automation_engine: AutomationEngine
):
    """
    Execute automation actions for a lead (background task)
    """
    try:
        results = await automation_engine.execute_actions(actions)
        # Log results or handle as needed
        successful_actions = sum(1 for r in results if r["success"])
        failed_actions = len(results) - successful_actions

        # In a real system, you might want to store these results
        print(f"Automation execution completed for lead {lead_id}: {successful_actions} successful, {failed_actions} failed")
    except Exception as e:
        print(f"Error executing automation actions for lead {lead_id}: {str(e)}")


@router.get("/automation/rules")
async def get_automation_rules(
    automation_engine: AutomationEngine = Depends(get_automation_engine_dep)
):
    """
    Get all automation rules
    """
    return {
        "success": True,
        "rules": automation_engine.rules
    }


@router.post("/automation/rules/{rule_id}/toggle")
async def toggle_automation_rule(
    rule_id: str,
    automation_engine: AutomationEngine = Depends(get_automation_engine_dep)
):
    """
    Toggle an automation rule on/off
    """
    for rule in automation_engine.rules:
        if rule["id"] == rule_id:
            rule["enabled"] = not rule.get("enabled", True)
            return {
                "success": True,
                "rule_id": rule_id,
                "enabled": rule["enabled"]
            }

    raise HTTPException(status_code=404, detail="Rule not found")