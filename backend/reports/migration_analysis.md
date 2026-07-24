# Migration Dependency & Risk Analysis

- Total migrations found: 116

## Apply Order (Recommended Sequence)



### Functions


1. **20260405130000_add_comprehensive_rls_policies**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 20 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Replace overly permissive USING (true) with role-based policies

2. **20260408120000_rls_critical_tables**  🟡
   - Timestamp: 
   - Creates: 0 tables, 3 functions, 24 policies
   - RLS enabled on: app_settings, finances, media_files, page_layouts, site_content, user_profiles
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - user_profiles was created without RLS — any authenticated user could read/modify all profiles and roles

3. **20260503084300_add_attestation_pdf_metadata**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies

4. **20260515000002_leads_module_rls_policies**  🟡
   - Timestamp: 
   - Creates: 0 tables, 6 functions, 0 policies
   - RLS enabled on: campagnes, lead_campagnes, leads, ventes_foncieres, visites_terrain
   - ⚠️ Risk: MEDIUM

5. **20260515100000_fix_security_definer_search_path**  🟡
   - Timestamp: 
   - Creates: 0 tables, 8 functions, 0 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Bloquer les attaques search_path injection sur toutes les

6. **20260330000000_fix_unique_constraint**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies

7. **20260508100000_fix_foncier_standalone**  🟡
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 4 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Apply audit recommendations for foncier module (standalone version)

8. **20260622100713_fix_user_profiles_rls_recursion**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 4 policies
   - RLS enabled on: user_profiles
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - Remove recursive policies on public.user_profiles

9. **20260409000002_fix_security_definer_functions**  🟢
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 0 policies
   - Purpose: --   - soft_delete_foncier_lot(), restore_foncier_lot(), log_foncier_audit()

10. **20260515000003_add_rpc_functions**  🟢
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 0 policies

11. **20260408030000_current_user_role_fn**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies

12. **20260511090000_debug_stats_function**  🟢
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 0 policies

13. **20260409000001_add_rls_business_tables**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 32 policies
   - RLS enabled on: clients, contact_messages, documents, employees, products, projects, suppliers, tasks
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - These tables were identified with ZERO Row Level Security

14. **20260609102844_foncier_village_normalization**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies
   - Purpose: --   - add a normalized village foreign key to foncier_lots

15. **20260508000000_fix_foncier_audit_recommendations**  🟡
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 4 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Apply audit recommendations for foncier module

### Tables


16. **20260524000001_create_media_tables_reference**  🟡
   - Timestamp: 
   - Creates: 4 tables, 0 functions, 12 policies
   - Tables: media_audit_logs, media_files, media_usage, media_versions
   - RLS enabled on: media_audit_logs, media_files, media_usage, media_versions
   - ⚠️ Risk: MEDIUM

17. **20260402080000_create_immobilier_tables**  🟡
   - Timestamp: 
   - Creates: 4 tables, 0 functions, 4 policies
   - Tables: lease_contracts, properties, rent_payments, tenants
   - RLS enabled on: lease_contracts, properties, rent_payments, tenants
   - ⚠️ Risk: MEDIUM
   - Purpose: Create all tables for Real Estate module

18. **20260509140000_create_village_logos_bucket**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry
   - RLS enabled on: village_logo_registry
   - ⚠️ Risk: MEDIUM

19. **20260428000003_migrate_tenants_to_locataires**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 4 policies
   - Tables: locataires
   - RLS enabled on: locataires
   - ⚠️ Risk: MEDIUM
   - Purpose: Migrate data first, then create FKs

20. **20260604161000_add_whatsapp_notifications**  🟢
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 0 policies
   - Tables: whatsapp_notifications

21. **20260702000000_fix_user_invites_and_create_profile_rpc**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 1 policies
   - Tables: user_invites
   - RLS enabled on: user_invites
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - support the admin invite flow used by the Utilisateurs UI

22. **20260509180000_fix_storage_rls_policies**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry_fallback
   - RLS enabled on: village_logo_registry_fallback
   - ⚠️ Risk: MEDIUM

