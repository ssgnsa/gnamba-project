# GNAMBA / EGS — RBAC Phase B.4.2
# Vérification technique des périmètres métier — READ-ONLY STRICT

## 1. CONTEXTE

Analyse effectuée dans /home/soma/gnamba-project, branche audit/fix-schema-site, sur l'état du code et de la base visibles pendant cette phase. L'arbre de travail était déjà non propre avant l'analyse; cette phase ne l'a pas nettoyé.

Aucun fichier B.4.1 séparé n'a été trouvé parmi les documents RBAC disponibles. Les décisions métier citées en section 2 proviennent donc du brief B.4.2 fourni pour cette phase; elles ne sont pas inférées depuis le code. Le rapport B.4.3 n'est pas créé.

## 2. RÈGLES B.4.1 UTILISÉES

| Domaine | Décision métier fournie |
|---|---|
| Tasks / Agent | OUI — l'Agent ne voit que les tâches qui lui sont assignées. |
| Tasks / Gestionnaire | UNKNOWN — tâches des Agents supervisés. |
| Leads / Agent commercial | OUI — seulement les leads affectés à cet Agent. |
| Leads / Gestionnaire commercial | UNKNOWN — leads de son périmètre. |
| Foncier / village | OUI — accès limité au village; UserVillageAccess est l'ACL officielle. |
| Documents | OUI — suit le dossier/projet parent; création/uploader ne confère pas le scope. |
| Media | OUI — suit le dossier/projet parent; uploaded_by est une donnée de traçabilité. |
| User profile / propre profil | OUI — un utilisateur standard consulte/modifie son propre profil; admin peut dépasser cette limite. |
| Gestionnaire / profils de son équipe | UNKNOWN. |

Aucune décision UNKNOWN ci-dessus n'est transformée en permission ou en règle de remplacement.

## 3. MÉTHODE READ-ONLY

- Avant l'analyse : rtk git status --short, rtk git branch --show-current, rtk git diff --stat, rtk git diff --name-only.
- Recherche et lecture ciblées du code sous backend/ et src/ avec rtk rg, rtk nl et rtk sed; inspection AST en mémoire des routes du routeur Foncier pour ne pas en omettre.
- Vérification de catalogue et agrégats PostgreSQL par SELECT seulement, dans BEGIN TRANSACTION READ ONLY / COMMIT, via le conteneur egs-postgres. Seuls des comptes agrégés ont été consultés; aucune valeur personnelle ou identifiant n'a été affiché.
- Aucune route métier n'a été appelée. Aucun test, serveur, migration, script applicatif ou commande de modification n'a été lancé.

## 4. TASKS

Décision Agent = OUI. Résultat technique = GAP.

- Modèle SQLAlchemy : Task.employee_id est nullable et déclare une FK employees.id; Task.employee est une relation ORM (backend/app/models/hr.py:79-104).
- Le modèle Employee déclare entity_id vers entities.id (hr.py:27-50), tandis que User déclare aussi un entity_id vers entities.id (user.py:26-44). Ce chemin est seulement théorique pour le schéma courant.
- Runtime B.3/B.4.2 : tasks.employee_id et employees.id sont du texte, sans FK tasks.employee_id → employees.id; employees runtime n'a pas de colonne entity_id. users.id est texte. Donc le chemin JWT sub → User → Employee → Task.employee_id n'est pas résoluble de façon structurelle dans la base actuellement inspectée.
- Agrégats runtime anonymisés : 0 tâche, 2 lignes employees; aucune donnée d'affectation de tâche ne permet de vérifier la couverture présente. employee_id est nullable dans le modèle et le schéma.
- GET /api/v1/tasks accepte employee_id comme filtre facultatif fourni par l'appelant; le handler ne lie pas ce filtre à current_user. Le détail par ID, création, PATCH et DELETE n'ont pas de dépendance d'authentification ni de filtre de ligne (backend/app/api/v1/tasks/router.py:48-191). L'affectation peut être choisie/modifiée dans le payload.
- La voie générique /api/v1/tables/tasks applique une permission de table pour lire, mais le gestionnaire autorisé lit les lignes sans scope Agent/Gestionnaire; les filtres de requête sont des paramètres fournis par le client (tables/router.py:683-732). La permission de table n'est pas un filtre de ligne.

