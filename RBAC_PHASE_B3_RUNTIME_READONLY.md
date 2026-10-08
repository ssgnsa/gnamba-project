# GNAMBA / EGS — Phase B.3
# Vérification runtime READ-ONLY

Date d'observation : 2026-09-24 (UTC)

## Portée et méthode

- Interrogation du catalogue PostgreSQL du conteneur `egs-postgres`, base `egs_local`, schéma `public`; les requêtes de catalogue principales ont été exécutées dans une transaction `READ ONLY`.
- Agrégats limités aux nombres de lignes/non-NULL/valeurs distinctes et aux comptes par rôle technique. Aucun nom, courriel, téléphone, IP, identifiant utilisateur ou valeur de département/service/affectataire n'est reproduit.
- Lecture HTTP du document OpenAPI du backend configuré localement. Aucun endpoint DELETE, restore ou autre endpoint métier n'a été appelé.
- Vérification sans modification : aucun DDL/DML, migration, code, configuration ou permission n'a été modifié. Les seules écritures sont les documents de rapport/décision autorisés.

Le runtime ciblé est celui indiqué par la configuration locale et les conteneurs actifs du workspace. Ce constat ne certifie pas une autre instance de production ni les règles de proxy/réseau en amont.

## 1. Les 38 tables du référentiel

Le schéma `public` contient **67 tables** (contre 38 noms dans la liste Phase B.1). Sur les 38 noms attendus, **37 existent physiquement**. `taches` est absent; `tasks` existe et constitue le seul nom physique correspondant. Ne pas compter `taches` comme une table DB distincte.

Les autres tables attendues sont présentes :

`activites_journal`, `app_settings`, `campagnes_marketing`, `contact_messages`, `documents`, `employes_presence`, `foncier_villages`, `lead_campaigns`, `lead_captures`, `lead_interactions`, `leads`, `lease_contracts`, `media_audit_logs`, `media_files`, `media_usage`, `media_versions`, `messages_direction`, `opportunites`, `page_layouts`, `parties`, `party_lead_details`, `party_roles`, `properties`, `rent_payments`, `site_content`, `site_realisations`, `social_posts`, `stats_journalieres`, `tasks`, `user_profiles`, `ventes_foncieres`, `visites`, `visites_du_jour`, `visites_en_cours`, `visites_terrain`, `visiteurs`, `vitrine_lots`.

Inventaire complet des **67 tables physiques `public`** (ordre alphabétique) :

`activites_journal`, `activity_logs`, `alembic_version`, `app_settings`, `app_settings_old`, `app_settings_test`, `auth_audit_logs`, `auth_login_failures`, `auth_sessions`, `campagnes_marketing`, `contact_messages`, `documents`, `employees`, `employes_presence`, `entities`, `finances`, `foncier_attestation_temoins`, `foncier_attestations`, `foncier_audit`, `foncier_audit_old`, `foncier_ilots`, `foncier_items`, `foncier_items_old`, `foncier_lotissements`, `foncier_lots`, `foncier_lots_old`, `foncier_villages`, `foncier_villages_old`, `immobilier_items`, `lead_campaigns`, `lead_captures`, `lead_interactions`, `leads`, `lease_contracts`, `media_audit_logs`, `media_files`, `media_taxonomy`, `media_usage`, `media_versions`, `messages_direction`, `opportunites`, `page_layouts`, `page_layouts_backup_20260827`, `page_layouts_canonical_20260827`, `parties`, `party_lead_details`, `party_roles`, `products`, `projects`, `properties`, `rent_payments`, `site_content`, `site_realisations`, `social_posts`, `stats_journalieres`, `suppliers`, `tasks`, `user_profiles`, `user_village_access`, `users`, `ventes_foncieres`, `visites`, `visites_du_jour`, `visites_en_cours`, `visites_terrain`, `visiteurs`, `vitrine_lots`.

## 2. Colonnes de cycle de vie réellement présentes

| Famille | Constat runtime |
|---|---|
| `deleted_at` | Présent sur `entities`, `foncier_attestations`, `foncier_lots`, `foncier_lots_old`, `lease_contracts`, `media_files`, `properties`, `rent_payments`. |
| `deleted_by` | Présent sur `entities`, `foncier_lots`, `lease_contracts`, `media_files`, `properties`, `rent_payments`. Le type est UUID sauf `media_files.deleted_by` (texte). |
| `archived_at` | Présent uniquement sur `foncier_lots_old` parmi les colonnes de cycle inspectées. |
| `archived_by`, `restored_at`, `restored_by` | Aucune colonne correspondante dans `public`. |

Point notable : aucune de ces colonnes `deleted_at`/`deleted_by` n'est présente sur `tasks`, `documents`, `employees` ou `finances`, bien que des chemins de migration/code les aient mentionnées dans les audits antérieurs. Il faut se fier à cet état runtime pour décrire la base courante; cela ne tranche pas la politique métier.

## 3. Tables d'audit et sécurité

Tables dont le nom contient `audit` ou `log` :

- `activity_logs`
- `auth_audit_logs`
- `auth_login_failures`
- `foncier_audit`
- `foncier_audit_old`
- `media_audit_logs`

`auth_sessions` existe aussi, mais son nom ne comporte ni `audit` ni `log`. Les tables `audit_logs` et `settings_audit` référencées dans les documents/migrations ne sont pas présentes dans le schéma runtime interrogé.

## 4. Contraintes déclarées dans PostgreSQL