23. **20260325000000_create_user_profiles_base**  🟡
   - Timestamp: 
   - Creates: 1 tables, 2 functions, 0 policies
   - Tables: user_profiles
   - RLS enabled on: user_profiles
   - ⚠️ Risk: MEDIUM

24. **20260508110000_fix_foncier_rpc_security**  🟡
   - Timestamp: 
   - Creates: 1 tables, 2 functions, 4 policies
   - Tables: user_village_access
   - RLS enabled on: user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Add SECURITY DEFINER to RPC functions to bypass RLS policies

25. **20260324000000_create_foncier_base_tables_and_rpc**  🟡
   - Timestamp: 
   - Creates: 4 tables, 8 functions, 10 policies
   - Tables: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - RLS enabled on: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Fixes CRITICAL audit findings — foncier_lots table never created

26. **20260509160000_fix_village_logo_registry_table**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry
   - RLS enabled on: village_logo_registry
   - ⚠️ Risk: MEDIUM

27. **20260521120000_media_audit_logs**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 2 policies
   - Tables: media_audit_logs
   - RLS enabled on: media_audit_logs
   - ⚠️ Risk: MEDIUM

28. **20260701000000_fix_public_access_and_dashboard_tables**  🟡
   - Timestamp: 
   - Creates: 5 tables, 3 functions, 21 policies
   - Tables: activites_journal, employes_presence, messages_direction, stats_journalieres, visites_en_cours
   - RLS enabled on: activites_journal, app_settings, employes_presence, messages_direction, page_layouts, site_content, site_realisations, stats_journalieres, visites_en_cours
   - ⚠️ Risk: MEDIUM

29. **20260402090000_fix_tenants_schema**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 0 policies
   - Tables: tenants
   - RLS enabled on: tenants
   - ⚠️ Risk: MEDIUM

30. **20260607090724_create_vitrine_lots_table**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 4 policies
   - Tables: vitrine_lots
   - RLS enabled on: vitrine_lots
   - ⚠️ Risk: MEDIUM

31. **20260405140000_create_lead_capture_system**  🟡
   - Timestamp: 
   - Creates: 6 tables, 4 functions, 12 policies
   - Tables: bot_workflows, lead_campaigns, lead_interactions, lead_optouts, leads, social_posts
   - RLS enabled on: bot_workflows, lead_campaigns, lead_interactions, lead_optouts, leads, social_posts
   - ⚠️ Risk: MEDIUM
   - Purpose: Universal phone number capture from all ERP forms

32. **20260326000000_create_foncier_attestations_tables**  🟡
   - Timestamp: 
   - Creates: 3 tables, 2 functions, 0 policies
   - Tables: foncier_attestation_temoins, foncier_attestations, if
   - RLS enabled on: foncier_attestation_temoins, foncier_attestations
   - ⚠️ Risk: MEDIUM

33. **20260409141423_demo_account_sample_data**  🟡
   - Timestamp: 
   - Creates: 2 tables, 1 functions, 15 policies
   - Tables: app_settings, user_profiles
   - RLS enabled on: app_settings, user_profiles
   - ⚠️ Risk: MEDIUM

34. **20260515000001_create_leads_module**  🟡
   - Timestamp: 
   - Creates: 5 tables, 1 functions, 0 policies
   - Tables: campagnes, lead_campagnes, leads, ventes_foncieres, visites_terrain
   - ⚠️ Risk: MEDIUM

35. **20260702020000_create_parties_model**  🟢
   - Timestamp: 
   - Creates: 5 tables, 0 functions, 0 policies
   - Tables: parties, party_lead_details, party_merge_candidates, party_merge_log, party_roles

36. **20260403090000_create_core_business_tables**  🟡
   - Timestamp: 
   - Creates: 17 tables, 0 functions, 0 policies
   - Tables: app_settings, clients, contact_messages, documents, employees, finances, media_audit_logs, media_files, media_usage, media_versions, page_layouts, products, projects, site_content, site_realisations, suppliers, tasks
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - Recreate the core business tables that are referenced by later

37. **20260405150000_create_foncier_base_tables_and_rpc**  🟡
   - Timestamp: 
   - Creates: 4 tables, 8 functions, 10 policies
   - Tables: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - RLS enabled on: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Fixes CRITICAL audit findings — foncier_lots table never created

