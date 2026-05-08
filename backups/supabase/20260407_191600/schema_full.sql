┌─────────────────────────────────┬───────────────────────────────────┬──────────────────────────┬─────────────┐
│           table_name            │            column_name            │        data_type         │ is_nullable │
├─────────────────────────────────┼───────────────────────────────────┼──────────────────────────┼─────────────┤
│ activites_journal               │ id                                │ uuid                     │ NO          │
│ activites_journal               │ type                              │ text                     │ NO          │
│ activites_journal               │ titre                             │ text                     │ NO          │
│ activites_journal               │ description                       │ text                     │ YES         │
│ activites_journal               │ icone                             │ text                     │ YES         │
│ activites_journal               │ priorite                          │ text                     │ NO          │
│ activites_journal               │ auteur_id                         │ uuid                     │ YES         │
│ activites_journal               │ auteur_nom                        │ text                     │ YES         │
│ activites_journal               │ entity_type                       │ text                     │ YES         │
│ activites_journal               │ entity_id                         │ text                     │ YES         │
│ activites_journal               │ created_at                        │ timestamp with time zone │ YES         │
│ admin_users_view                │ id                                │ uuid                     │ YES         │
│ admin_users_view                │ email                             │ text                     │ YES         │
│ admin_users_view                │ user_created_at                   │ timestamp with time zone │ YES         │
│ admin_users_view                │ full_name                         │ text                     │ YES         │
│ admin_users_view                │ role                              │ text                     │ YES         │
│ admin_users_view                │ access_level                      │ text                     │ YES         │
│ admin_users_view                │ department                        │ text                     │ YES         │
│ admin_users_view                │ poste                             │ text                     │ YES         │
│ admin_users_view                │ phone                             │ text                     │ YES         │
│ admin_users_view                │ total_actions                     │ bigint                   │ YES         │
│ admin_users_view                │ last_activity                     │ timestamp with time zone │ YES         │
│ alertes_rappels                 │ id                                │ uuid                     │ NO          │
│ alertes_rappels                 │ titre                             │ text                     │ NO          │
│ alertes_rappels                 │ description                       │ text                     │ YES         │
│ alertes_rappels                 │ type                              │ text                     │ NO          │
│ alertes_rappels                 │ date_alerte                       │ timestamp with time zone │ NO          │
│ alertes_rappels                 │ date_expiration                   │ timestamp with time zone │ YES         │
│ alertes_rappels                 │ priorite                          │ text                     │ NO          │
│ alertes_rappels                 │ cibles_tous                       │ boolean                  │ YES         │
│ alertes_rappels                 │ cibles_services                   │ ARRAY                    │ YES         │
│ alertes_rappels                 │ cibles_employes                   │ ARRAY                    │ YES         │
│ alertes_rappels                 │ statut                            │ text                     │ NO          │
│ alertes_rappels                 │ acquittee_par                     │ ARRAY                    │ YES         │
│ alertes_rappels                 │ acquittee_at                      │ timestamp with time zone │ YES         │
│ alertes_rappels                 │ created_by                        │ uuid                     │ YES         │
│ alertes_rappels                 │ created_at                        │ timestamp with time zone │ YES         │
│ alertes_rappels                 │ updated_at                        │ timestamp with time zone │ YES         │
│ app_settings                    │ id                                │ uuid                     │ NO          │
│ app_settings                    │ key                               │ text                     │ NO          │
│ app_settings                    │ value                             │ text                     │ YES         │
│ app_settings                    │ created_at                        │ timestamp with time zone │ YES         │
│ app_settings                    │ updated_at                        │ timestamp with time zone │ YES         │
│ app_settings                    │ turnstile_site_key                │ text                     │ YES         │
│ app_settings                    │ turnstile_enabled                 │ boolean                  │ YES         │
│ audit_logs                      │ id                                │ uuid                     │ NO          │
│ audit_logs                      │ user_id                           │ uuid                     │ YES         │
│ audit_logs                      │ user_email                        │ text                     │ YES         │
│ audit_logs                      │ user_name                         │ text                     │ YES         │
│ audit_logs                      │ action                            │ text                     │ NO          │
│ audit_logs                      │ table_name                        │ text                     │ NO          │
│ audit_logs                      │ record_id                         │ uuid                     │ YES         │
│ audit_logs                      │ old_value                         │ jsonb                    │ YES         │
│ audit_logs                      │ new_value                         │ jsonb                    │ YES         │
│ audit_logs                      │ created_at                        │ timestamp with time zone │ NO          │
│ clients                         │ id                                │ uuid                     │ NO          │
│ clients                         │ nom                               │ text                     │ NO          │
│ clients                         │ prenom                            │ text                     │ NO          │
│ clients                         │ telephone                         │ text                     │ NO          │
│ clients                         │ email                             │ text                     │ YES         │
│ clients                         │ adresse                           │ text                     │ YES         │
│ clients                         │ type_client                       │ text                     │ NO          │
│ clients                         │ notes                             │ text                     │ YES         │
│ clients                         │ created_at                        │ timestamp with time zone │ YES         │
│ clients                         │ updated_at                        │ timestamp with time zone │ YES         │
│ contact_messages                │ id                                │ uuid                     │ NO          │
│ contact_messages                │ name                              │ text                     │ NO          │
│ contact_messages                │ phone                             │ text                     │ YES         │
│ contact_messages                │ email                             │ text                     │ NO          │
│ contact_messages                │ subject                           │ text                     │ YES         │
│ contact_messages                │ message                           │ text                     │ NO          │
│ contact_messages                │ status                            │ text                     │ YES         │
│ contact_messages                │ created_at                        │ timestamp with time zone │ YES         │
│ contracts                       │ id                                │ uuid                     │ NO          │
│ contracts                       │ tenant_id                         │ uuid                     │ YES         │
│ contracts                       │ property_id                       │ uuid                     │ YES         │
│ contracts                       │ contract_number                   │ character varying        │ NO          │
│ contracts                       │ start_date                        │ date                     │ NO          │
│ contracts                       │ end_date                          │ date                     │ YES         │
│ contracts                       │ duration_months                   │ integer                  │ YES         │
│ contracts                       │ monthly_rent_fcfa                 │ numeric                  │ NO          │
│ contracts                       │ deposit_fcfa                      │ numeric                  │ YES         │
│ contracts                       │ conditions                        │ text                     │ YES         │
│ contracts                       │ document_url                      │ text                     │ YES         │
│ contracts                       │ status                            │ character varying        │ YES         │
│ contracts                       │ created_at                        │ timestamp with time zone │ YES         │
│ dashboard_stats                 │ total_properties                  │ bigint                   │ YES         │
│ dashboard_stats                 │ occupied_properties               │ bigint                   │ YES         │
│ dashboard_stats                 │ total_tenants                     │ bigint                   │ YES         │
│ dashboard_stats                 │ monthly_revenue                   │ numeric                  │ YES         │
│ dashboard_stats                 │ late_payments                     │ numeric                  │ YES         │
│ documents                       │ id                                │ uuid                     │ NO          │
│ documents                       │ nom                               │ text                     │ NO          │
│ documents                       │ type_document                     │ text                     │ NO          │
│ documents                       │ url                               │ text                     │ YES         │
│ documents                       │ taille_fichier                    │ bigint                   │ YES         │
│ documents                       │ client_id                         │ uuid                     │ YES         │
│ documents                       │ project_id                        │ uuid                     │ YES         │
│ documents                       │ description                       │ text                     │ YES         │
│ documents                       │ created_at                        │ timestamp with time zone │ YES         │
│ employees                       │ id                                │ uuid                     │ NO          │
│ employees                       │ nom                               │ text                     │ NO          │
│ employees                       │ prenom                            │ text                     │ NO          │
│ employees                       │ poste                             │ text                     │ NO          │
│ employees                       │ telephone                         │ text                     │ YES         │
│ employees                       │ email                             │ text                     │ YES         │
│ employees                       │ salaire                           │ numeric                  │ YES         │
│ employees                       │ date_embauche                     │ date                     │ YES         │
│ employees                       │ statut                            │ text                     │ NO          │
│ employees                       │ notes                             │ text                     │ YES         │
│ employees                       │ created_at                        │ timestamp with time zone │ YES         │
│ employees                       │ updated_at                        │ timestamp with time zone │ YES         │
│ employees                       │ photo_url                         │ text                     │ YES         │
│ employes_en_ligne               │ id                                │ uuid                     │ YES         │
│ employes_en_ligne               │ employe_id                        │ uuid                     │ YES         │
│ employes_en_ligne               │ statut                            │ text                     │ YES         │
│ employes_en_ligne               │ statut_message                    │ text                     │ YES         │
│ employes_en_ligne               │ date_arrivee                      │ timestamp with time zone │ YES         │
│ employes_en_ligne               │ date_depart                       │ timestamp with time zone │ YES         │
│ employes_en_ligne               │ date_naissance                    │ date                     │ YES         │
│ employes_en_ligne               │ service                           │ text                     │ YES         │
│ employes_en_ligne               │ poste                             │ text                     │ YES         │
│ employes_en_ligne               │ avatar_url                        │ text                     │ YES         │
│ employes_en_ligne               │ last_activity                     │ timestamp with time zone │ YES         │
│ employes_en_ligne               │ created_at                        │ timestamp with time zone │ YES         │
│ employes_en_ligne               │ updated_at                        │ timestamp with time zone │ YES         │
│ employes_en_ligne               │ full_name                         │ text                     │ YES         │
│ employes_en_ligne               │ email                             │ character varying        │ YES         │
│ employes_en_ligne               │ phone                             │ text                     │ YES         │
│ employes_en_ligne               │ heures_inactivite                 │ numeric                  │ YES         │
│ employes_presence               │ id                                │ uuid                     │ NO          │
│ employes_presence               │ employe_id                        │ uuid                     │ YES         │
│ employes_presence               │ statut                            │ text                     │ NO          │
│ employes_presence               │ statut_message                    │ text                     │ YES         │
│ employes_presence               │ date_arrivee                      │ timestamp with time zone │ YES         │
│ employes_presence               │ date_depart                       │ timestamp with time zone │ YES         │
│ employes_presence               │ date_naissance                    │ date                     │ YES         │
│ employes_presence               │ service                           │ text                     │ YES         │
│ employes_presence               │ poste                             │ text                     │ YES         │
│ employes_presence               │ avatar_url                        │ text                     │ YES         │
│ employes_presence               │ last_activity                     │ timestamp with time zone │ YES         │
│ employes_presence               │ created_at                        │ timestamp with time zone │ YES         │
│ employes_presence               │ updated_at                        │ timestamp with time zone │ YES         │
│ expenses                        │ id                                │ uuid                     │ NO          │
│ expenses                        │ property_id                       │ uuid                     │ YES         │
│ expenses                        │ category                          │ character varying        │ YES         │
│ expenses                        │ description                       │ text                     │ NO          │
│ expenses                        │ amount_fcfa                       │ numeric                  │ NO          │
│ expenses                        │ expense_date                      │ date                     │ YES         │
│ expenses                        │ receipt_number                    │ character varying        │ YES         │
│ expenses                        │ created_at                        │ timestamp with time zone │ YES         │
│ finances                        │ id                                │ uuid                     │ NO          │
│ finances                        │ type_transaction                  │ text                     │ NO          │
│ finances                        │ categorie                         │ text                     │ NO          │
│ finances                        │ montant                           │ numeric                  │ NO          │
│ finances                        │ date_transaction                  │ date                     │ NO          │
│ finances                        │ mode_paiement                     │ text                     │ NO          │
│ finances                        │ reference                         │ text                     │ YES         │
│ finances                        │ description                       │ text                     │ YES         │
│ finances                        │ client_id                         │ uuid                     │ YES         │
│ finances                        │ project_id                        │ uuid                     │ YES         │
│ finances                        │ created_at                        │ timestamp with time zone │ YES         │
│ finances                        │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_attestation_temoins     │ id                                │ uuid                     │ NO          │
│ foncier_attestation_temoins     │ attestation_id                    │ uuid                     │ YES         │
│ foncier_attestation_temoins     │ nom                               │ text                     │ NO          │
│ foncier_attestation_temoins     │ prenom                            │ text                     │ NO          │
│ foncier_attestation_temoins     │ profession                        │ text                     │ YES         │
│ foncier_attestation_temoins     │ telephone                         │ text                     │ YES         │
│ foncier_attestation_temoins     │ cni                               │ text                     │ YES         │
│ foncier_attestation_temoins     │ empreinte_url                     │ text                     │ YES         │
│ foncier_attestation_temoins     │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_attestations            │ id                                │ uuid                     │ NO          │
│ foncier_attestations            │ lot_id                            │ uuid                     │ YES         │
│ foncier_attestations            │ reference                         │ text                     │ NO          │
│ foncier_attestations            │ type                              │ text                     │ NO          │
│ foncier_attestations            │ statut                            │ text                     │ NO          │
│ foncier_attestations            │ date_etablissement                │ date                     │ YES         │
│ foncier_attestations            │ mode_acquisition                  │ text                     │ YES         │
│ foncier_attestations            │ historique_possession             │ text                     │ YES         │
│ foncier_attestations            │ domicile                          │ text                     │ YES         │
│ foncier_attestations            │ limites_nord                      │ text                     │ YES         │
│ foncier_attestations            │ limites_sud                       │ text                     │ YES         │
│ foncier_attestations            │ limites_est                       │ text                     │ YES         │
│ foncier_attestations            │ limites_ouest                     │ text                     │ YES         │
│ foncier_attestations            │ gps_lat                           │ numeric                  │ YES         │
│ foncier_attestations            │ gps_lng                           │ numeric                  │ YES         │
│ foncier_attestations            │ gps_precision                     │ numeric                  │ YES         │
│ foncier_attestations            │ registre_volume                   │ text                     │ YES         │
│ foncier_attestations            │ registre_page                     │ integer                  │ YES         │
│ foncier_attestations            │ registre_ligne                    │ integer                  │ YES         │
│ foncier_attestations            │ numero_enregistrement             │ text                     │ YES         │
│ foncier_attestations            │ qr_payload                        │ text                     │ YES         │
│ foncier_attestations            │ signature_numerique               │ text                     │ YES         │
│ foncier_attestations            │ control_number                    │ text                     │ YES         │
│ foncier_attestations            │ created_by                        │ uuid                     │ YES         │
│ foncier_attestations            │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_attestations            │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_attestations            │ client_updated_at                 │ timestamp with time zone │ YES         │
│ foncier_attestations            │ last_modified_device_id           │ text                     │ YES         │
│ foncier_attestations            │ hash_sha256                       │ text                     │ YES         │
│ foncier_attestations            │ revoked_at                        │ timestamp with time zone │ YES         │
│ foncier_attestations            │ revoke_reason                     │ text                     │ YES         │
│ foncier_attestations            │ revoked_by                        │ uuid                     │ YES         │
│ foncier_attestations            │ gps_points                        │ jsonb                    │ YES         │
│ foncier_attestations            │ version                           │ integer                  │ YES         │
│ foncier_attestations            │ date_expiration                   │ timestamp with time zone │ YES         │
│ foncier_attestations            │ proprietaire_photo_url            │ text                     │ YES         │
│ foncier_attestations            │ proprietaire_empreinte_url        │ text                     │ YES         │
│ foncier_attestations            │ chef_signature_manuscrite_requise │ boolean                  │ YES         │
│ foncier_attestations            │ chef_empreinte_url                │ text                     │ YES         │
│ foncier_attestations            │ temoin_empreinte_urls             │ jsonb                    │ YES         │
│ foncier_attestations            │ validation_agent_nom              │ text                     │ YES         │
│ foncier_attestations            │ validation_agent_id               │ uuid                     │ YES         │
│ foncier_attestations            │ validation_agent_date             │ timestamp with time zone │ YES         │
│ foncier_attestations            │ validation_chef_nom               │ text                     │ YES         │
│ foncier_attestations            │ validation_chef_id                │ uuid                     │ YES         │
│ foncier_attestations            │ validation_chef_date              │ timestamp with time zone │ YES         │
│ foncier_attestations            │ deleted_at                        │ timestamp with time zone │ YES         │
│ foncier_attestations            │ signature_nonce                   │ text                     │ YES         │
│ foncier_attestations            │ signature_issued_at               │ timestamp with time zone │ YES         │
│ foncier_attestations            │ cedant_nom                        │ text                     │ YES         │
│ foncier_attestations            │ cedant_prenom                     │ text                     │ YES         │
│ foncier_attestations            │ cedant_cni_numero                 │ text                     │ YES         │
│ foncier_attestations            │ cedant_telephone                  │ text                     │ YES         │
│ foncier_attestations            │ cedant_domicile                   │ text                     │ YES         │
│ foncier_attestations_temoins    │ id                                │ uuid                     │ NO          │
│ foncier_attestations_temoins    │ attestation_id                    │ uuid                     │ YES         │
│ foncier_attestations_temoins    │ nom                               │ text                     │ NO          │
│ foncier_attestations_temoins    │ prenom                            │ text                     │ NO          │
│ foncier_attestations_temoins    │ profession                        │ text                     │ YES         │
│ foncier_attestations_temoins    │ telephone                         │ text                     │ YES         │
│ foncier_attestations_temoins    │ cni                               │ text                     │ YES         │
│ foncier_attestations_temoins    │ empreinte_url                     │ text                     │ YES         │
│ foncier_attestations_temoins    │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_audit                   │ id                                │ uuid                     │ NO          │
│ foncier_audit                   │ parcelle_id                       │ uuid                     │ YES         │
│ foncier_audit                   │ action                            │ text                     │ NO          │
│ foncier_audit                   │ utilisateur_id                    │ uuid                     │ YES         │
│ foncier_audit                   │ utilisateur_nom                   │ text                     │ YES         │
│ foncier_audit                   │ date_action                       │ timestamp with time zone │ YES         │
│ foncier_audit                   │ details                           │ jsonb                    │ YES         │
│ foncier_audit                   │ signature_numerique               │ text                     │ YES         │
│ foncier_audit                   │ hash_blockchain                   │ text                     │ YES         │
│ foncier_audit                   │ hash_precedent                    │ text                     │ YES         │
│ foncier_audit                   │ lot_id                            │ uuid                     │ YES         │
│ foncier_audit                   │ old_values                        │ jsonb                    │ YES         │
│ foncier_audit                   │ new_values                        │ jsonb                    │ YES         │
│ foncier_audit                   │ changed_by                        │ uuid                     │ YES         │
│ foncier_audit                   │ changed_at                        │ timestamp with time zone │ YES         │
│ foncier_config                  │ id                                │ uuid                     │ NO          │
│ foncier_config                  │ key                               │ text                     │ NO          │
│ foncier_config                  │ value                             │ text                     │ YES         │
│ foncier_config                  │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_date_migration_errors   │ id                                │ uuid                     │ NO          │
│ foncier_date_migration_errors   │ lot_id                            │ uuid                     │ YES         │
│ foncier_date_migration_errors   │ field_name                        │ text                     │ YES         │
│ foncier_date_migration_errors   │ raw_value                         │ text                     │ YES         │
│ foncier_date_migration_errors   │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_ilots                   │ id                                │ uuid                     │ NO          │
│ foncier_ilots                   │ lotissement_id                    │ uuid                     │ NO          │
│ foncier_ilots                   │ numero_text                       │ text                     │ NO          │
│ foncier_ilots                   │ numero_int                        │ smallint                 │ YES         │
│ foncier_ilots                   │ code                              │ text                     │ NO          │
│ foncier_ilots                   │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_ilots                   │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_ilots                   │ deleted_at                        │ timestamp with time zone │ YES         │
│ foncier_lotissements            │ id                                │ uuid                     │ NO          │
│ foncier_lotissements            │ village                           │ text                     │ NO          │
│ foncier_lotissements            │ code                              │ text                     │ NO          │
│ foncier_lotissements            │ nom                               │ text                     │ NO          │
│ foncier_lotissements            │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_lotissements            │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_lotissements            │ deleted_at                        │ timestamp with time zone │ YES         │
│ foncier_lots                    │ id                                │ uuid                     │ NO          │
│ foncier_lots                    │ reference                         │ text                     │ NO          │
│ foncier_lots                    │ numero_lot                        │ text                     │ NO          │
│ foncier_lots                    │ numero_ilot                       │ text                     │ YES         │
│ foncier_lots                    │ nom_lotissement                   │ text                     │ NO          │
│ foncier_lots                    │ quartier                          │ text                     │ YES         │
│ foncier_lots                    │ village                           │ text                     │ NO          │
│ foncier_lots                    │ commune                           │ text                     │ YES         │
│ foncier_lots                    │ departement                       │ text                     │ YES         │
│ foncier_lots                    │ region                            │ text                     │ YES         │
│ foncier_lots                    │ superficie                        │ numeric                  │ YES         │
│ foncier_lots                    │ code_barre                        │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_nom                  │ text                     │ NO          │
│ foncier_lots                    │ proprietaire_prenom               │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_naissance_date       │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_naissance_lieu       │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_cni_numero           │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_cni_date             │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_cni_lieu             │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_profession           │ text                     │ YES         │
│ foncier_lots                    │ proprietaire_telephone            │ text                     │ YES         │
│ foncier_lots                    │ chef_village                      │ text                     │ YES         │
│ foncier_lots                    │ arrete_prefectoral                │ text                     │ YES         │
│ foncier_lots                    │ arrete_date                       │ text                     │ YES         │
│ foncier_lots                    │ statut                            │ text                     │ NO          │
│ foncier_lots                    │ date_cession                      │ date                     │ YES         │
│ foncier_lots                    │ prix_cession                      │ numeric                  │ YES         │
│ foncier_lots                    │ notes                             │ text                     │ YES         │
│ foncier_lots                    │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_lots                    │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_lots                    │ proprietaire_naissance_date_dt    │ date                     │ YES         │
│ foncier_lots                    │ proprietaire_cni_date_dt          │ date                     │ YES         │
│ foncier_lots                    │ arrete_date_dt                    │ date                     │ YES         │
│ foncier_lots                    │ deleted_at                        │ timestamp with time zone │ YES         │
│ foncier_lots                    │ deleted_by                        │ uuid                     │ YES         │
│ foncier_lots                    │ deleted_reason                    │ text                     │ YES         │
│ foncier_lots                    │ client_updated_at                 │ timestamp with time zone │ YES         │
│ foncier_lots                    │ last_modified_device_id           │ text                     │ YES         │
│ foncier_lots                    │ lotissement_id                    │ uuid                     │ YES         │
│ foncier_lots                    │ ilot_id                           │ uuid                     │ YES         │
│ foncier_lots                    │ row_version                       │ integer                  │ NO          │
│ foncier_lots                    │ retention_until                   │ timestamp with time zone │ YES         │
│ foncier_lots                    │ proprietaire_naissance_date_date  │ date                     │ YES         │
│ foncier_lots                    │ ilot                              │ character varying        │ YES         │
│ foncier_lots                    │ latitude                          │ numeric                  │ YES         │
│ foncier_lots                    │ longitude                         │ numeric                  │ YES         │
│ foncier_lots                    │ gps_precision                     │ numeric                  │ YES         │
│ foncier_village_config          │ id                                │ uuid                     │ NO          │
│ foncier_village_config          │ village                           │ text                     │ NO          │
│ foncier_village_config          │ key                               │ text                     │ NO          │
│ foncier_village_config          │ value                             │ text                     │ YES         │
│ foncier_village_config          │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_villages                │ name                              │ text                     │ NO          │
│ foncier_villages                │ code                              │ text                     │ NO          │
│ foncier_villages                │ region                            │ text                     │ YES         │
│ foncier_villages                │ departement                       │ text                     │ YES         │
│ foncier_villages                │ commune                           │ text                     │ YES         │
│ foncier_workflow_validations    │ id                                │ uuid                     │ NO          │
│ foncier_workflow_validations    │ attestation_id                    │ uuid                     │ YES         │
│ foncier_workflow_validations    │ lot_id                            │ uuid                     │ YES         │
│ foncier_workflow_validations    │ statut                            │ character varying        │ NO          │
│ foncier_workflow_validations    │ valide_par_village                │ boolean                  │ YES         │
│ foncier_workflow_validations    │ valide_village_par                │ uuid                     │ YES         │
│ foncier_workflow_validations    │ valide_village_date               │ timestamp with time zone │ YES         │
│ foncier_workflow_validations    │ valide_par_prefet                 │ boolean                  │ YES         │
│ foncier_workflow_validations    │ valide_prefet_par                 │ uuid                     │ YES         │
│ foncier_workflow_validations    │ valide_prefet_date                │ timestamp with time zone │ YES         │
│ foncier_workflow_validations    │ numero_arrete_prefectoral         │ character varying        │ YES         │
│ foncier_workflow_validations    │ date_arrete_prefectoral           │ date                     │ YES         │
│ foncier_workflow_validations    │ soumis_par                        │ uuid                     │ YES         │
│ foncier_workflow_validations    │ soumis_date                       │ timestamp with time zone │ YES         │
│ foncier_workflow_validations    │ expire_date                       │ date                     │ YES         │
│ foncier_workflow_validations    │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_workflow_validations    │ updated_at                        │ timestamp with time zone │ YES         │
│ foncier_workflow_view           │ id                                │ uuid                     │ YES         │
│ foncier_workflow_view           │ attestation_id                    │ uuid                     │ YES         │
│ foncier_workflow_view           │ lot_id                            │ uuid                     │ YES         │
│ foncier_workflow_view           │ lot_reference                     │ text                     │ YES         │
│ foncier_workflow_view           │ numero_lot                        │ text                     │ YES         │
│ foncier_workflow_view           │ village                           │ text                     │ YES         │
│ foncier_workflow_view           │ statut                            │ character varying        │ YES         │
│ foncier_workflow_view           │ valide_par_village                │ boolean                  │ YES         │
│ foncier_workflow_view           │ valide_village_date               │ timestamp with time zone │ YES         │
│ foncier_workflow_view           │ valide_par_prefet                 │ boolean                  │ YES         │
│ foncier_workflow_view           │ valide_prefet_date                │ timestamp with time zone │ YES         │
│ foncier_workflow_view           │ numero_arrete_prefectoral         │ character varying        │ YES         │
│ foncier_workflow_view           │ date_arrete_prefectoral           │ date                     │ YES         │
│ foncier_workflow_view           │ soumis_par                        │ uuid                     │ YES         │
│ foncier_workflow_view           │ soumis_date                       │ timestamp with time zone │ YES         │
│ foncier_workflow_view           │ created_at                        │ timestamp with time zone │ YES         │
│ foncier_workflow_view           │ updated_at                        │ timestamp with time zone │ YES         │
│ land_files                      │ id                                │ uuid                     │ NO          │
│ land_files                      │ client_id                         │ uuid                     │ YES         │
│ land_files                      │ reference                         │ text                     │ YES         │
│ land_files                      │ localisation                      │ text                     │ YES         │
│ land_files                      │ superficie                        │ numeric                  │ YES         │
│ land_files                      │ statut_administratif              │ text                     │ NO          │
│ land_files                      │ description                       │ text                     │ YES         │
│ land_files                      │ notes                             │ text                     │ YES         │
│ land_files                      │ created_at                        │ timestamp with time zone │ YES         │
│ land_files                      │ updated_at                        │ timestamp with time zone │ YES         │
│ lease_contracts                 │ id                                │ uuid                     │ NO          │
│ lease_contracts                 │ reference                         │ text                     │ NO          │
│ lease_contracts                 │ property_id                       │ uuid                     │ NO          │
│ lease_contracts                 │ tenant_id                         │ uuid                     │ NO          │
│ lease_contracts                 │ date_debut                        │ date                     │ NO          │
│ lease_contracts                 │ date_fin                          │ date                     │ YES         │
│ lease_contracts                 │ loyer_mensuel                     │ numeric                  │ NO          │
│ lease_contracts                 │ charges                           │ numeric                  │ NO          │
│ lease_contracts                 │ depot_garantie                    │ numeric                  │ NO          │
│ lease_contracts                 │ statut                            │ text                     │ NO          │
│ lease_contracts                 │ notes                             │ text                     │ YES         │
│ lease_contracts                 │ created_at                        │ timestamp with time zone │ YES         │
│ lease_contracts                 │ updated_at                        │ timestamp with time zone │ YES         │
│ media_files                     │ id                                │ uuid                     │ NO          │
│ media_files                     │ filename                          │ text                     │ NO          │
│ media_files                     │ original_name                     │ text                     │ NO          │
│ media_files                     │ url                               │ text                     │ NO          │
│ media_files                     │ category                          │ text                     │ NO          │
│ media_files                     │ uploaded_by                       │ uuid                     │ YES         │
│ media_files                     │ upload_date                       │ timestamp with time zone │ YES         │
│ media_files                     │ size                              │ bigint                   │ YES         │
│ media_files                     │ type                              │ text                     │ NO          │
│ media_files                     │ alt_text                          │ text                     │ YES         │
│ media_files                     │ tags                              │ ARRAY                    │ YES         │
│ media_files                     │ created_at                        │ timestamp with time zone │ YES         │
│ media_files                     │ updated_at                        │ timestamp with time zone │ YES         │
│ media_files                     │ description                       │ text                     │ YES         │
│ media_files                     │ is_brand_asset                    │ boolean                  │ YES         │
│ media_files                     │ brand_asset_type                  │ text                     │ YES         │
│ media_usage                     │ id                                │ uuid                     │ NO          │
│ media_usage                     │ media_id                          │ uuid                     │ NO          │
│ media_usage                     │ entity_type                       │ text                     │ NO          │
│ media_usage                     │ entity_id                         │ text                     │ YES         │
│ media_usage                     │ usage_type                        │ text                     │ NO          │
│ media_usage                     │ label                             │ text                     │ YES         │
│ media_usage                     │ created_at                        │ timestamp with time zone │ YES         │
│ media_versions                  │ id                                │ uuid                     │ NO          │
│ media_versions                  │ media_id                          │ uuid                     │ NO          │
│ media_versions                  │ version_number                    │ integer                  │ NO          │
│ media_versions                  │ old_url                           │ text                     │ NO          │
│ media_versions                  │ old_filename                      │ text                     │ NO          │
│ media_versions                  │ replaced_at                       │ timestamp with time zone │ YES         │
│ media_versions                  │ replaced_by                       │ uuid                     │ YES         │
│ messages_direction              │ id                                │ uuid                     │ NO          │
│ messages_direction              │ titre                             │ text                     │ NO          │
│ messages_direction              │ contenu                           │ text                     │ NO          │
│ messages_direction              │ type                              │ text                     │ NO          │
│ messages_direction              │ image_url                         │ text                     │ YES         │
│ messages_direction              │ date_publication                  │ timestamp with time zone │ YES         │
│ messages_direction              │ date_expiration                   │ timestamp with time zone │ YES         │
│ messages_direction              │ priorite                          │ text                     │ NO          │
│ messages_direction              │ cibles_tous_employes              │ boolean                  │ YES         │
│ messages_direction              │ cibles_services                   │ ARRAY                    │ YES         │
│ messages_direction              │ cibles_employes                   │ ARRAY                    │ YES         │
│ messages_direction              │ publie_par                        │ uuid                     │ YES         │
│ messages_direction              │ statut                            │ text                     │ NO          │
│ messages_direction              │ lu_par                            │ ARRAY                    │ YES         │
│ messages_direction              │ created_at                        │ timestamp with time zone │ YES         │
│ messages_direction              │ updated_at                        │ timestamp with time zone │ YES         │
│ orders                          │ id                                │ uuid                     │ NO          │
│ orders                          │ type_ordre                        │ text                     │ NO          │
│ orders                          │ client_id                         │ uuid                     │ YES         │
│ orders                          │ product_id                        │ uuid                     │ YES         │
│ orders                          │ quantite                          │ integer                  │ NO          │
│ orders                          │ prix_unitaire                     │ numeric                  │ YES         │
│ orders                          │ montant_total                     │ numeric                  │ YES         │
│ orders                          │ statut                            │ text                     │ NO          │
│ orders                          │ date_ordre                        │ date                     │ NO          │
│ orders                          │ notes                             │ text                     │ YES         │
│ orders                          │ created_at                        │ timestamp with time zone │ YES         │
│ page_layouts                    │ id                                │ uuid                     │ NO          │
│ page_layouts                    │ page_slug                         │ text                     │ NO          │
│ page_layouts                    │ layout_json                       │ jsonb                    │ NO          │
│ page_layouts                    │ is_published                      │ boolean                  │ NO          │
│ page_layouts                    │ published_at                      │ timestamp with time zone │ YES         │
│ page_layouts                    │ created_at                        │ timestamp with time zone │ NO          │
│ page_layouts                    │ updated_at                        │ timestamp with time zone │ NO          │
│ payments                        │ id                                │ uuid                     │ NO          │
│ payments                        │ tenant_id                         │ uuid                     │ YES         │
│ payments                        │ property_id                       │ uuid                     │ YES         │
│ payments                        │ amount_fcfa                       │ numeric                  │ NO          │
│ payments                        │ month                             │ date                     │ NO          │
│ payments                        │ payment_date                      │ date                     │ YES         │
│ payments                        │ payment_method                    │ character varying        │ YES         │
│ payments                        │ transaction_ref                   │ character varying        │ YES         │
│ payments                        │ status                            │ character varying        │ YES         │
│ payments                        │ notes                             │ text                     │ YES         │
│ payments                        │ created_at                        │ timestamp with time zone │ YES         │
│ products                        │ id                                │ uuid                     │ NO          │
│ products                        │ nom                               │ text                     │ NO          │
│ products                        │ categorie                         │ text                     │ NO          │
│ products                        │ prix_unitaire                     │ numeric                  │ YES         │
│ products                        │ stock_actuel                      │ integer                  │ YES         │
│ products                        │ stock_minimum                     │ integer                  │ YES         │
│ products                        │ unite                             │ text                     │ YES         │
│ products                        │ description                       │ text                     │ YES         │
│ products                        │ created_at                        │ timestamp with time zone │ YES         │
│ products                        │ updated_at                        │ timestamp with time zone │ YES         │
│ products                        │ image_url                         │ text                     │ YES         │
│ projects                        │ id                                │ uuid                     │ NO          │
│ projects                        │ nom                               │ text                     │ NO          │
│ projects                        │ client_id                         │ uuid                     │ YES         │
│ projects                        │ localisation                      │ text                     │ YES         │
│ projects                        │ type_projet                       │ text                     │ YES         │
│ projects                        │ budget                            │ numeric                  │ YES         │
│ projects                        │ date_debut                        │ date                     │ YES         │
│ projects                        │ date_fin                          │ date                     │ YES         │
│ projects                        │ statut                            │ text                     │ NO          │
│ projects                        │ description                       │ text                     │ YES         │
│ projects                        │ notes                             │ text                     │ YES         │
│ projects                        │ created_at                        │ timestamp with time zone │ YES         │
│ projects                        │ updated_at                        │ timestamp with time zone │ YES         │
│ projects                        │ cover_image_url                   │ text                     │ YES         │
│ properties                      │ id                                │ uuid                     │ NO          │
│ properties                      │ reference                         │ character varying        │ YES         │
│ properties                      │ address                           │ text                     │ YES         │
│ properties                      │ city                              │ character varying        │ YES         │
│ properties                      │ region                            │ character varying        │ YES         │
│ properties                      │ country                           │ character varying        │ YES         │
│ properties                      │ type                              │ character varying        │ YES         │
│ properties                      │ surface_m2                        │ numeric                  │ YES         │
│ properties                      │ rent_fcfa                         │ numeric                  │ YES         │
│ properties                      │ deposit_fcfa                      │ numeric                  │ YES         │
│ properties                      │ status                            │ character varying        │ YES         │
│ properties                      │ owner_name                        │ text                     │ YES         │
│ properties                      │ owner_phone                       │ character varying        │ YES         │
│ properties                      │ created_at                        │ timestamp with time zone │ YES         │
│ properties                      │ updated_at                        │ timestamp with time zone │ YES         │
│ properties                      │ cover_image_url                   │ text                     │ YES         │
│ properties                      │ adresse                           │ text                     │ YES         │
│ properties                      │ description                       │ text                     │ YES         │
│ properties                      │ proprietaire                      │ text                     │ YES         │
│ properties                      │ valeur                            │ numeric                  │ YES         │
│ properties                      │ loyer_mensuel                     │ numeric                  │ YES         │
│ properties                      │ statut                            │ text                     │ YES         │
│ properties                      │ type_bien                         │ text                     │ YES         │
│ rent_payments                   │ id                                │ uuid                     │ NO          │
│ rent_payments                   │ tenant_id                         │ uuid                     │ YES         │
│ rent_payments                   │ property_id                       │ uuid                     │ YES         │
│ rent_payments                   │ montant                           │ numeric                  │ NO          │
│ rent_payments                   │ date_paiement                     │ date                     │ NO          │
│ rent_payments                   │ mois_concerne                     │ text                     │ YES         │
│ rent_payments                   │ mode_paiement                     │ text                     │ NO          │
│ rent_payments                   │ statut                            │ text                     │ NO          │
│ rent_payments                   │ notes                             │ text                     │ YES         │
│ rent_payments                   │ created_at                        │ timestamp with time zone │ YES         │
│ rent_payments                   │ reference                         │ text                     │ YES         │
│ rent_payments                   │ contract_id                       │ uuid                     │ YES         │
│ rent_payments                   │ mois_concerne_date                │ date                     │ YES         │
│ rent_payments                   │ date_echeance                     │ date                     │ YES         │
│ rent_payments                   │ date_paiement_effectif            │ date                     │ YES         │
│ rent_payments                   │ last_document_type                │ text                     │ YES         │
│ rent_payments                   │ last_document_at                  │ timestamp with time zone │ YES         │
│ rent_payments                   │ last_document_by                  │ uuid                     │ YES         │
│ settings_audit                  │ id                                │ uuid                     │ NO          │
│ settings_audit                  │ setting_key                       │ text                     │ NO          │
│ settings_audit                  │ old_value                         │ text                     │ YES         │
│ settings_audit                  │ new_value                         │ text                     │ YES         │
│ settings_audit                  │ changed_by                        │ uuid                     │ YES         │
│ settings_audit                  │ changed_at                        │ timestamp with time zone │ YES         │
│ settings_audit                  │ ip_address                        │ inet                     │ YES         │
│ settings_audit                  │ user_agent                        │ text                     │ YES         │
│ site_content                    │ id                                │ uuid                     │ NO          │
│ site_content                    │ section                           │ text                     │ NO          │
│ site_content                    │ key                               │ text                     │ NO          │
│ site_content                    │ value                             │ text                     │ YES         │
│ site_content                    │ content_type                      │ text                     │ YES         │
│ site_content                    │ label                             │ text                     │ YES         │
│ site_content                    │ updated_at                        │ timestamp with time zone │ YES         │
│ site_realisations               │ id                                │ uuid                     │ NO          │
│ site_realisations               │ title                             │ text                     │ NO          │
│ site_realisations               │ description                       │ text                     │ YES         │
│ site_realisations               │ category                          │ text                     │ NO          │
│ site_realisations               │ image_url                         │ text                     │ YES         │
│ site_realisations               │ year                              │ integer                  │ YES         │
│ site_realisations               │ location                          │ text                     │ YES         │
│ site_realisations               │ featured                          │ boolean                  │ YES         │
│ site_realisations               │ sort_order                        │ integer                  │ YES         │
│ site_realisations               │ created_at                        │ timestamp with time zone │ YES         │
│ stats_journalieres              │ date                              │ date                     │ YES         │
│ stats_journalieres              │ total_visiteurs                   │ bigint                   │ YES         │
│ stats_journalieres              │ visiteurs_actuels                 │ bigint                   │ YES         │
│ stats_journalieres              │ badges_imprimes                   │ bigint                   │ YES         │
│ stats_journalieres              │ employes_presents                 │ bigint                   │ YES         │
│ stats_journalieres              │ activites_du_jour                 │ bigint                   │ YES         │
│ suppliers                       │ id                                │ uuid                     │ NO          │
│ suppliers                       │ nom                               │ text                     │ NO          │
│ suppliers                       │ telephone                         │ text                     │ YES         │
│ suppliers                       │ email                             │ text                     │ YES         │
│ suppliers                       │ adresse                           │ text                     │ YES         │
│ suppliers                       │ produits_fournis                  │ text                     │ YES         │
│ suppliers                       │ statut                            │ text                     │ NO          │
│ suppliers                       │ notes                             │ text                     │ YES         │
│ suppliers                       │ created_at                        │ timestamp with time zone │ YES         │
│ suppliers                       │ updated_at                        │ timestamp with time zone │ YES         │
│ task_comments                   │ id                                │ uuid                     │ NO          │
│ task_comments                   │ task_id                           │ uuid                     │ YES         │
│ task_comments                   │ author_id                         │ uuid                     │ YES         │
│ task_comments                   │ author_name                       │ text                     │ YES         │
│ task_comments                   │ content                           │ text                     │ NO          │
│ task_comments                   │ created_at                        │ timestamp with time zone │ YES         │
│ task_comments                   │ updated_at                        │ timestamp with time zone │ YES         │
│ task_history                    │ id                                │ uuid                     │ NO          │
│ task_history                    │ task_id                           │ uuid                     │ YES         │
│ task_history                    │ action                            │ text                     │ NO          │
│ task_history                    │ old_value                         │ jsonb                    │ YES         │
│ task_history                    │ new_value                         │ jsonb                    │ YES         │
│ task_history                    │ user_id                           │ uuid                     │ YES         │
│ task_history                    │ user_name                         │ text                     │ YES         │
│ task_history                    │ created_at                        │ timestamp with time zone │ YES         │
│ tasks                           │ id                                │ uuid                     │ NO          │
│ tasks                           │ titre                             │ text                     │ NO          │
│ tasks                           │ description                       │ text                     │ YES         │
│ tasks                           │ assignee_id                       │ uuid                     │ YES         │
│ tasks                           │ priorite                          │ text                     │ NO          │
│ tasks                           │ statut                            │ text                     │ NO          │
│ tasks                           │ date_echeance                     │ date                     │ YES         │
│ tasks                           │ project_id                        │ uuid                     │ YES         │
│ tasks                           │ created_at                        │ timestamp with time zone │ YES         │
│ tasks                           │ updated_at                        │ timestamp with time zone │ YES         │
│ tenants                         │ id                                │ uuid                     │ NO          │
│ tenants                         │ cin                               │ character varying        │ YES         │
│ tenants                         │ first_name                        │ text                     │ YES         │
│ tenants                         │ last_name                         │ text                     │ YES         │
│ tenants                         │ email                             │ character varying        │ YES         │
│ tenants                         │ phone                             │ character varying        │ YES         │
│ tenants                         │ occupation                        │ text                     │ YES         │
│ tenants                         │ emergency_contact                 │ text                     │ YES         │
│ tenants                         │ emergency_phone                   │ character varying        │ YES         │
│ tenants                         │ property_id                       │ uuid                     │ YES         │
│ tenants                         │ contract_start                    │ date                     │ YES         │
│ tenants                         │ contract_end                      │ date                     │ YES         │
│ tenants                         │ monthly_rent_fcfa                 │ numeric                  │ YES         │
│ tenants                         │ created_at                        │ timestamp with time zone │ YES         │
│ tenants                         │ nom                               │ text                     │ YES         │
│ tenants                         │ prenom                            │ text                     │ YES         │
│ tenants                         │ telephone                         │ text                     │ YES         │
│ tenants                         │ statut                            │ text                     │ YES         │
│ tenants                         │ date_debut_contrat                │ date                     │ YES         │
│ tenants                         │ date_fin_contrat                  │ date                     │ YES         │
│ tenants                         │ loyer                             │ numeric                  │ YES         │
│ tenants                         │ depot_garantie                    │ numeric                  │ YES         │
│ tenants                         │ updated_at                        │ timestamp with time zone │ YES         │
│ user_invites                    │ id                                │ uuid                     │ NO          │
│ user_invites                    │ email                             │ text                     │ NO          │
│ user_invites                    │ full_name                         │ text                     │ YES         │
│ user_invites                    │ access_level                      │ text                     │ NO          │
│ user_invites                    │ poste                             │ text                     │ YES         │
│ user_invites                    │ department                        │ text                     │ YES         │
│ user_invites                    │ phone                             │ text                     │ YES         │
│ user_invites                    │ created_by                        │ uuid                     │ YES         │
│ user_invites                    │ created_at                        │ timestamp with time zone │ YES         │
│ user_invites                    │ expires_at                        │ timestamp with time zone │ YES         │
│ user_invites                    │ used_at                           │ timestamp with time zone │ YES         │
│ user_invites                    │ used_by                           │ uuid                     │ YES         │
│ user_profiles                   │ id                                │ uuid                     │ NO          │
│ user_profiles                   │ full_name                         │ text                     │ NO          │
│ user_profiles                   │ role                              │ text                     │ NO          │
│ user_profiles                   │ access_level                      │ text                     │ NO          │
│ user_profiles                   │ poste                             │ text                     │ YES         │
│ user_profiles                   │ department                        │ text                     │ YES         │
│ user_profiles                   │ avatar_url                        │ text                     │ YES         │
│ user_profiles                   │ phone                             │ text                     │ YES         │
│ user_profiles                   │ created_at                        │ timestamp with time zone │ YES         │
│ user_profiles                   │ updated_at                        │ timestamp with time zone │ YES         │
│ user_profiles                   │ village_access                    │ text                     │ YES         │
│ user_profiles                   │ foncier_role                      │ character varying        │ YES         │
│ user_village_access             │ id                                │ uuid                     │ NO          │
│ user_village_access             │ user_id                           │ uuid                     │ NO          │
│ user_village_access             │ village                           │ text                     │ NO          │
│ user_village_access             │ created_at                        │ timestamp with time zone │ YES         │
│ v_foncier_attestations_expirees │ id                                │ uuid                     │ YES         │
│ v_foncier_attestations_expirees │ reference                         │ text                     │ YES         │
│ v_foncier_attestations_expirees │ lot_id                            │ uuid                     │ YES         │
│ v_foncier_attestations_expirees │ date_etablissement                │ date                     │ YES         │
│ v_foncier_attestations_expirees │ date_expiration                   │ timestamp with time zone │ YES         │
│ v_foncier_attestations_expirees │ statut                            │ text                     │ YES         │
│ v_foncier_attestations_expirees │ proprietaire_nom                  │ text                     │ YES         │
│ v_foncier_attestations_expirees │ proprietaire_prenom               │ text                     │ YES         │
│ v_settings_audit_detailed       │ id                                │ uuid                     │ YES         │
│ v_settings_audit_detailed       │ setting_key                       │ text                     │ YES         │
│ v_settings_audit_detailed       │ old_value                         │ text                     │ YES         │
│ v_settings_audit_detailed       │ new_value                         │ text                     │ YES         │
│ v_settings_audit_detailed       │ changed_at                        │ timestamp with time zone │ YES         │
│ v_settings_audit_detailed       │ ip_address                        │ inet                     │ YES         │
│ v_settings_audit_detailed       │ user_agent                        │ text                     │ YES         │
│ v_settings_audit_detailed       │ changed_by_name                   │ text                     │ YES         │
│ v_settings_audit_detailed       │ changed_by_email                  │ character varying        │ YES         │
│ v_settings_audit_detailed       │ changed_by_role                   │ text                     │ YES         │
│ visites                         │ id                                │ uuid                     │ NO          │
│ visites                         │ visiteur_id                       │ uuid                     │ YES         │
│ visites                         │ date_arrivee                      │ timestamp with time zone │ NO          │
│ visites                         │ date_depart                       │ timestamp with time zone │ YES         │
│ visites                         │ motif                             │ text                     │ NO          │
│ visites                         │ motif_autre                       │ text                     │ YES         │
│ visites                         │ personne_rencontree_id            │ uuid                     │ YES         │
│ visites                         │ personne_rencontree_nom           │ text                     │ YES         │
│ visites                         │ service                           │ text                     │ NO          │
│ visites                         │ badge_imprime                     │ boolean                  │ YES         │
│ visites                         │ badge_imprime_at                  │ timestamp with time zone │ YES         │
│ visites                         │ statut                            │ text                     │ NO          │
│ visites                         │ observations                      │ text                     │ YES         │
│ visites                         │ signature_numerique               │ text                     │ YES         │
│ visites                         │ qr_code                           │ text                     │ YES         │
│ visites                         │ type_visite                       │ text                     │ NO          │
│ visites                         │ created_at                        │ timestamp with time zone │ YES         │
│ visites                         │ updated_at                        │ timestamp with time zone │ YES         │
│ visites                         │ created_by                        │ uuid                     │ YES         │
│ visites_du_jour                 │ id                                │ uuid                     │ YES         │
│ visites_du_jour                 │ visiteur_id                       │ uuid                     │ YES         │
│ visites_du_jour                 │ date_arrivee                      │ timestamp with time zone │ YES         │
│ visites_du_jour                 │ date_depart                       │ timestamp with time zone │ YES         │
│ visites_du_jour                 │ motif                             │ text                     │ YES         │
│ visites_du_jour                 │ motif_autre                       │ text                     │ YES         │
│ visites_du_jour                 │ personne_rencontree_id            │ uuid                     │ YES         │
│ visites_du_jour                 │ personne_rencontree_nom           │ text                     │ YES         │
│ visites_du_jour                 │ service                           │ text                     │ YES         │
│ visites_du_jour                 │ badge_imprime                     │ boolean                  │ YES         │
│ visites_du_jour                 │ badge_imprime_at                  │ timestamp with time zone │ YES         │
│ visites_du_jour                 │ statut                            │ text                     │ YES         │
│ visites_du_jour                 │ observations                      │ text                     │ YES         │
│ visites_du_jour                 │ signature_numerique               │ text                     │ YES         │
│ visites_du_jour                 │ qr_code                           │ text                     │ YES         │
│ visites_du_jour                 │ type_visite                       │ text                     │ YES         │
│ visites_du_jour                 │ created_at                        │ timestamp with time zone │ YES         │
│ visites_du_jour                 │ updated_at                        │ timestamp with time zone │ YES         │
│ visites_du_jour                 │ created_by                        │ uuid                     │ YES         │
│ visites_du_jour                 │ visiteur_nom                      │ text                     │ YES         │
│ visites_du_jour                 │ visiteur_telephone                │ text                     │ YES         │
│ visites_du_jour                 │ visiteur_photo                    │ text                     │ YES         │
│ visites_du_jour                 │ personne_rencontree_full_name     │ text                     │ YES         │
│ visites_en_cours                │ id                                │ uuid                     │ YES         │
│ visites_en_cours                │ visiteur_id                       │ uuid                     │ YES         │
│ visites_en_cours                │ date_arrivee                      │ timestamp with time zone │ YES         │
│ visites_en_cours                │ date_depart                       │ timestamp with time zone │ YES         │
│ visites_en_cours                │ motif                             │ text                     │ YES         │
│ visites_en_cours                │ motif_autre                       │ text                     │ YES         │
│ visites_en_cours                │ personne_rencontree_id            │ uuid                     │ YES         │
│ visites_en_cours                │ personne_rencontree_nom           │ text                     │ YES         │
│ visites_en_cours                │ service                           │ text                     │ YES         │
│ visites_en_cours                │ badge_imprime                     │ boolean                  │ YES         │
│ visites_en_cours                │ badge_imprime_at                  │ timestamp with time zone │ YES         │
│ visites_en_cours                │ statut                            │ text                     │ YES         │
│ visites_en_cours                │ observations                      │ text                     │ YES         │
│ visites_en_cours                │ signature_numerique               │ text                     │ YES         │
│ visites_en_cours                │ qr_code                           │ text                     │ YES         │
│ visites_en_cours                │ type_visite                       │ text                     │ YES         │
│ visites_en_cours                │ created_at                        │ timestamp with time zone │ YES         │
│ visites_en_cours                │ updated_at                        │ timestamp with time zone │ YES         │
│ visites_en_cours                │ created_by                        │ uuid                     │ YES         │
│ visites_en_cours                │ visiteur_nom                      │ text                     │ YES         │
│ visites_en_cours                │ visiteur_telephone                │ text                     │ YES         │
│ visites_en_cours                │ visiteur_photo                    │ text                     │ YES         │
│ visiteurs                       │ id                                │ uuid                     │ NO          │
│ visiteurs                       │ nom_complet                       │ text                     │ NO          │
│ visiteurs                       │ type_piece                        │ text                     │ NO          │
│ visiteurs                       │ numero_piece                      │ text                     │ NO          │
│ visiteurs                       │ telephone                         │ text                     │ NO          │
│ visiteurs                       │ email                             │ text                     │ YES         │
│ visiteurs                       │ societe                           │ text                     │ YES         │
│ visiteurs                       │ photo_url                         │ text                     │ YES         │
│ visiteurs                       │ photo_base64                      │ text                     │ YES         │
│ visiteurs                       │ nb_visites                        │ integer                  │ YES         │
│ visiteurs                       │ derniere_visite                   │ timestamp with time zone │ YES         │
│ visiteurs                       │ created_at                        │ timestamp with time zone │ YES         │
│ visiteurs                       │ updated_at                        │ timestamp with time zone │ YES         │
│ visiteurs                       │ deleted_at                        │ timestamp with time zone │ YES         │
│ visiteurs                       │ created_by                        │ uuid                     │ YES         │
└─────────────────────────────────┴───────────────────────────────────┴──────────────────────────┴─────────────┘