Conclusion obligatoire : Agent / Tasks = GAP.  
Gestionnaire / Tasks = UNKNOWN métier; techniquement, la relation de supervision est un GAP (voir section 10).

## 5. LEADS

Décision Agent = OUI. Résultat technique = GAP.

Trois représentations distinctes sont présentes :

1. Le modèle ORM historique Lead a assigne_a, nullable et FK vers users.id (backend/app/models/leads.py:19-78).
2. Le routeur courant /api/v1/leads traite les leads comme des Entity; assigned_to est placé dans entity_metadata JSON, pas dans le FK assigne_a (backend/app/api/v1/leads/router.py:19-105,170-218).
3. Le schéma runtime a leads.assigned_to texte, sans FK, mais la table leads est vide. La table entities ne contient actuellement aucune ligne de type lead. Aucun fait de données ne confirme que la chaîne assigned_to correspond à un users.id.

Le GET de leads est require_admin_user, pas accessible aux Agents par cette route (leads/router.py:235-263). Le filtre optionnel assigned_to reçoit une chaîne de requête; il n'est pas lié à l'identité authentifiée. Le branchement filtre des objets LeadResponse via entity_metadata, alors que LeadResponse ne déclare pas ce champ : ce filtre n'est pas une preuve fonctionnelle de scope. Création/mise à jour sont également admin-only et acceptent une valeur assigned_to libre dans metadata.

Aucune relation Agent commercial → Gestionnaire commercial n'a été trouvée. La policy centrale est par rôle/action seulement (backend/app/core/authorization.py:58-80).

Conclusion : Agent / Leads = GAP.  
Gestionnaire / Leads = UNKNOWN métier; aucune relation technique de supervision n'est démontrée.

## 6. FONCIER / UserVillageAccess

### Relation ACL

- UserVillageAccess existe avec user_id UUID, village_id UUID, niveaux contrôlés lecteur, agent, validateur, gestionnaire; unicité par couple et FK vers le village (backend/app/models/foncier.py:335-352; repository foncier.py:622-644).
- Le modèle ne déclare pas de FK user_id → users.id. Le runtime confirme seulement une FK vers foncier_villages, une unicité (user_id, village_id) et le CHECK du niveau. Runtime : 0 ligne ACL pour 34 villages.
- Le runtime a users.id de type caractère et user_village_access.user_id de type UUID. get_current_user résout l'identité JWT via sub → User (application/user_service.py:62-70); get_user_id retourne cet ID sous forme str (foncier/router.py:38-43). Aucun FK ne garantit que l'ID courant et une affectation ACL représentent la même identité.
- Avec 0 affectation, get_my_villages retourne une liste vide. Les routes grant/revoke exigent déjà un accès gestionnaire au village cible; aucun parcours de bootstrap initial n'est démontré par ces handlers (inférence code + agrégat runtime).

### Toutes les routes du routeur Foncier observées

UVA = contrôle UserVillageAccess du principal appelant, pas seulement présence d'un village_id dans l'URL. Un ID village/lot fourni par le client ne prouve pas que l'utilisateur a accès à ce village. 59 routes du routeur sont listées :