38. **20260524000001_create_media_tables_reference**  🟡
   - Timestamp: 
   - Creates: 4 tables, 0 functions, 12 policies
   - Tables: media_audit_logs, media_files, media_usage, media_versions
   - RLS enabled on: media_audit_logs, media_files, media_usage, media_versions
   - ⚠️ Risk: MEDIUM

39. **20260402080000_create_immobilier_tables**  🟡
   - Timestamp: 
   - Creates: 4 tables, 0 functions, 4 policies
   - Tables: lease_contracts, properties, rent_payments, tenants
   - RLS enabled on: lease_contracts, properties, rent_payments, tenants
   - ⚠️ Risk: MEDIUM
   - Purpose: Create all tables for Real Estate module

40. **20260509140000_create_village_logos_bucket**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry
   - RLS enabled on: village_logo_registry
   - ⚠️ Risk: MEDIUM

41. **20260428000003_migrate_tenants_to_locataires**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 4 policies
   - Tables: locataires
   - RLS enabled on: locataires
   - ⚠️ Risk: MEDIUM
   - Purpose: Migrate data first, then create FKs

### Functions


42. **20260405130000_add_comprehensive_rls_policies**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 20 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Replace overly permissive USING (true) with role-based policies

43. **20260408120000_rls_critical_tables**  🟡
   - Timestamp: 
   - Creates: 0 tables, 3 functions, 24 policies
   - RLS enabled on: app_settings, finances, media_files, page_layouts, site_content, user_profiles
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - user_profiles was created without RLS — any authenticated user could read/modify all profiles and roles

### RLS/Policies


44. **20260511110000_fix_media_storage_rls_v3**  🟡
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 12 policies
   - RLS enabled on: media_files, media_usage, media_versions
   - ⚠️ Risk: MEDIUM

### Tables


45. **20260702000000_fix_user_invites_and_create_profile_rpc**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 1 policies
   - Tables: user_invites
   - RLS enabled on: user_invites
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - support the admin invite flow used by the Utilisateurs UI

46. **20260509180000_fix_storage_rls_policies**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry_fallback
   - RLS enabled on: village_logo_registry_fallback
   - ⚠️ Risk: MEDIUM

### RLS/Policies


47. **20260608171419_foncier_phase1_critical_rls**  🟡
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 12 policies
   - RLS enabled on: foncier_attestation_temoins, foncier_attestations, foncier_lots
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - close the two critical Foncier security gaps identified in the audit

### Tables


48. **20260325000000_create_user_profiles_base**  🟡
   - Timestamp: 
   - Creates: 1 tables, 2 functions, 0 policies
   - Tables: user_profiles
   - RLS enabled on: user_profiles
   - ⚠️ Risk: MEDIUM

### RLS/Policies


49. **20260509100000_fix_village_config_rls**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 3 policies
   - Purpose: Allow authenticated users to insert village config during development

### Tables


50. **20260508110000_fix_foncier_rpc_security**  🟡
   - Timestamp: 
   - Creates: 1 tables, 2 functions, 4 policies
   - Tables: user_village_access
   - RLS enabled on: user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Add SECURITY DEFINER to RPC functions to bypass RLS policies

### RLS/Policies


51. **20260408080000_rls_rent_payments**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies

### Functions


52. **20260515000002_leads_module_rls_policies**  🟡
   - Timestamp: 
   - Creates: 0 tables, 6 functions, 0 policies
   - RLS enabled on: campagnes, lead_campagnes, leads, ventes_foncieres, visites_terrain
   - ⚠️ Risk: MEDIUM

### Tables


53. **20260324000000_create_foncier_base_tables_and_rpc**  🟡
   - Timestamp: 
   - Creates: 4 tables, 8 functions, 10 policies
   - Tables: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - RLS enabled on: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Fixes CRITICAL audit findings — foncier_lots table never created

54. **20260509160000_fix_village_logo_registry_table**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 0 policies
   - Tables: village_logo_registry
   - RLS enabled on: village_logo_registry
   - ⚠️ Risk: MEDIUM

