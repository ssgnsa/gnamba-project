# Schema audit report


- migration files scanned: 176
- tables declared in migrations: 55
- tables in DB: 19

## Missing tables (declared in migrations but not present in DB)
- activites_journal
- app_settings
- bot_workflows
- campagnes
- clients
- contact_messages
- documents
- employes_presence
- foncier_attestation_temoins
- foncier_attestations
- foncier_audit
- foncier_villages
- if
- lead_campagnes
- lead_campaigns
- lead_interactions
- lead_optouts
- lease_contracts
- locataires
- messages_direction
- page_layouts
- parties
- party_lead_details
- party_merge_candidates
- party_merge_log
- party_roles
- properties
- rent_payments
- site_realisations
- social_posts
- stats_journalieres
- tasks
- tenants
- user_invites
- user_profiles
- user_village_access
- village_logo_registry
- village_logo_registry_fallback
- visites_en_cours
- vitrine_lots
- whatsapp_notifications

## Extra tables (present in DB but not declared in scanned migrations)
- alembic_version
- foncier_items
- immobilier_items
- lead_captures
- users

## Missing functions declared in migrations
- attach_foncier_attestation_pdf_metadata
- auto_assign_lead
- can_manage_content
- check_attestation_expiration
- check_foncier_duplicate
- create_task_after_visite
- create_user_with_profile
- current_user_role
- ensure_foncier_hierarchy
- foncier_stats_by_village
- get_agent_performance
- get_agent_workload
- get_funnel_stats
- get_leads_needing_attention
- handle_new_user
- has_finance_access
- increment_lead_reponses
- increment_lead_visites
- is_admin
- is_demo_user
- is_gestionnaire
- jwt_app_role
- log_foncier_audit
- normalize_phone
- restore_foncier_lot
- revoke_foncier_attestation
- search_foncier_lots
- soft_delete_foncier_lot
- sync_foncier_lot_village
- trigger_normalize_lead_phone
- update_derniere_interaction
- update_foncier_lots_updated_at
- update_lead_derniere_interaction
- update_lead_score
- update_pipeline_stats
- update_tenants_updated_at
- update_timestamp_trigger
- update_updated_at_column
- update_vitrine_lots_updated_at
- with

## Missing views declared in migrations
- (none)

## Policies expected by migrations but missing tables
- activites_journal
- app_settings
- bot_workflows
- clients
- contact_messages
- documents
- employees
- employes_presence
- finances
- foncier_attestation_temoins
- foncier_attestations
- foncier_audit
- foncier_lots
- foncier_village_config
- foncier_villages
- lead_campaigns
- lead_interactions
- lead_optouts
- leads
- lease_contracts
- locataires
- media_audit_logs
- media_files
- media_usage
- media_versions
- messages_direction
- page_layouts
- products
- projects
- properties
- rent_payments
- site_content
- site_realisations
- social_posts
- stats_journalieres
- storage
- suppliers
- tasks
- tenants
- user_invites
- user_profiles
- user_village_access
- visites_en_cours
- vitrine_lots

---
Full JSON report: backend/reports/schema_audit.json