| Route | Auth locale | UserVillageAccess vérifié ? | Filtre effectif lié à l'utilisateur | Niveau vérifié ? | Conclusion |
|---|---|---|---|---|---|
| **POST /api/v1/foncier/villages** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages/with-stats** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages/{village_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages/{village_id}/with-stats** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **PATCH /api/v1/foncier/villages/{village_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **DELETE /api/v1/foncier/villages/{village_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/villages/{village_id}/lotissements** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages/{village_id}/lotissements** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lotissements/{lotissement_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **PATCH /api/v1/foncier/lotissements/{lotissement_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **DELETE /api/v1/foncier/lotissements/{lotissement_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lotissements/{lotissement_id}/ilots** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lotissements/{lotissement_id}/ilots** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/ilots/{ilot_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **PATCH /api/v1/foncier/ilots/{ilot_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **DELETE /api/v1/foncier/ilots/{ilot_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/ilots/{ilot_id}/lots** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/ilots/{ilot_id}/lots** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lots** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lots/{lot_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **PATCH /api/v1/foncier/lots/{lot_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lots/{lot_id}/archive** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lots/{lot_id}/restore** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lots/check-duplicate** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lots/exists** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/ilots/{ilot_id}/lots/import** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lots/export** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/lots/{lot_id}/attestations** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/lots/{lot_id}/attestations** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/attestations** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/attestations/{attestation_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **PATCH /api/v1/foncier/attestations/{attestation_id}** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/submit** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/validate** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/scan** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/revoke** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/generate-pdf** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/attestations/{attestation_id}/pdf** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/attestations/verify/{reference}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/audit/timeline/{entity_type}/{entity_id}** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/audit** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/audit/export-pdf** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/audit/export-csv** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/access/{user_id}/villages/{village_id}** | Oui — JWT via get_user_id | Oui — gate UVA gestionnaire | current_user + village | gestionnaire | Garde la gestion de l'ACL, pas l'accès aux données du village. |
| **DELETE /api/v1/foncier/access/{user_id}/villages/{village_id}** | Oui — JWT via get_user_id | Oui — gate UVA gestionnaire | current_user + village | gestionnaire | Garde la gestion de l'ACL, pas l'accès aux données du village. |
| **GET /api/v1/foncier/access/me/villages** | Oui — JWT via get_user_id | Consultation de sa propre ACL | current_user id | — | Filtre exact sur l'ID utilisateur; ne filtre pas les autres données Foncier. |
| **GET /api/v1/foncier/villages/{village_id}/users** | Oui — JWT via get_user_id | Oui — gate UVA validateur | current_user + village | validateur | Garde la liste des affectations au village. |
| **GET /api/v1/foncier/sync/status** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/sync/trigger** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/sync/queue** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/sync/queue/{queue_item_id}/resolve** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/sync/cleanup** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/dashboard/stats** | Oui — JWT via get_user_id | Conditionnel | village_id si fourni; branche globale sinon | lecteur si village_id fourni | Sans village_id, renvoie les statistiques globales à tout utilisateur authentifié. |
| **GET /api/v1/foncier/lotissements** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/ilots** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/assembly** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **GET /api/v1/foncier/villages/names** | Non — aucune dépendance locale | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |
| **POST /api/v1/foncier/attestations/{attestation_id}/sign** | Oui — JWT via get_user_id | Non | ID/paramètre de ressource seulement; aucun lien avec l'ACL courante | — | GAP de scope village |

Les routes qui vérifient les niveaux dans ce tableau gèrent l'ACL elle-même (gestionnaire, validateur) ou les stats avec village explicite (lecteur). /access/me/villages lit sa propre ACL. Aucune de ces exceptions ne couvre toutes les lectures/écritures métier. Pour /dashboard/stats, la branche sans village_id calcule les statistiques globales et n'exige aucun niveau village. /lots/export, /audit/export-pdf et /audit/export-csv répondent actuellement 501; aucun n'a de contrôle UserVillageAccess local. La classification ci-dessus constate la garde technique, sans décider si une route doit être publique (DECISION-009).

### Autres voies Foncier

- Le routeur générique /api/v1/tables/{table} lit les lignes après une permission table/module; il n'appelle jamais UserVillageAccess ni ne lie son filtre à l'utilisateur. Les tables de cette voie touchant le périmètre Foncier incluent foncier_villages, parties, party_roles, party_lead_details, ventes_foncieres, visites_terrain et stats_journalieres. foncier_villages, parties, party_roles, party_lead_details, ventes_foncieres sont dans l'allowlist lecture Gestionnaire et sont renvoyées sans scope de ligne; les autres restent soumises à la permission table mais sans UVA. Les lots/attestations empruntent les routes dédiées/RPC plutôt que cette registry. tables/router.py:363-425,595-618,683-732; authorization.py:13-52,58-80.
- /api/v1/rpc/{name} accepte un utilisateur optionnel. Les actions Foncier relevées — check_foncier_duplicate, search_foncier_lots, foncier_stats_by_village, soft_delete_foncier_lot, restore_foncier_lot, ensure_foncier_hierarchy, log_foncier_audit, create_foncier_attestation_atomic, attach_foncier_attestation_pdf_metadata, get_next_attestation_version — n'appellent pas UserVillageAccess. Les filtres village du payload sont contrôlés par l'appelant, pas vérifiés contre l'ACL (rpc/router.py:111-503).
- Les GET villages/lots/attestations/audit/PDF/verify et les routes de lecture hiérarchique listées ci-dessus n'ont aucune dépendance get_user_id; nombre de mutations ont seulement l'authentification JWT, sans ACL.
- Le code de montage principal n'ajoute pas de dépendance globale d'authentification aux routeurs (backend/app/main.py:38-92).

Conclusions : UserVillageAccess existe = YES.  
Utilisé par toutes les routes nécessaires = NO.  
Filtrage village backend réellement appliqué = PARTIAL (contrôles ponctuels; pas sur la couverture métier complète).  
Foncier / périmètre village = PARTIAL — la primitive ACL existe, mais couverture insuffisante et aucune attribution runtime n'est présente. Gaps de couverture constatés; aucune correction proposée ou faite.

## 7. DOCUMENTS

Décision parent projet = OUI. Résultat = GAP.

- Pas de route métier dédiée Documents repérée : CRUD via /api/v1/tables/documents.
- Le registre générique expose documents.project_id comme texte; le handler lit toute la table puis applique des filtres de query param côté serveur sans comparer au principal authentifié (backend/app/api/v1/tables/router.py:92-106,683-732).
- Runtime : documents.project_id est nullable, aucune FK vers projects.id, aucune colonne de propriétaire/uploader; contraintes runtime limitées à la PK. projects.id existe, mais Project/API n'a pas de lien fiable vers l'Agent ou le Gestionnaire. Les routes Project GET/POST/PATCH/DELETE n'ont aucune dépendance d'authentification ni propriétaire/périmètre (projects/router.py:15-90).
- Base actuelle : 0 document et 0 projet. Les orphelins en données ne sont donc pas observables; le schéma permet néanmoins un document sans parent.
- Les permissions de table en vigueur peuvent laisser un Gestionnaire lire les documents, mais cette permission est globale à la table, pas héritée d'un dossier/projet.

Le créateur/uploader n'est pas une colonne du schéma runtime Documents; aucun critère de scope parent effectif ne protège actuellement ce domaine.

## 8. MEDIA

Décision parent projet = OUI. Résultat = GAP.

- MediaFile possède uploaded_by, sans project_id/parent canonique. MediaUsage offre un couple entity_type/entity_id générique; entity_id est nullable et n'a pas de FK vers les objets métier (backend/app/models/media.py:19-58,81-99).
- Runtime anonymisé : 34 médias; 25 n'ont aucune ligne media_usage. Sur 36 usages, 14 ont un entity_id, 22 n'en ont pas. Ces liens ne désignent pas obligatoirement un projet/dossier et ne sont pas un parent canonique.
- Les routes privées (GET /media, /media/{media_id}, usage, versions, update, replace, delete, restore, purge) vérifient une permission de module/action mais ne vérifient pas l'accès au parent. L'upload écrit l'utilisateur dans uploaded_by, uniquement comme traçabilité (media/router.py:134-313).
- GET /api/v1/media/brand-assets est sans dépendance d'authentification et renvoie les médias marqués brand assets.
- /storage est monté directement sur StaticFiles dans main.py:44-47; la livraison du fichier n'appelle pas une ACL de parent.
- Le CRUD générique /api/v1/tables/media_files applique permission de table, sans scope de ligne.

Conclusion : Media / scope parent = GAP. uploaded_by n'est ni un parent ni le critère autorisé par la décision B.4.1.

## 9. USER PROFILES

Utilisateur standard / propre profil = GAP. Gestionnaire / profils équipe = UNKNOWN.

- Modèle SQLAlchemy : UserProfile.user_id déclare unique + FK vers users.id; une route dédiée d'accès-profil n'est pas présente (backend/app/models/settings.py:43-68; /api/v1/users admin-only gère les comptes, pas user_profiles).
- Runtime : user_profiles est vide; user_id est texte, sans FK/UNIQUE dans les contraintes constatées en B.3. La relation déclarée dans le modèle n'est donc pas établie dans la base courante.
- L'accès aux profils passe par le CRUD générique /api/v1/tables/user_profiles. Il ne restreint pas les lignes à l'utilisateur courant. La policy courante refuse la lecture privée aux rôles autres qu'admin/Gestionnaire allowlist; user_profiles n'est pas dans l'allowlist Gestionnaire. Admin peut accéder aux lignes de la table, sans limite à son propre profil (tables/router.py:569-590,683-732,761-787; authorization.py:13-52,58-80).
- /api/v1/auth/me résout et retourne le compte User courant; il ne constitue pas une lecture ou modification de la table UserProfile.
- Pas de table/membership d'équipe ou de relation Gestionnaire→membres. Department/poste/role/access_level ne démontrent pas cette relation.

Conclusion : User profile / Own profile = GAP; le dépassement Admin est compatible avec la décision mais ne fournit pas l'accès propre profil au standard.  
Gestionnaire / profiles équipe = UNKNOWN métier.

## 10. RELATION AGENT → GESTIONNAIRE

Résultat technique : GAP.

Aucun manager_id, supervisor_id, reports_to, membership d'équipe ou FK équivalente n'a été repéré dans modèles, services, routes ou schéma runtime. Les champs department/poste sont descriptifs; Employee.service existe dans le modèle consulté mais pas dans la table runtime employees. Ils ne définissent ni hiérarchie, ni ensemble fiable d'Agents gérés. UserVillageAccess est une ACL géographique sans relation hiérarchique.

Donc, les périmètres Gestionnaire → Agents des décisions Tasks/Leads ne sont pas techniquement résolubles. Cette constatation n'autorise pas à assimiler un Gestionnaire à tous les Agents.

## 11. MATRICE DE SYNTHÈSE

| Domaine | Décision métier | Relation technique | Résolution current_user | Protection backend | Couverture | Statut |
|---|---|---|---|---|---|---|
| Tasks / Agent | OUI | Modèle Task→Employee, mais FK absente en runtime; liaison User→Employee absente de la table runtime | Non démontrée; tâches vides | Route dédiée sans dépendance auth ni filtre identitaire; générique sans scope de ligne | Non démontrée | GAP |
| Tasks / Gestionnaire | UNKNOWN | Aucune relation superviseur | Non applicable sans décision | Route dédiée non limitée; règle métier non décidée | — | UNKNOWN |
| Leads / Agent | OUI | assigne_a FK du modèle inutilisé par route actuelle; assigned_to metadata/texte sans FK | Pas de résolution fiable; aucun lead runtime | Route actuelle admin-only; filtre facultatif non lié au principal | Leads/Entities lead runtime vides | GAP |
| Leads / Gestionnaire | UNKNOWN | Aucune relation superviseur commercial | Non applicable sans décision | Route lead admin-only | — | UNKNOWN |
| Foncier / Village | OUI | ACL UserVillageAccess reliée au village; user_id non FK vers users | ID JWT résolu mais User.id texte vs ACL UUID; aucune ACL runtime | Contrôle ACL ponctuel, pas systématique | ACL 0 lignes; beaucoup de routes sans check | PARTIAL |
| Documents / Parent | OUI | project_id nullable texte; sans FK ni owner sur projet | Pas d'identité de parent exploitable | Permission table sans héritage du parent | 0 document/projet; schéma autorise parent absent | GAP |
| Media / Parent | OUI | Aucun parent MediaFile; usages génériques, facultatifs et entity_id nullable | Pas de scope parent | Permission module + StaticFiles; aucun guard parent | 25/34 médias sans usage | GAP |
| User profile / Own | OUI | Modèle déclare FK+unique; runtime vide et sans ces contraintes | current_user connu, mais aucune comparaison user_id par route | Admin-only/table-level; pas de self-filter | 0 profils | GAP |
| Gestionnaire / Profiles équipe | UNKNOWN | Pas de modèle d'équipe ni superviseur | Non démontrée | Gestionnaire refusé par l'allowlist des profils | 0 profils | UNKNOWN |

## 12. GAPS TECHNIQUES

Gaps critiques : 7 classes distinctes.

1. Tasks / Agent — liaison JWT User→Employee et FK Task→Employee manquantes/non garanties dans la DB runtime; route dédiée ne lie pas employee_id au principal.
2. Agent→Gestionnaire — relation de supervision/membership inexistante dans code et schéma.
3. Leads / Agent — trois représentations d'affectation incompatibles (assigne_a, metadata assigned_to, colonne runtime texte); aucune association authentifiée ou protection Agent.
4. Foncier — UserVillageAccess n'est appliqué qu'à quelques endpoints; nombreux accès dédiés, routes génériques et RPC omettent le contrôle, certains sont non authentifiés localement.
5. Documents — parent nullable sans FK; projet sans scope Agent/Gestionnaire; lecture générique ne suit pas le parent.
6. Media — pas de parent canonique; 25 médias runtime sans usage; endpoints et stockage statique ne vérifient pas le scope parent.
7. User profiles — contraintes runtime et route self-service absentes; endpoint générique ne filtre pas sur l'utilisateur courant.

Aucun de ces gaps n'a été corrigé.

## 13. UNKNOWN MÉTIER RESTANTS

3 périmètres restent UNKNOWN dans le périmètre de cette vérification :

1. Tasks : Gestionnaire → tâches des Agents supervisés.
2. Leads : Gestionnaire commercial → leads de son périmètre.
3. User profiles : Gestionnaire → profils de son équipe.

L'absence technique de relation de supervision est un fait de code/schéma, pas une décision de refuser ces accès.

## 14. ÉLÉMENTS IMPLEMENTABLES

- L'authentification sait retrouver le principal courant par le sub du token puis le compte User (application/user_service.py:62-70).
- La primitive UserVillageAccess a un contrôle de couple user/village et une comparaison de niveaux (repositories/foncier.py:622-637). Elle est effectivement appelée pour administrer les accès, lister les utilisateurs autorisés et lire les statistiques d'un village explicitement demandé.
- Certaines requêtes ont des liens ou filtres de ressource (Task→Employee dans le modèle; Documents→project_id; MediaUsage→entity_id), mais aucun ne constitue le scope métier end-to-end validé sur la base et les routes courantes.
- Aucun des périmètres de ligne validés n'est actuellement démontré comme protégé de façon complète (IMPLEMENTABLE end-to-end).

## 15. ÉLÉMENTS NON IMPLEMENTABLES

Dans l'état technique constaté, les règles suivantes ne sont pas implémentables de manière sûre sans traiter d'abord les lacunes techniques :

- Task affectée à l'Agent courant.
- Lead affecté à l'Agent courant.
- Héritage Documents → projet/dossier → scope Agent/Gestionnaire.
- Héritage Media → parent métier → scope; uploaded_by doit rester de la traçabilité.
- Consultation/modification UserProfile strictement limitée au profil courant.
- Application uniforme du périmètre village UserVillageAccess à toutes les routes Foncier.

Les deux règles Gestionnaire marquées UNKNOWN et celle sur les profils équipe restent en plus des décisions métier à prendre avant tout ajout de permission.

## 16. IMPACT SUR LA SUITE RBAC

- B.4.2 confirme une situation PARTIAL : l'ACL Foncier et certaines relations de modèle sont présentes, mais aucun scope validé n'est démontré end-to-end sur l'ensemble concerné.
- Ne pas bâtir la matrice finale en remplissant les lacunes par department, service, poste, role, access_level, création, uploader ou filtres client.
- L'absence de lien est un GAP technique; les UNKNOWN Gestionnaire restent UNKNOWN.
- Les scopes devront être revérifiés sur la base courante après toute décision ou évolution technique; ces constats ne demandent aucune évolution dans cette phase.
- DELETE, archive/restore, création d'ACL, relation de supervision et permission demeurent hors phase.

## 17. PREUVES / COMMANDES EXÉCUTÉES

Commandes d'inspection (toutes via RTK) : rtk git status --short, rtk git branch --show-current, rtk git diff --stat, rtk git diff --name-only, rtk rg, rtk nl, rtk sed. Un script Python exécuté via rtk python a parcouru AST des décorateurs du routeur Foncier pour dresser la liste complète des routes et usages directs get_user_id/check_access.

Vérifications runtime : requêtes SELECT dans transaction PostgreSQL READ ONLY sur information_schema, pg_constraint et agrégats de tables métier. Résultats de B.3 réutilisés pour les colonnes de lifecycle et contraintes déjà contrôlées. Aucune valeur de ligne n'a été extraite.

Principaux fichiers/lignes inspectés :

- backend/app/api/v1/tasks/router.py:48-191; backend/app/models/hr.py:27-104; backend/app/models/user.py:26-44
- backend/app/api/v1/leads/router.py:19-105,170-263; backend/app/models/leads.py:19-78; backend/app/models/entity.py:19-73
- backend/app/api/v1/foncier/router.py (toutes les routes; table section 6); backend/app/services/foncier.py:559-598; backend/app/repositories/foncier.py:622-644; backend/app/models/foncier.py:335-352
- backend/app/api/v1/rpc/router.py:111-503; backend/app/api/v1/tables/router.py:683-787; backend/app/core/authorization.py:13-80
- backend/app/api/v1/projects/router.py:15-90; backend/app/models/media.py:19-99; backend/app/api/v1/media/router.py:124-313
- backend/app/models/settings.py:43-68; backend/app/application/user_service.py:62-70; backend/app/main.py:38-92
- RBAC_PHASE_B3_RUNTIME_READONLY.md (constats de schéma et contraintes runtime déjà documentés)

## 18. ÉTAT GIT FINAL

Avant le début de B.4.2, rtk git status --short signalait déjà un arbre de travail non propre avec des modifications suivies et de nombreux fichiers non suivis; rtk git diff --stat recensait déjà des changements locaux. La branche active est audit/fix-schema-site. Aucun changement préexistant n'a été annulé ou réécrit.

À la clôture, rtk git status --short a été relancé. Il conserve les entrées préexistantes et affiche comme seule nouvelle entrée attendue : ?? RBAC_PHASE_B4.2_TECHNICAL_VERIFICATION.md. Aucun autre fichier n'a été modifié ou créé pendant cette phase.

## 19. GO / NO-GO

STATUT B.4.2 : PARTIAL — les vérifications ont établi des faits techniques réutilisables, mais les scopes Foncier sont incomplets et les liens/règles de plusieurs autres domaines ont des gaps.

IMPLEMENTATION : NO-GO tant que les gaps requis ne sont pas traités et les UNKNOWN métier décidés. GO B.4.2 ne vaut pas autorisation d'implémenter.

### Livrable final

========================================
RBAC B.4.2 — FIN
========================================

MODE : READ-ONLY

Modifications code : 0  
Modifications DB : 0  
Migrations : 0  
Permissions modifiées : 0  
Rôles modifiés : 0  
Nouvelles ACL : 0

Tasks Agent : GAP  
Tasks Gestionnaire : UNKNOWN (relation de supervision techniquement GAP)  
Leads Agent : GAP  
Leads Gestionnaire : UNKNOWN  
Foncier : PARTIAL  
Documents : GAP  
Media : GAP  
Profiles : GAP pour propre profil; UNKNOWN pour Gestionnaire/profils équipe

Gaps critiques : 7 classes  
UNKNOWN métier : 3 périmètres

STATUT B.4.2 : PARTIAL  
IMPLEMENTATION : NO-GO tant que les décisions/gaps requis ne sont pas traités