55. **20260521120000_media_audit_logs**  🟡
   - Timestamp: 
   - Creates: 1 tables, 0 functions, 2 policies
   - Tables: media_audit_logs
   - RLS enabled on: media_audit_logs
   - ⚠️ Risk: MEDIUM

### RLS/Policies


56. **20260408100000_rls_locataires**  🟡
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies
   - RLS enabled on: locataires
   - ⚠️ Risk: MEDIUM

57. **20260510090000_fix_foncier_village_config_rls**  🟡
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies
   - RLS enabled on: foncier_village_config
   - ⚠️ Risk: MEDIUM

### Tables


58. **20260701000000_fix_public_access_and_dashboard_tables**  🟡
   - Timestamp: 
   - Creates: 5 tables, 3 functions, 21 policies
   - Tables: activites_journal, employes_presence, messages_direction, stats_journalieres, visites_en_cours
   - RLS enabled on: activites_journal, app_settings, employes_presence, messages_direction, page_layouts, site_content, site_realisations, stats_journalieres, visites_en_cours
   - ⚠️ Risk: MEDIUM

### RLS/Policies


59. **20260525000001_create_village_logos_bucket**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies

### Tables


60. **20260402090000_fix_tenants_schema**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 0 policies
   - Tables: tenants
   - RLS enabled on: tenants
   - ⚠️ Risk: MEDIUM

### RLS/Policies


61. **20260408070000_rls_lease_contracts**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies

### Functions


62. **20260508100000_fix_foncier_standalone**  🟡
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 4 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Apply audit recommendations for foncier module (standalone version)

63. **20260622100713_fix_user_profiles_rls_recursion**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 4 policies
   - RLS enabled on: user_profiles
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - Remove recursive policies on public.user_profiles

### RLS/Policies


64. **20260405120000_rename_tenants_to_locataires**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies
   - Purpose: Eliminate naming collision with other tenant-style tables

### Tables


65. **20260607090724_create_vitrine_lots_table**  🟡
   - Timestamp: 
   - Creates: 1 tables, 1 functions, 4 policies
   - Tables: vitrine_lots
   - RLS enabled on: vitrine_lots
   - ⚠️ Risk: MEDIUM

66. **20260405140000_create_lead_capture_system**  🟡
   - Timestamp: 
   - Creates: 6 tables, 4 functions, 12 policies
   - Tables: bot_workflows, lead_campaigns, lead_interactions, lead_optouts, leads, social_posts
   - RLS enabled on: bot_workflows, lead_campaigns, lead_interactions, lead_optouts, leads, social_posts
   - ⚠️ Risk: MEDIUM
   - Purpose: Universal phone number capture from all ERP forms

67. **20260326000000_create_foncier_attestations_tables**  🟡
   - Timestamp: 
   - Creates: 3 tables, 2 functions, 0 policies
   - Tables: foncier_attestation_temoins, foncier_attestations, if
   - RLS enabled on: foncier_attestation_temoins, foncier_attestations
   - ⚠️ Risk: MEDIUM

68. **20260409141423_demo_account_sample_data**  🟡
   - Timestamp: 
   - Creates: 2 tables, 1 functions, 15 policies
   - Tables: app_settings, user_profiles
   - RLS enabled on: app_settings, user_profiles
   - ⚠️ Risk: MEDIUM

### RLS/Policies


69. **20260510100000_fix_foncier_functions_rls**  🟡
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 8 policies
   - RLS enabled on: foncier_attestation_temoins, foncier_attestations
   - ⚠️ Risk: MEDIUM

70. **20260408090000_rls_properties**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies

71. **20260524000004_create_media_bucket_and_storage_policies**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 4 policies

### Functions


72. **20260409000001_add_rls_business_tables**  🟡
   - Timestamp: 
   - Creates: 0 tables, 2 functions, 32 policies
   - RLS enabled on: clients, contact_messages, documents, employees, products, projects, suppliers, tasks
   - ⚠️ Risk: MEDIUM
   - Purpose: --   - These tables were identified with ZERO Row Level Security

