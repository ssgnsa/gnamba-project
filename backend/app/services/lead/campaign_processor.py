"""
Campaign Processor Service - Handles sending of marketing campaigns
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.models.entity import Entity
from app.services.entity_service import get_entity_service
from app.services.lead.scoring import get_hours_since_last_interaction

logger = logging.getLogger(__name__)


class CampaignProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.entity_service = get_entity_service(db)

    async def process_campaign(self, campaign_id: UUID) -> Dict[str, Any]:
        """
        Process a campaign: sending, tracking results, and updating statistics
        """
        try:
            # Get campaign details
            campaign = await self._get_campaign(campaign_id)
            if not campaign:
                return {
                    "success": False,
                    "error": "Campaign not found",
                    "campaign_id": str(campaign_id)
                }

            # Update campaign status to running
            await self._update_campaign_status(campaign_id, "running")

            # Get leads matching the campaign segment
            leads = await self._get_segmented_leads(campaign)

            # Initialize stats
            stats = {
                "sent": 0,
                "delivered": 0,
                "read": 0,
                "failed": 0,
                "opted_out": 0
            }

            # Process each lead
            for lead in leads:
                try:
                    # Send via each channel in campaign
                    for channel in campaign.get('channels', []):
                        if self._should_send_to_lead(lead, channel):
                            result = await self._send_via_channel(lead, channel, campaign)

                            # Log interaction
                            await self._log_interaction(
                                lead['id'],
                                channel,
                                "sent",
                                result,
                                campaign.get('template_content', {}).get(channel, "")
                            )

                            # Update stats based on result
                            if result.get("success"):
                                stats["sent"] += 1
                                # In a real implementation, we'd track delivery/read status
                                # via webhooks or callbacks from the messaging providers
                            else:
                                stats["failed"] += 1

                except Exception as e:
                    logger.error(f"Error processing lead {lead['id']} in campaign {campaign_id}: {str(e)}")
                    stats["failed"] += 1
                    continue

            # Update campaign with stats and mark as completed
            await self._update_campaign_stats(campaign_id, stats)
            await self._update_campaign_status(campaign_id, "completed")

            return {
                "success": True,
                "campaign_id": str(campaign_id),
                "processed_leads": len(leads),
                "stats": stats
            }

        except Exception as e:
            logger.error(f"Error processing campaign {campaign_id}: {str(e)}")
            # Mark campaign as failed
            await self._update_campaign_status(campaign_id, "failed")
            return {
                "success": False,
                "error": str(e),
                "campaign_id": str(campaign_id)
            }

    async def _get_campaign(self, campaign_id: UUID) -> Optional[Dict[str, Any]]:
        """Get campaign from database"""
        # This would query the lead_campaigns table
        # For now, we'll simulate since the exact schema might vary
        try:
            result = self.db.execute(
                text("""
                    SELECT id, nom, description, statut, canaux, kpi_cibles,
                           kpi_reels, template_content, date_debut, date_fin
                    FROM lead_campaigns
                    WHERE id = :campaign_id
                """),
                {"campaign_id": campaign_id}
            ).fetchone()

            if result:
                return {
                    "id": str(result[0]),
                    "name": result[1],
                    "description": result[2],
                    "status": result[3],
                    "channels": result[4] if isinstance(result[4], list) else [],
                    "kpi_cibles": result[5] or {},
                    "kpi_reels": result[6] or {},
                    "template_content": result[7] or {},
                    "date_debut": result[8],
                    "date_fin": result[9]
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching campaign {campaign_id}: {str(e)}")
            return None

    async def _get_segmented_leads(self, campaign: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get leads matching the campaign segment filters"""
        try:
            # Start with all leads
            query = """
                SELECT e.id, e.first_name, e.last_name, e.phone, e.email,
                       e.entity_metadata, e.created_at, e.updated_at
                FROM entities e
                WHERE e.type = 'lead' AND e.deleted_at IS NULL
            """
            params = {}

            segment_filter = campaign.get('segment_filter', {})

            # Apply status filter
            if segment_filter.get('status'):
                status_val = segment_filter['status']
                # Map frontend status to backend status
                if status_val == 'active':
                    query += " AND (e.status = 'active' OR (e.entity_metadata->>'statut' = 'nouveau'))"
                elif status_val == 'opted_out':
                    query += " AND e.entity_metadata->>'statut' = 'opted_out'"
                elif status_val == 'converted':
                    query += " AND e.entity_metadata->>'statut' = 'converti'"
                elif status_val == 'bounced':
                    query += " AND e.entity_metadata->>'statut' = 'bounced'"
                else:
                    query += " AND e.status = :status"
                    params["status"] = status_val

            # Apply channel filter (leads who opted in to at least one of the campaign channels)
            campaign_channels = set(campaign.get('channels', []))
            if campaign_channels:
                # This is a simplified check - in reality we'd need to check the JSONB
                query += """ AND (
                    e.entity_metadata->>'channels_optin' IS NOT NULL
                )"""
                # Note: A more precise implementation would parse the JSONB channels_optin

            # Apply search filter
            if segment_filter.get('search'):
                search_term = f"%{segment_filter['search']}%"
                query += """ AND (
                    e.first_name ILIKE :search OR
                    e.last_name ILIKE :search OR
                    e.phone ILIKE :search OR
                    e.email ILIKE :search
                )"""
                params["search"] = search_term

            # Apply tier filter - this would require joining with scoring logic
            # For now, we'll skip complex filtering and do it in Python
            # A production implementation would materialize the score in the DB

            # Apply lead count limit
            max_leads = segment_filter.get('lead_count', 1000)
            query += " ORDER BY e.created_at DESC LIMIT :limit"
            params["limit"] = max_leads

            # Execute query
            result = self.db.execute(text(query), params)

            leads = []
            for row in result:
                lead = {
                    "id": str(row[0]),
                    "first_name": row[1],
                    "last_name": row[2],
                    "phone": row[3],
                    "email": row[4],
                    "entity_metadata": row[5] if isinstance(row[5], dict) else {},
                    "created_at": row[6],
                    "updated_at": row[7]
                }
                leads.append(lead)

            # Apply tier filter in Python if needed
            if segment_filter.get('tier'):
                tier = segment_filter['tier']
                leads = [
                    lead for lead in leads
                    if self._get_lead_tier(lead) == tier
                ]

            return leads

        except Exception as e:
            logger.error(f"Error getting segmented leads for campaign {campaign['id']}: {str(e)}")
            return []

    def _should_send_to_lead(self, lead: Dict[str, Any], channel: str) -> bool:
        """Check if lead has opted in to receive communications via the given channel"""
        metadata = lead.get('entity_metadata', {})
        channels_optin = metadata.get('channels_optin', {})

        # Handle both dict and string formats for channels_optin
        if isinstance(channels_optin, dict):
            return channels_optin.get(channel, False)
        elif isinstance(channels_optin, list):
            return channel in channels_optin
        else:
            return False

    async def _send_via_channel(self, lead: Dict[str, Any], channel: str, campaign: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send message via specific channel
        This is a placeholder - in reality this would integrate with:
        - WhatsApp Business API
        - Twilio for SMS
        - SendGrid/SMTP for Email
        - Telegram Bot API
        """
        # For now, simulate sending
        template_content = campaign.get('template_content', {})
        message = template_content.get(channel, f"Message via {channel}")

        logger.info(f"Sending {channel} message to lead {lead['id']}: {message[:50]}...")

        # Simulate success/failure (90% success rate for demo)
        import random
        success = random.random() < 0.9

        if success:
            return {
                "success": True,
                "message_id": f"{channel}_{datetime.now().timestamp()}",
                "channel": channel,
                "to": lead.get('phone' if channel in ['sms', 'whatsapp'] else lead.get('email')),
                "message": message
            }
        else:
            return {
                "success": False,
                "error": f"Failed to send via {channel}",
                "channel": channel
            }

    async def _log_interaction(
        self,
        lead_id: str,
        channel: str,
        direction: str,
        result: Dict[str, Any],
        content: str = ""
    ) -> None:
        """Log an interaction in the lead_interactions table"""
        try:
            # This would insert into lead_interactions table
            interaction_data = {
                "lead_id": lead_id,
                "type": f"campaign_{channel}",
                "direction": direction,
                "sujet": f"Campagne: {content[:50]}" if content else f"Message {channel}",
                "contenu": content,
                "resultat": "sent" if result.get("success") else "failed",
                "metadata": result
            }

            # For now, just log it
            logger.info(f"Logging interaction: {interaction_data}")

            # In a real implementation:
            # self.db.execute(
            #     text("""
            #         INSERT INTO lead_interactions
            #         (lead_id, type, direction, sujet, contenu, resultat, metadata_json, created_at)
            #         VALUES (:lead_id, :type, :direction, :sujet, :contenu, :resultat, :metadata, :created_at)
            #     """),
            #     {
            #         "lead_id": lead_id,
            #         "type": interaction_data["type"],
            #         "direction": interaction_data["direction"],
            #         "sujet": interaction_data["sujet"],
            #         "contenu": interaction_data["contenu"],
            #         "resultat": interaction_data["resultat"],
            #         "metadata": json.dumps(interaction_data["metadata"]),
            #         "created_at": datetime.now()
            #     }
            # )
            # self.db.commit()

        except Exception as e:
            logger.error(f"Error logging interaction for lead {lead_id}: {str(e)}")

    async def _update_campaign_status(self, campaign_id: UUID, status: str) -> None:
        """Update campaign status in database"""
        try:
            self.db.execute(
                text("""
                    UPDATE lead_campaigns
                    SET statut = :status, updated_at = :updated_at
                    WHERE id = :campaign_id
                """),
                {
                    "campaign_id": campaign_id,
                    "status": status,
                    "updated_at": datetime.now()
                }
            )
            self.db.commit()
        except Exception as e:
            logger.error(f"Error updating campaign status: {str(e)}")
            self.db.rollback()

    async def _update_campaign_stats(self, campaign_id: UUID, stats: Dict[str, int]) -> None:
        """Update campaign statistics in database"""
        try:
            self.db.execute(
                text("""
                    UPDATE lead_campaigns
                    SET kpi_reels = :kpi_reels, updated_at = :updated_at
                    WHERE id = :campaign_id
                """),
                {
                    "campaign_id": campaign_id,
                    "kpi_reels": stats,
                    "updated_at": datetime.now()
                }
            )
            self.db.commit()
        except Exception as e:
            logger.error(f"Error updating campaign stats: {str(e)}")
            self.db.rollback()

    def _get_lead_tier(self, lead: Dict[str, Any]) -> str:
        """Determine lead tier based on metadata score or calculate it"""
        metadata = lead.get('entity_metadata', {})

        # If score is already stored in metadata, use it
        if 'score' in metadata:
            score = metadata['score']
        else:
            # Calculate score on the fly
            from app.services.lead.scoring import calculate_lead_score_with_breakdown
            # We would need interaction context here - for now use defaults
            result = calculate_lead_score_with_breakdown(metadata, {})
            score = result['total']

        if score >= 70:
            return 'hot'
        elif score >= 40:
            return 'warm'
        else:
            # Check if churned (no interaction for 30+ days)
            # This would require checking last interaction time
            # For simplicity, we'll just return 'cold'
            return 'cold'