Le catalogue retourne 89 contraintes : **61 clés primaires, 14 clés étrangères, 8 contraintes uniques et 6 CHECK**. Exemples métier vérifiés : statuts/types d'attestation et de lot; niveaux `user_village_access.access_level`; unicité (user, village); liens d'attestations/témoins, foncier (village → lotissement → îlot → lot), médias (usage/versions → fichiers), vitrine (lot/propriété) et utilisateur → entité.

Ces nombres couvrent les contraintes déclarées dans `public`; ils ne constituent pas un audit de cohérence des données ni de l'intégrité applicative.

## 5. Données existantes — agrégats anonymisés

| Champ / table | Agrégat runtime |
|---|---|
| `users.role` | 4 utilisateurs : 1 `admin`, 1 `gestionnaire`, 2 `employe`; aucune ligne `guest`. Valeurs agrégées sans identifiants. |
| `users.department` | 4 lignes; 3 renseignées; 3 valeurs distinctes. Les valeurs ne sont pas divulguées. |
| `employees.department` | 2 lignes; 0 renseignée. |
| `user_profiles.department` | 0 ligne. |
| Colonne `service` | Aucune colonne `service` dans les tables de `public` inspectées. |
| `leads.assigned_to` | Table `leads` vide (0 ligne); aucun affectataire ne peut être établi à partir des données actuelles. |
| `party_lead_details.role` | Table vide (0 ligne); aucune valeur de rôle associée à ces détails. |

Les valeurs techniques de rôle observées ne changent ni ne complètent les décisions métier. Les agrégats vides ne prouvent pas qu'une règle métier n'existe pas.

## 6. Tables legacy / artefacts présents et absents

Tables présentes dont le nom indique une copie/ancienne version :

- `app_settings_old`, `app_settings_test`
- `foncier_audit_old`, `foncier_items_old`, `foncier_lots_old`, `foncier_villages_old`
- `page_layouts_backup_20260827`, `page_layouts_canonical_20260827`

Autres tables physiques hors liste des 38, pertinentes pour les écarts entre code et DB : `employees`, `entities`, `finances`, `products`, `projects`, `suppliers`, `foncier_attestations`, `foncier_attestation_temoins`, `foncier_ilots`, `foncier_lotissements`, `foncier_items`, `immobilier_items`, `media_taxonomy`, `users`, `user_village_access`.

Noms évoqués comme legacy/alias mais absents physiquement : `taches`, `audit_logs`, `settings_audit`, `tenants`. `tasks` est la table présente à la place du nom `taches`; aucune équivalence DB n'est établie pour `tenants`.

## 7. Routes DELETE et restore annoncées par OpenAPI runtime

OpenAPI annonce **27 opérations DELETE** et **6 opérations POST de restauration**. Cette lecture confirme les routes enregistrées dans le backend qui répond; elle ne teste pas l'acceptation d'une requête, l'authentification, la permission runtime ni un proxy externe.

### DELETE

- Clients : `/api/v1/clients/{client_id}`
- Employés : `/api/v1/employees/{employee_id}`
- Entités : `/api/v1/entities/{entity_id}`
- Finance : `/api/v1/finance/{finance_id}`
- Foncier : `/api/v1/foncier/access/{user_id}/villages/{village_id}`, `/api/v1/foncier/ilots/{ilot_id}`, `/api/v1/foncier/lotissements/{lotissement_id}`, `/api/v1/foncier/villages/{village_id}`
- Immobilier : `/api/v1/immobilier/contracts/{contract_id}`, `/api/v1/immobilier/payments/{payment_id}`, `/api/v1/immobilier/properties/{property_id}`
- Leads/campagnes : `/api/v1/leads/campaigns/{campaign_id}`, `/api/v1/leads/{lead_id}`
- Médias : `/api/v1/media/usage/{usage_id}`, `/api/v1/media/{media_id}`, `/api/v1/media/{media_id}/purge`
- Produits, projets, paramètres, contenu : `/api/v1/products/{product_id}`, `/api/v1/projects/{project_id}`, `/api/v1/settings/{key}`, `/api/v1/site-content/{content_id}`
- Site vitrine : `/api/v1/site/realisations/{item_id}`, `/api/v1/site/vitrine-lots/{item_id}`
- Fournisseurs, tables génériques, tâches, locataires, utilisateurs : `/api/v1/suppliers/{supplier_id}`, `/api/v1/tables/{table}/{row_id}`, `/api/v1/tasks/{task_id}`, `/api/v1/tenants/{tenant_id}`, `/api/v1/users/{user_id}`

### POST de restauration

- `/api/v1/entities/{entity_id}/restore`
- `/api/v1/foncier/lots/{lot_id}/restore`
- `/api/v1/immobilier/contracts/{contract_id}/restore`
- `/api/v1/immobilier/payments/{payment_id}/restore`
- `/api/v1/immobilier/properties/{property_id}/restore`
- `/api/v1/media/{media_id}/restore`

Le routeur OpenAPI annonce `/api/v1/tenants/{tenant_id}` alors que la table `tenants` n'existe pas dans PostgreSQL; route déclarée ne signifie pas stockage opérationnel vérifié.

## 8. Contraintes de conclusion

- Résultats limités à l'instance locale configurée et répondant le 2026-09-24; toute autre base doit être inspectée séparément.
- La présence d'une colonne ou route n'établit pas l'autorisation métier.
- OpenAPI confirme l'enregistrement des routes, pas leurs permissions effectives ni les règles d'un reverse proxy.
- Aucune ligne personnelle brute n'a été rapportée; les faibles effectifs agrégés restent volontairement limités aux rôles techniques.

**Phase B.3 READ-ONLY : vérification runtime terminée; aucune donnée ou structure n'a été modifiée.**