73. **20260508000000_fix_foncier_audit_recommendations**  🟡
   - Timestamp: 
   - Creates: 0 tables, 4 functions, 4 policies
   - ⚠️ Risk: MEDIUM
   - Purpose: Apply audit recommendations for foncier module

### Tables


74. **20260405150000_create_foncier_base_tables_and_rpc**  🟡
   - Timestamp: 
   - Creates: 4 tables, 8 functions, 10 policies
   - Tables: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - RLS enabled on: foncier_audit, foncier_lots, foncier_villages, user_village_access
   - ⚠️ Risk: MEDIUM
   - Purpose: Fixes CRITICAL audit findings — foncier_lots table never created

### Indexes


75. **20260401080000_fix_foncier_attestations**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

76. **20260604170000_add_onesignal_to_properties**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies
   - Purpose: Add onesignal_player_id column to properties table for push notifications

77. **20260521110000_media_center_improvements**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

78. **20260401090000_foncier_attestation_reference_archive**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

### Functions


79. **20260330000000_fix_unique_constraint**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies

### Indexes


80. **20260609105850_foncier_public_verification_hardening**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies
   - Purpose: --   - add a minimal verification view for the public attestation endpoint

81. **20260524000002_fix_media_usage_column_names**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

82. **20260512_unify_immobilier_schema**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

83. **20260525170000_add_foncier_lots_publier_vitrine**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

### Functions


84. **20260609102844_foncier_village_normalization**  🟢
   - Timestamp: 
   - Creates: 0 tables, 1 functions, 0 policies
   - Purpose: --   - add a normalized village foreign key to foncier_lots

### Indexes


85. **20260404110000_align_immobilier_schema**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

86. **20260407000000_fix_foncier_lots**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

87. **20260408020000_idx_foncier_lots_deleted_at**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

### Other


88. **20260521100000_drop_village_logo_registry**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

89. **20260521130000_media_dimensions**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

90. **20260408040000_rename_tenants_table**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

91. **20260404080000_fix_rls_policies_foncier_attestations**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

92. **20260515000004_fix_cors_storage**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

93. **20260604160000_enable_realtime_rent_payments**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

94. **20260509150000_fix_village_logo_registry_rls**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

95. **20260408060000_rename_rent_payments_tenant_col**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

96. **20260409140000_fix_user_profiles_email**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies
   - Purpose: Add email column to user_profiles table

97. **20260524000003_verify_media_schema_cloud**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

98. **20260524000005_media_files_compat_columns**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

99. **20260702010000_fix_leads_ip_address_column**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

100. **20260408050000_rename_lease_contracts_tenant_col**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

101. **20260405160000_fix_lease_contracts_fk_and_cleanup_rls**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

102. **20260608090000_add_foncier_lots_compat_columns**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies
   - Purpose: --   - align the database schema with the current Foncier frontend payload

103. **20260509170000_debug_rls_policies**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

104. **20260408010000_add_foncier_lots_deleted_at**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

105. **20260311170000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

106. **20260311140000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

107. **20260306184030_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

108. **20260306175204_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

109. **20260311210000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

110. **20260311123000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

111. **20260313123000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

112. **20260306192718_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

113. **20260312155000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

114. **20260313120000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

115. **20260311171000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

116. **20260312120000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

117. **20260318120000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

118. **20260318130000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

119. **20260310130000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

120. **20260312154800_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

121. **20260311180000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

122. **20260309170000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

123. **20260313140000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

124. **20260307125104_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

125. **20260306193353_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

126. **20260313130000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

127. **20260311160000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

128. **20260306182111_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

129. **20260312110000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

130. **20260306191105_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

131. **20260313141000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

132. **20260318110000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

133. **20260318164000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

134. **20260307130559_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

135. **20260311190000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

136. **20260307134539_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

137. **20260311203000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

138. **20260307140607_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

139. **20260311150000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

140. **20260312163800_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

141. **20260306185236_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

142. **20260318103000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

143. **20260312100000_placeholder**  🟢
   - Timestamp: 
   - Creates: 0 tables, 0 functions, 0 policies

---
Full JSON: backend/reports/migration_analysis.json