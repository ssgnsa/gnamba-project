"""
Automation Engine Service - Handles rule-based automation for leads
"""
from typing import List, Dict, Any, Optional, Callable
from uuid import UUID
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entity import Entity
from app.services.entity_service import get_entity_service
from app.services.lead.scoring import (
    calculate_lead_score_with_breakdown,
    get_hours_since_last_interaction
)

logger = logging.getLogger(__name__)

class AutomationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.entity_service = get_entity_service(db)
        self.rules: List[Dict[str, Any]] = []
        self._load_default_rules()
    
    def _load_default_rules(self):
        """Load default automation rules"""
        self.rules = [
            {
                "id": "welcome_sequence",
                "name": "Welcome Sequence",
                "description": "Send welcome message when new lead is created",
                "trigger": "lead_created",
                "conditions": [
                    {
                        "field": "metadata.source",
                        "operator": "exists"
                    }
                ],
                "actions": [
                    {
                        "type": "send_message",
                        "channel": "whatsapp",
                        "template": "welcome",
                        "delay_minutes": 0
                    },
                    {
                        "type": "send_message", 
                        "channel": "sms",
                        "template": "welcome_sms",
                        "delay_minutes": 5
                    }
                ],
                "enabled": True
            },
            {
                "id": "hot_lead_assignment",
                "name": "Hot Lead Auto-Assignment",
                "description": "Automatically assign hot leads to sales agents",
                "trigger": "score_updated",
                "conditions": [
                    {
                        "field": "metadata.score",
                        "operator": ">=",
                        "value": 70
                    }
                ],
                "actions": [
                    {
                        "type": "assign_to_agent",
                        "method": "round_robin"
                    },
                    {
                        "type": "update_pipeline_stage",
                        "stage": "qualifie"
                    },
                    {
                        "type": "send_internal_notification",
                        "message": "Nouveau lead chaud détecté",
                        "priority": "high"
                    }
                ],
                "enabled": True
            },
            {
                "id": "cold_lead_nurture",
                "name": "Cold Lead Nurturing",
                "description": "Nurture cold leads with educational content",
                "trigger": "score_updated",
                "conditions": [
                    {
                        "field": "metadata.score",
                        "operator": "<",
                        "value": 40
                    },
                    {
                        "field": "metadata.segment",
                        "operator": "!=",
                        "value": "nurturing"
                    }
                ],
                "actions": [
                    {
                        "type": "update_metadata",
                        "data": {
                            "segment": "nurturing"
                        }
                    },
                    {
                        "type": "add_to_nurture_campaign",
                        "campaign_id": "nurture_campaign_001"
                    }
                ],
                "enabled": True
            },
            {
                "id": "stale_lead_followup",
                "name": "Stale Lead Follow-up",
                "description": "Follow up with leads that haven't been contacted in 7 days",
                "trigger": "time_based",
                "conditions": [
                    {
                        "field": "metadata.last_interaction_at",
                        "operator": "older_than",
                        "value": 168  # 7 days in hours
                    },
                    {
                        "field": "metadata.status",
                        "operator": "in",
                        "value": ["nouveau", "contacte"]
                    }
                ],
                "actions": [
                    {
                        "type": "create_task",
                        "title": "Suivi de lead inactif",
                        "description": "Contacter ce lead qui n'a pas eu d'interaction depuis plus de 7 jours",
                        "due_hours": 24,
                        "priority": "medium"
                    },
                    {
                        "type": "update_metadata",
                        "data": {
                            "tags": ["needs_followup"]
                        }
                    }
                ],
                "enabled": True
            },
            {
                "id": "lead_conversion_followup",
                "name": "Post-Conversion Follow-up",
                "description": "Follow up with newly converted leads",
                "trigger": "status_changed",
                "conditions": [
                    {
                        "field": "status",
                        "operator": "changed_to",
                        "value": "converti"
                    }
                ],
                "actions": [
                    {
                        "type": "send_message",
                        "channel": "email",
                        "template": "conversion_thank_you",
                        "delay_minutes": 30
                    },
                    {
                        "type": "create_task",
                        "title": "Onboarding client nouveau",
                        "description": "Commencer le processus d'onboarding pour le nouveau client",
                        "due_hours": 48,
                        "priority": "high"
                    }
                ],
                "enabled": True
            }
        ]
    
    async def evaluate_lead(self, lead_entity: Entity) -> List[Dict[str, Any]]:
        """
        Evaluate a lead against all active rules and return actions to execute
        """
        actions_to_execute = []
        
        # Convert entity to dict for easier evaluation
        lead_dict = {
            "id": str(lead_entity.id),
            "type": lead_entity.type,
            "status": lead_entity.status,
            "first_name": lead_entity.first_name,
            "last_name": lead_entity.last_name,
            "phone": lead_entity.phone,
            "email": lead_entity.email,
            "metadata": lead_entity.entity_metadata or {}
        }
        
        for rule in self.rules:
            if not rule.get("enabled", True):
                continue
                
            if await self._evaluate_rule(rule, lead_dict):
                actions_to_execute.append({
                    "rule_id": rule["id"],
                    "rule_name": rule["name"],
                    "actions": rule["actions"],
                    "lead_id": str(lead_entity.id)
                })
        
        return actions_to_execute
    
    async def _evaluate_rule(self, rule: Dict[str, Any], lead: Dict[str, Any]) -> bool:
        """
        Evaluate a single rule against a lead
        """
        trigger = rule.get("trigger")
        
        # For now, we'll evaluate all rules on every check
        # In a production system, we'd use event-driven triggers
        conditions = rule.get("conditions", [])
        
        for condition in conditions:
            if not self._evaluate_condition(condition, lead):
                return False
        
        return True
    
    def _evaluate_condition(self, condition: Dict[str, Any], lead: Dict[str, Any]) -> bool:
        """
        Evaluate a single condition
        """
        field = condition.get("field")
        operator = condition.get("operator", "==")
        value = condition.get("value")
        
        # Handle special field paths
        if field.startswith("metadata."):
            # Get value from metadata
            key = field[9:]  # Remove "metadata." prefix
            field_value = lead.get("metadata", {}).get(key)
        elif field == "score":
            # Calculate score on the fly
            metadata = lead.get("metadata", {})
            context = {
                "interaction_count": metadata.get("interaction_count", 0),
                "hours_since_last_interaction": get_hours_since_last_interaction(
                    metadata.get("last_interaction_at")
                ),
                "page_views": metadata.get("page_views", 1),
                "last_channel_used": metadata.get("last_channel_used", "")
            }
            score_result = calculate_lead_score_with_breakdown(metadata, context)
            field_value = score_result["total"]
        elif field == "tier":
            metadata = lead.get("metadata", {})
            context = {
                "interaction_count": metadata.get("interaction_count", 0),
                "hours_since_last_interaction": get_hours_since_last_interaction(
                    metadata.get("last_interaction_at")
                ),
                "page_views": metadata.get("page_views", 1),
                "last_channel_used": metadata.get("last_channel_used", "")
            }
            score_result = calculate_lead_score_with_breakdown(metadata, context)
            field_value = score_result["tier"]
        else:
            # Direct field access
            field_value = lead.get(field)
        
        # Handle special operators
        if operator == "exists":
            return field_value is not None
        elif operator == "not_exists":
            return field_value is None
        elif operator == "in":
            return field_value in value if isinstance(value, list) else False
        elif operator == "not_in":
            return field_value not in value if isinstance(value, list) else True
        elif operator == "contains":
            return isinstance(field_value, str) and value in field_value
        elif operator == "starts_with":
            return isinstance(field_value, str) and field_value.startswith(value)
        elif operator == "ends_with":
            return isinstance(field_value, str) and field_value.endswith(value)
        elif operator == "older_than":
            # Value is in hours, check if field_value is older than that
            if field_value is None:
                return False
            try:
                if isinstance(field_value, str):
                    dt = datetime.fromisoformat(field_value.replace('Z', '+00:00'))
                else:
                    dt = field_value
                hours_diff = (datetime.now() - dt).total_seconds() / 3600
                return hours_diff > float(value)
            except Exception:
                return False
        elif operator == "changed_to":
            # This would require tracking previous state - simplified for now
            return field_value == value
        else:
            # Standard comparison operators
            if field_value is None:
                return False
                
            if operator == "==":
                return fact_value == value
            elif operator == "!=":
                return fact_value != value
            elif operator == ">=":
                return float(fact_value) >= float(value)
            elif operator == ">":
                return float(fact_value) > float(value)
            elif operator == "<=":
                return float(fact_value) <= float(value)
            elif operator == "<":
                return float(fact_value) < float(value)
            else:
                return False
    
    async def execute_actions(self, actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute a list of actions and return results
        """
        results = []
        
        for action in actions:
            try:
                result = await self._execute_action(action)
                results.append({
                    "action": action,
                    "success": True,
                    "result": result
                })
            except Exception as e:
                logger.error(f"Error executing action {action}: {str(e)}")
                results.append({
                    "action": action,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    async def _execute_action(self, action: Dict[str, Any]) -> Any:
        """
        Execute a single action
        """
        action_type = action.get("type")
        
        if action_type == "send_message":
            return await self._send_message(action)
        elif action_type == "assign_to_agent":
            return await self._assign_to_agent(action)
        elif action_type == "update_pipeline_stage":
            return await self._update_pipeline_stage(action)
        elif action_type == "send_internal_notification":
            return await self._send_internal_notification(action)
        elif action_type == "update_metadata":
            return await self._update_metadata(action)
        elif action_type == "create_task":
            return await self._create_task(action)
        elif action_type == "add_to_nurture_campaign":
            return await self._add_to_nurture_campaign(action)
        else:
            raise ValueError(f"Unknown action type: {action_type}")
    
    async def _send_message(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Send a message via specified channel"""
        # This would integrate with your messaging services (WhatsApp, SMS, Email, etc.)
        # For now, we'll just log it
        channel = action.get("channel")
        template = action.get("template")
        lead_id = action.get("lead_id")
        
        logger.info(f"Would send {template} via {channel} to lead {lead_id}")
        
        return {
            "action": "send_message",
            "channel": channel,
            "template": template,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _assign_to_agent(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Assign lead to an agent"""
        method = action.get("method", "round_robin")
        lead_id = action.get("lead_id")
        
        # In a real system, this would query available agents and assign based on method
        # For now, we'll simulate
        agent_id = "agent_001"  # Simplified
        
        # Update lead metadata with assigned agent
        # This would be done via the entity service update
        
        logger.info(f"Would assign lead {lead_id} to agent {agent_id} using {method}")
        
        return {
            "action": "assign_to_agent",
            "agent_id": agent_id,
            "method": method,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _update_pipeline_stage(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Update lead's pipeline stage"""
        stage = action.get("stage")
        lead_id = action.get("lead_id")
        
        logger.info(f"Would update pipeline stage for lead {lead_id} to {stage}")
        
        return {
            "action": "update_pipeline_stage",
            "stage": stage,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _send_internal_notification(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Send internal notification"""
        message = action.get("message")
        priority = action.get("priority", "normal")
        lead_id = action.get("lead_id")
        
        logger.info(f"Would send internal notification: {message} (priority: {priority}) for lead {lead_id}")
        
        return {
            "action": "send_internal_notification",
            "message": message,
            "priority": priority,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _update_metadata(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Update lead metadata"""
        data = action.get("data", {})
        lead_id = action.get("lead_id")
        
        logger.info(f"Would update metadata for lead {lead_id}: {data}")
        
        return {
            "action": "update_metadata",
            "data": data,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _create_task(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Create a task"""
        title = action.get("title")
        description = action.get("description")
        due_hours = action.get("due_hours", 24)
        priority = action.get("priority", "medium")
        lead_id = action.get("lead_id")

        due_date = datetime.now() + timedelta(hours=due_hours)

        logger.info(f"Would create task: {title} (due: {due_date}) for lead {lead_id}")

        return {
            "action": "create_task",
            "title": title,
            "description": description,
            "due_hours": due_hours,
            "priority": priority,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _add_to_nurture_campaign(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Add lead to a nurture campaign"""
        campaign_id = action.get("campaign_id")
        lead_id = action.get("lead_id")
        
        logger.info(f"Would add lead {lead_id} to nurture campaign {campaign_id}")
        
        return {
            "action": "add_to_nurture_campaign",
            "campaign_id": campaign_id,
            "lead_id": lead_id,
            "timestamp": datetime.now().isoformat()
        }

# Singleton instance
_automation_engine_instance = None

def get_automation_engine(db=None) -> AutomationEngine:
    """Get or create automation engine instance"""
    global _automation_engine_instance
    if _automation_engine_instance is None:
        if db is None:
            # In a real app, you'd get DB from dependency injection
            raise ValueError("Database session required for initial creation")
        _automation_engine_instance = AutomationEngine(db)
    return _automation_engine_instance

