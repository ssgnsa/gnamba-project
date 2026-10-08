# GNAMBA / EGS — RBAC Phase B.5
# Cadrage technique des relations canoniques — SANS IMPLÉMENTATION

Date d'observation : 2026-09-24 (UTC)  
Portée : code, migrations présentes dans le dépôt et runtime local PostgreSQL `egs_local` tel que documenté/inspecté.  
Statut : document de conception; aucune décision métier n'est ajoutée et aucune évolution n'est exécutée.

## 1. OBJECTIF ET GARDE-FOUS

B.5 répond à la question : quelles relations sont cohérentes et réutilisables, lesquelles divergent entre code, migrations et base courante, et quelle forme canonique préparer avant toute évolution RBAC ?

- Les constats runtime ne valent que pour l'instance locale interrogée. Ils ne certifient pas une autre base ou un déploiement de production.
- Les relations suggérées ci-dessous sont des recommandations de conception, pas des décisions métier validées.
- Les trois périmètres Gestionnaire de B.4.2 restent UNKNOWN. Aucun accès ne leur est attribué ici.
- Le statut d'une route sans garde locale n'établit pas qu'elle doit être publique. Les routes publiques candidates restent à confirmer selon DECISION-009.
- Aucun code, schéma, rôle, permission, donnée, migration ou ACL n'a été modifié. Aucune migration ni aucun test n'a été lancé.

## 2. SYNTHÈSE

La cible recommandée est de conserver les identifiants d'authentification `User` comme sujets de sécurité, de restaurer des relations métier typées et contraintes, et de faire porter le périmètre de ligne par une relation vérifiable jusqu'à l'objet. `authorization.py` devrait rester une couche d'application de décision rôle/action; il ne doit pas devenir le registre des jointures propres à chaque table.

Écarts structurants observés :

1. **Employé / tâche :** migrations historiques avec `employees.user_id` et `tasks.assigne_a`; modèle courant `User.entity_id` / `Employee.entity_id` et `Task.employee_id`; runtime `users.id` texte, `employees.id` texte sans `user_id` ni `entity_id`, `tasks.employee_id` texte sans FK. Aucun chemin de scope end-to-end n'est fiable.
2. **Lead :** migration et modèle historique `leads.assigne_a → users.id`; route actuelle sur `Entity` avec `assigned_to` en JSON metadata; colonne runtime `leads.assigned_to` texte sans FK. Plusieurs représentations sans source de vérité unique.
3. **Hiérarchie :** migration initiale avec `employees.superieur_id`; ce champ n'est pas dans le modèle courant ni le schéma runtime relevé. Pas de relation Agent → Gestionnaire exploitable.
4. **Documents / Media :** les champs parent sont absents ou souples, parfois nullable, sans intégrité qui garantisse l'héritage du scope.
5. **Profil :** le modèle et les migrations déclarent une relation UserProfile→User unique; le runtime a des tables vides et ne reflète pas les mêmes contraintes.
6. **Foncier :** l'ACL de village est bien une association dédiée, mais ses clés `UUID` ne sont pas compatibles structurellement avec la clé `users.id` runtime `character varying`; la table ne contient aucune affectation.

## 3. MÉTHODE ET PREUVES

- Lecture ciblée des modèles SQLAlchemy, routeurs, services/repositories et migrations Alembic liées aux relations couvertes.
- Réutilisation des constats catalogues/agrégats de [B.3 runtime read-only](RBAC_PHASE_B3_RUNTIME_READONLY.md) et de l'inventaire détaillé des 59 routes Foncier de [B.4.2](RBAC_PHASE_B4.2_TECHNICAL_VERIFICATION.md).
- Vérification Foncier supplémentaire par transaction PostgreSQL `READ ONLY`, sans sélectionner de valeur personnelle : `users_total=4`, `users_uuid_shaped=1`, `uva_rows=0`, `uva_uuid_shaped=0`, `matching_user_keys=0`.
- Vérification catalogue des types/colonnes : `users.id` character varying; `user_village_access.user_id` UUID; `employees.id` et `tasks.employee_id` texte; aucune colonne `employees.user_id`, `employees.entity_id` ou `employees.superieur_id` dans le runtime inspecté.
- Une requête d'agrégat initiale a été arrêtée par erreur de nom de colonne (`employees.user_id` absent); elle n'a retourné aucun contenu de ligne métier ou personnel. La requête catalogue qui suit confirme l'absence de cette colonne. Toutes les interrogations DB sont restées en lecture seule.

## 4. MATRICE DES RELATIONS : ÉTAT ET CIBLE

| Relation | À conserver | Incohérence / limite observée | Cible de conception recommandée | Décision métier encore nécessaire |
|---|---|---|---|---|
| `User ↔ Employee ↔ Task` | La tâche référence une affectation employé; la migration historique savait relier `employees.user_id` et `tasks.assigne_a` aux comptes. Le modèle courant prévoit `Task.employee_id → Employee.id`. | Ces représentations coexistent selon les couches. Runtime : pas de `employees.user_id`/`entity_id`; `tasks.employee_id` est texte, sans FK; `User.id` ne peut pas être joint sûrement à Employee. | Choisir **un seul** chemin authentifié. Cible préférée à évaluer : `User.entity_id → Entity.id ← Employee.entity_id`, puis `Task.employee_id → Employee.id` avec FK; garantir l'unicité/cardinalité User–Employee attendue. Ne pas conserver en parallèle un deuxième lien `employees.user_id` sans rôle défini. Une relation directe `employees.user_id` reste l'alternative de repli si l'identité RH n'est pas portée par Entity. | Confirmer si tout Agent a un compte et un dossier Employee, et si la relation est 1:1, 1:0..1 ou plusieurs comptes/dossiers. DECISION-003 scope Agent Tasks déjà OUI; aucune affectation valide runtime démontrée. |
| `User ↔ Lead` | Les FK historiques `leads.assigne_a → users.id` ont un sens de sécurité explicite. Le routeur courant stocke des entités Lead. | `assigne_a`, `assigned_to` JSON et `leads.assigned_to` runtime sont divergents; valeur runtime non reliée par FK; les lignes Leads/Entity de la base observée sont vides. | Garder une seule entité/contact canonique conformément au domaine retenu (actuellement route Entity), mais porter l'affectation dans un champ/relation typé vers `users.id`, jamais comme JSON libre. Déprécier l'autre représentation après rapprochement des données. | Confirmer le rôle métier qui reçoit les leads, transfert/réaffectation, propriété après départ et besoin d'historique d'affectation. DECISION-003 Agent Leads = OUI; scope Gestionnaire = UNKNOWN. |
| `Agent ↔ Gestionnaire` | La migration 009 contient historiquement `employees.superieur_id → employees.id`; c'est un indice de conception RH à examiner, pas une relation active attestée. | Absent du modèle courant et du runtime. Les mots service/département/poste ne constituent pas un lien de supervision. | Si chaque employé n'a qu'un supérieur courant : relation typée Employee→Employee avec FK et règles de cycle/validité. Si les périmètres sont multiples ou historisés : table de rattachement Gestionnaire–Agent avec dates d'effet et statut. Ne choisir entre ces formes qu'après décision organisationnelle. | Les 3 UNKNOWN restent ouverts : Gestionnaire→Tasks supervisées; Gestionnaire commercial→Leads; Gestionnaire→profils d'équipe. Définir si les trois périmètres sont identiques ou indépendants. |
| `Document ↔ Project/Dossier` | `documents.project_id` est le lien applicatif existant vers `projects.id`. | Colonne runtime texte nullable sans FK; pas de propriétaire fiable de Project; pas de modèle Dossier canonique établi. | Pour les documents de projet, FK typée vers Project. Si un document peut appartenir à plusieurs types de dossiers métier, association(s) explicites et référentielles par domaine, plutôt qu'un couple polymorphique non vérifié `type/id`. Sans parent vérifié : aucune déduction de scope. | Définir si les documents sans dossier sont permis et quels modules constituent les dossiers. La création/uploader reste sans effet sur le scope (B.4.1). |
| `Media ↔ Project/Dossier` | Conserver MediaFile pour le binaire, versions, usages d'affichage et audit technique. | `uploaded_by` n'est qu'une trace; `media_usage.entity_type/entity_id` générique et facultatif ne garantit ni existence ni autorisation du parent; le stockage StaticFiles ne consulte pas le parent. | Séparer l'asset du lien d'attachement métier. Ajouter conceptuellement des attachements typés vers les parents autorisés ou une abstraction de dossier réellement FK-able; chaque lecture du fichier résout ce parent avant de livrer l'actif privé. | Décider quels médias sont publics (brand assets notamment), si plusieurs parents sont possibles et la règle d'accès si plusieurs parents ont des périmètres différents. |
| `User ↔ UserProfile` | Relation one-to-one `UserProfile.user_id → users.id` avec FK/unique dans le modèle et les migrations ultérieures. | Runtime vide; `user_id` texte sans FK/unique; route générique sans filtre self. | Préserver un profil de préférences par compte, clé étrangère vers la clé primaire User canonique et unicité obligatoire; self-service dérivé exclusivement du principal JWT. Rôles/profil métier ne doivent pas être recopiés ici. | Scope propre profil = OUI; dépassement Admin accepté par B.4.1. Gestionnaire→profil d'équipe = UNKNOWN. |
| `User ↔ UserVillageAccess` | L'association dédiée User–Village et la contrainte unique `(user_id, village_id)` sont la bonne forme conceptuelle pour une ACL géographique; conserver les niveaux en données d'accès village, si le métier les confirme. | `user_id` UUID sans FK User; runtime `users.id` est texte et seulement 1/4 des ID est UUID-shaped; zéro ligne UVA. `get_user_id` renvoie une chaîne mais plusieurs handlers la typent UUID. | Aligner `user_id` strictement sur le type/valeur de la clé primaire User qui restera canonique, puis FK vers users.id et validation applicative typée de bout en bout. Ne pas convertir/caster des clés existantes sans table de correspondance et rapprochement explicite. | Confirmer la gouvernance d'octroi initiale, le sens des 4 niveaux et si l'accès village est indépendant des rôles globaux. Le besoin de scope village est OUI (B.4.1); opérations par niveau restent à décider. |

## 5. USER ↔ EMPLOYEE ↔ TASK — CANONICALISATION

### Constats de source

- Migration `009_hr_employees_tables.py` : `employees.user_id → users.id`, `employees.superieur_id → employees.id`; `tasks.assigne_a → users.id` et `tasks.projet_id → projects.id`.
- Migration de fusion/personne `b350...` et modèles courants : `employees.entity_id → entities.id`, `users.entity_id → entities.id`, `tasks.employee_id → employees.id`.
- Runtime actuel : `employees` n'a ni `user_id`, ni `entity_id`, ni `superieur_id`; `tasks.employee_id` est texte et sans FK. `employees` a 2 lignes, `tasks` 0.
- Le routeur `/api/v1/tasks` ne lie pas le paramètre `employee_id` à l'identité courante; ce cadrage ne l'active ni ne le corrige.

### Recommandation conditionnelle

La voie Entity partagée est cohérente avec le modèle courant EGS : compte User et fiche Employee pointent vers la même Entity personnelle; la tâche pointe vers la fiche Employee. Elle n'est sûre comme lien d'identité que si l'unicité/cardinalité est imposée et les valeurs `entity_id` rapprochées. Runtime actuel ne permet pas cette jointure; la migration devra d'abord prévoir résolution et cas non mappés. Si User et Employee sont des identités distinctes, retenir plutôt une FK directe Employee→User. Ne jamais déduire le lien par nom, email ou département sans validation de correspondance.

La colonne d'affectation Task devrait avoir une seule source métier. Les deux champs hérités `assigne_a` (compte) et `employee_id` (dossier employé) ne doivent pas coexister comme scopes autonomes. La cible Entity partagée ci-dessus privilégie `employee_id` FK et résout le compte via l'identité vérifiée.

## 6. USER ↔ LEAD — CANONICALISATION

Le modèle `Lead` et la migration 008 contiennent `assigne_a` vers User; le routeur actuel CRUD une `Entity` et place `assigned_to` dans metadata. Le schéma runtime ajoute une troisième représentation textuelle `leads.assigned_to` sans FK. L'absence de lignes ne permet pas de déterminer quelle représentation les usages en production attendent.

Recommandation : retenir une seule représentation canonique de la fiche Lead, migrer l'affectation vers un lien relationnel typé `User`, et conserver les métadonnées JSON pour les attributs descriptifs non structurants. Avant décision de stockage, recenser consommateurs API/UI/RPC, références par `lead_id`, campagnes/interactions/parties et snapshots; définir une table de correspondance ID si les deux espaces d'entités contiennent des identités distinctes. Rapprochement, fusion ou suppression de la table historique sont hors B.5.

## 7. AGENT ↔ GESTIONNAIRE — CHOIX D'ARCHITECTURE CONDITIONNEL

La migration 009 prouve qu'une hiérarchie Employee supérieure a existé dans une version de schéma; elle ne prouve ni qu'elle est encore souhaitée, ni qu'elle s'applique au périmètre commercial ou aux profils.

| Forme envisagée | Convient si | Contrôles nécessaires avant usage RBAC |
|---|---|---|
| `employees.superieur_id` auto-FK | Un seul responsable direct courant par employé suffit. | Établir que Gestionnaire est lui-même Employee; cycles interdits; changement de supérieur daté/audité; conversion Manager User→Employee vérifiable. |
| Table de rattachement Manager–Agent | Plusieurs responsables, délégations ou rattachements temporaires sont requis. | FK des deux côtés; unicité/validité temporelle; révocation; audit; règles d'intersection entre branches métier. |
| Rôle seul / department / service | N'est pas une relation d'équipe. | Ne peut pas fournir un ensemble de lignes; ne doit pas servir de remplacement implicite. |

Recommandation : réexaminer le `superieur_id` historique avant d'inventer une nouvelle hiérarchie. Le runtime et le modèle courant ne l'exposent pas; il ne doit pas être utilisé dans une autorisation avant restauration/validation de sa sémantique. Si les trois périmètres Gestionnaire ont des populations différentes, un seul lien hiérarchique ne suffit pas nécessairement.

## 8. DOCUMENTS ET MEDIA — HÉRITAGE DU PARENT

### Documents

`documents.project_id` pointe conceptuellement vers Project, mais nullable/texte sans FK; Project ne contient pas de lien Agent/Gestionnaire. Un filtre de documents ne peut donc pas se déduire de la seule présence de `project_id`. Pas de type Dossier autonome n'est établi dans les modèles inspectés.

Recommandation : décider quels parents sont autorisés, puis imposer une relation typée par parent. Les documents à rattachement obligatoire doivent avoir parent non nul après réconciliation; les documents généraux éventuellement permis doivent recevoir un périmètre explicite propre. Un project_id absent, inconnu ou orphelin ne doit pas donner un accès plus large.

### Media

Conserver `MediaFile` comme objet fichier et `MediaVersion`/audit/usages pour leur fonction actuelle. Ne pas faire de `uploaded_by` le propriétaire de sécurité, conformément à B.4.1. `MediaUsage` n'est pas une FK métier générique et les statistiques B.4.2 relèvent que 25/34 fichiers n'ont aucune ligne d'usage.

Recommandation : normaliser les attachements parentaux et distinguer trois cas : média public explicitement publié; média privé lié à un parent autorisé; média sans parent/publication, non livrable à un utilisateur non autorisé. Le chemin `/storage` doit participer au futur contrôle si les fichiers sont privés; un guard API seul ne protège pas les URL statiques. Cette exigence est une cible de conception, aucun contrôle n'a été ajouté.

## 9. USER ↔ USER PROFILE

La relation du modèle et de la migration est saine comme intention : un profil de préférences par compte, FK + unicité. Le runtime `user_profiles` est vide et manque les mêmes contraintes. Le compte User est l'autorité d'identité; profil ne doit pas porter une deuxième copie du rôle ou du rattachement hiérarchique.

Recommandation : préserver cette relation et créer/récupérer le profil par le principal authentifié, jamais avec un `user_id` libre soumis par le navigateur pour un utilisateur standard. Admin peut disposer de capacités transverses décidées ailleurs. Le profil d'équipe Gestionnaire demeure UNKNOWN; aucune relation d'équipe ne peut actuellement le résoudre.

## 10. USER ↔ USER VILLAGE ACCESS : IDENTITÉ ET ZÉRO ACL

### Compatibilité de l'identité

Le constat catalogue runtime est `users.id character varying` et `user_village_access.user_id UUID` sans FK User. L'agrégat anonyme montre quatre comptes, dont un seul identifiant respecte la forme textuelle UUID; l'ACL comporte zéro ligne. Il n'y a donc aucune association existante à valider et aucune preuve de correspondance entre les deux espaces d'identifiants. Le typage UUID de certains handlers et la valeur chaîne renvoyée par `get_user_id` constituent en plus une frontière de types incohérente.

Avant de restaurer une FK, il faut confirmer si l'ID utilisateur stable est le texte actuellement stocké, ou si une normalisation d'identifiants est prévue hors de cette phase. La solution la moins destructive paraît aligner UVA sur la clé User canonique et poser FK après nettoyage; ce n'est pas une autorisation de conversion UUID ni de migration en B.5.

### Explication du zéro ACL

Faits établis :

- migration `006_foncier_tables.py` crée la table vide; aucun seed/backfill d'affectations User–Village n'a été repéré dans les migrations inspectées;
- le bootstrap système trouvé initialise des comptes/paramètres généraux, pas UserVillageAccess;
- aucun parcours d'attribution initiale automatique n'a été trouvé;
- le seul octroi applicatif repéré est `POST /foncier/access/{user_id}/villages/{village_id}` et il exige d'abord que l'appelant possède déjà le niveau `gestionnaire` sur ce village; la même condition est exigée pour révoquer;
- runtime : 0 ligne ACL. Donc l'API de gestion ne permet pas à elle seule de créer la première ACL d'un village vide : verrou de bootstrap structurel.

Conclusion : l'explication technique la mieux étayée du zéro est l'absence de seed/backfill combinée à l'absence d'un mécanisme bootstrap indépendant; la seule voie normale observée est circulaire. Le motif opérationnel historique (aucune affectation demandée, données jamais préparées, autre outil d'administration ou incident de déploiement) reste inconnu et ne peut pas être établi à partir du code et du seul état courant. Ne pas attribuer automatiquement tous les villages au premier Administrateur sans validation métier et contrôle d'identité.

## 11. FONCIER — INVENTAIRE FONCTIONNEL ET PUBLIC/PRIVÉ

La liste exhaustive des 59 routes et le détail auth/UVA restent consignés dans la section 6 de B.4.2. Inventaire par parcours fonctionnel ci-dessous; « candidat public » est une hypothèse de tri pour DECISION-009, jamais une classification d'accès déjà décidée.

| Groupe fonctionnel / routes | Destination de conception | Statut métier |
|---|---|---|
| Vérification d'attestation `GET /attestations/verify/{reference}` | Candidat à une vérification publique limitée à un résultat expurgé (validité/référence, sans données personnelles); sinon route privée. | DECISION-009 UNKNOWN; champs publics à décider. |
| Noms de villages `GET /villages/names` | Candidat public uniquement si nécessaire au formulaire/public; liste bornée et sans champs administratifs. | À valider; pas de décision publique existante. |
| Villages : liste, détails, stats, création, mise à jour, suppression | Lecture/gestion métier privée par défaut de conception; si le site a besoin d'une liste, exposer une projection vitrine distincte. | OUI/roles/scope à décider selon DECISION-009/002; aucun accès global n'est déduit. |
| Lotissements, îlots, assemblage : liste/détail et CRUD hiérarchique | Privé métier; une publication site doit passer par projection explicitement publiée, pas par lecture de l'API interne. | Publicité de champs / rôles à confirmer. |
| Lots : liste/détail/recherche/doublon/import/export/archive/restore | Privé métier. Des lots publiés peuvent être servis par la route dédiée de vitrine déjà distincte après validation des champs publics. Export reste 501 actuellement. | Routes d'export sans décision; règles archive/restore DECISION-006; publication DECISION-008/009. |
| Attestations : liste/détail/création/PATCH/submit/validate/scan/sign/revoke/génération et lecture PDF | Privé et sensible par nature des documents; la vérification par référence est le seul candidat public à isoler. | Validation, rôles, audit et transitions DECISION-007; accès public PDF UNKNOWN. |
| Audit : timeline, recherche, CSV/PDF | Privé, réservé à des fonctions d'audit à définir; exports en 501. | Rôles et audit export DECISION-005/009. |
| Gestion ACL : octroi, révocation, voir les utilisateurs du village, lire ses villages | Privé; auto-consultation limitée au principal; administration séparée du scope de données métier. | Niveaux, administrateur d'amorçage et audit restent à valider. |
| Sync offline : statut, trigger, queue, résolution, nettoyage | Interne à l'application/opérateurs; ne pas exposer comme surface publique. | Rôles d'exploitation à préciser; auth locale n'est pas une décision suffisante. |
| Dashboard stats village/global | Privé par défaut; statistiques globales potentiellement agrégées/publicables uniquement via décision explicite et réponse dédiée. | Route actuelle exige JWT mais branche globale n'exige pas UVA; public/roles UNKNOWN. |

En plus des routes locales, `/api/v1/tables` et les actions `/api/v1/rpc` touchant le Foncier doivent être incluses dans toute future couverture; la section 6 B.4.2 montre qu'elles contournent actuellement l'ACL village pour plusieurs opérations. Les routes HTTP sans garde locale sont des expositions techniques constatées, non une décision qu'elles sont publiques.

## 12. FONCIER — MATRICE DE NIVEAUX À VALIDER

L'implémentation repository ordonne les niveaux comme `lecteur < agent < validateur < gestionnaire`; chaque niveau supérieur satisfait donc le test d'un niveau inférieur. Cette hiérarchie est une règle technique existante, pas une décision métier confirmée. Si les niveaux sont des fonctions non cumulatives, leur représentation doit devenir des capacités séparées plutôt qu'une échelle.

| Famille d'opérations | Proposition de minimum pour validation métier (non validée) | Questions de cadrage |
|---|---|---|
| Lecture des ressources d'un village attribué | `lecteur` | Quels champs sont visibles? Lecture seule des données publiées et/ou métier? L'accès est-il cumulatif avec les autres niveaux? |
| Saisie et modification métier courante dans un village | `agent` | Quelles tables/actions et quels états? Agent peut-il modifier après soumission? |
| Validation d'attestations et actes d'approbation | `validateur` | Les validations finales sont-elles distinctes de soumission, signature, scan, révocation et archivage? Quelle séparation des tâches? |
| Gestion des affectations User–Village | `gestionnaire` | Qui peut attribuer le premier accès; peut-on s'accorder ou révoquer soi-même; quels contrôles/audits? |
| Sync, exports, audit, stats globales, suppression/reprise | À laisser non attribué à ce stade | Règles DECISION-005/006/007/009, exploitation et risque données à préciser. |

La table ci-dessus est un support pour obtenir des décisions, pas une matrice de permissions exploitable. La règle courante de comparaison ordinal implique que `gestionnaire` a aussi `validateur`, `agent`, `lecteur`; faire confirmer explicitement cette inclusion ou la remplacer par capacités indépendantes. Un niveau ne devrait jamais autoriser un accès à des villages non attribués.

## 13. LES TROIS UNKNOWN MÉTIER — À GARDER EXPLICITES

| Décision toujours ouverte | Question à soumettre au responsable métier | Dépendance technique de résolution |
|---|---|---|
| Gestionnaire → Tasks des Agents supervisés | Le gestionnaire voit-il toutes les tâches des personnes dont il est officiellement responsable? Sous quelles actions/états et délégations? | Relation superviseur/membership fiable plus User↔Employee et Task→Employee cohérents. |
| Gestionnaire commercial → Leads de son périmètre | Le scope suit-il la hiérarchie, une équipe commerciale, une agence, une campagne, ou des affectations explicites? | Relation User assigné et définition organisationnelle; peut différer de la hiérarchie RH. |
| Gestionnaire → profils équipe | Le Gestionnaire voit-il tout le profil ou seulement les préférences/champs professionnels nécessaires? | Relation d'équipe et whitelist de champs; préférences/connexion/IP ne doivent pas être exposées par héritage implicite. |

Tant que le métier ne répond pas : conserver `UNKNOWN`; ne pas créer le lien d'équipe pour fabriquer un droit, ne pas considérer UNKNOWN comme NON ou OUI.

## 14. ARCHITECTURE RECOMMANDÉE

### Séparer quatre responsabilités

1. **Identité authentifiée :** résoudre une seule fois le principal JWT vers une clé User stable, correctement typée.
2. **Relations métier :** User↔Employee, User↔Lead assigné, Agent↔Gestionnaire, ressource↔parent, User↔Profile, User↔Village avec FK/cardinalités déclarées.
3. **Scope des lignes :** requêtes de domaine/repositories construites à partir du principal et de liens validés; pas à partir d'un ID de scope libre du client.
4. **Décision d'accès :** composant d'application central qui combine rôle/action, scope résolu, état métier et audit. Il délègue les résolveurs de scope typés par domaine; il ne contient pas un grand arbre de jointures spécifiques à 38 tables.

### Séquence de choix

```text
CONSERVER les relations canoniques vérifiables
       ↓
ADAPTER les différences de type/nullabilité après rapprochement des données
       ↓
UNIFIER les doubles sources (Lead assignment, IDs/auth, parent d'attachements)
       ↓
RECONSTRUIRE uniquement les relations absentes dont le métier confirme le besoin
       ↓
appliquer rôles/actions/scopes sur ces liens et vérifier tous les chemins de lecture
```

Ne pas décider « reconstruire » avant inventaire des usages/données. Une migration compatible devrait d'abord inventorier/résoudre les identités, introduire les liens typés sans supprimer la source historique, contrôler les lignes non rapprochées, basculer les écritures/lectures, puis retirer l'ancienne source seulement après vérification indépendante. Ces étapes sont de conception et ne constituent pas un plan de migration approuvé.

## 15. CE QUI PEUT ÊTRE CONSERVÉ / CE QUI NE DOIT PAS ÊTRE UTILISÉ TEL QUEL

| Élément | Orientation B.5 |
|---|---|
| `Entity` comme fiche métier commune personne/organisation | Conserver pour l'identité métier; ne pas en faire le principal d'auth ni stocker dans son JSON les références structurantes de scope. |
| `Task.employee_id → Employee.id` du modèle courant | Conserver comme relation tâche–employé cible, mais rendre typée/intégrée et résoudre Employee depuis User avant activation Agent. |
| `UserProfile.user_id → User.id` | Conserver l'intention one-to-one; aligner/runtime FK unique et service self. |
| `UserVillageAccess(user,village)` | Conserver comme concept ACL de géographie; réaligner type/FK et établir un chemin bootstrap audité séparé. |
| `employees.user_id`, `tasks.assigne_a`, `leads.assigne_a`, `employees.superieur_id` des migrations historiques | Indices utiles pour rapprochement et sémantique historique; ne pas les supposer actifs dans runtime ni remettre en service sans décision et réconciliation. |
| `assigned_to` dans JSON Entity metadata ou colonne textuelle | Ne pas utiliser comme clé de sécurité; normaliser vers relation typée unique. |
| `media_usage.entity_type/entity_id` | Conserver pour index d'usage/affichage; ne pas le traiter seul comme FK de parent sécurisé. |
| `department`, `service`, `poste`, filtres client, `created_by`, `uploaded_by` | Ne sont pas substituts aux liens de supervision/propriété confirmés. |

## 16. DÉCISIONS / PREUVES À OBTENIR AVANT UNE PHASE DE MODIFICATION

- Confirmer DECISION-003 et les trois choix Gestionnaire de la section 13.
- Établir les cardinalités et règles RH/commerciales de chaque relation; valider si les rattachements sont historiques ou uniquement courants.
- Établir une clé User immuable et les correspondances anonymement rapportables; résoudre les ID non UUID avant FK/conversion.
- Pour Foncier, déterminer qui est autorisé à créer la première affectation, identifier le propriétaire métier de chaque village et approuver les niveaux/actions, la hiérarchie et l'audit.
- Décider le statut public et les champs des deux candidates (vérification attestation, noms villages) et de chaque projection vitrine concernée.
- Inventorier consommateurs frontend/API/RPC, données historiques et références pour les deux formes de Lead et les liens Documents/Media avant toute migration.
- Définir comportement d'accès des objets sans parent, lien orphelin, affectation désactivée ou utilisateur supprimé : aucune ouverture par défaut.

## 17. LIMITES

- Le code de travail est localement modifié depuis avant B.5; lecture = état courant du checkout, pas preuve que toutes les modifications sont déployées.
- Le conteneur local et la base `egs_local` ne sont pas assimilés à la production.
- Le compte 1/4 UUID-shaped ne révèle aucune valeur d'ID; il ne démontre pas de correspondance. Avec zéro ACL, aucune association runtime ne peut être confrontée à un compte réel.
- Le code peut expliquer une absence de mécanisme d'amorçage, mais pas l'historique opérationnel qui a conduit à zéro ligne.
- Les routes candidates publiques et les niveaux de la section 12 sont des questions/propositions, pas des permissions décidées.

## 18. CONTRÔLE FINAL

- B.5 produit uniquement ce cadrage documentaire.
- Aucune écriture DB : requêtes de lecture en transaction `READ ONLY` seulement.
- Aucun code, configuration, migration, test, rôle, permission, ACL, endpoint ou règle DELETE touché.
- Les changements locaux déjà présents n'ont pas été nettoyés, réécrits ou annulés.
- La phase ne démarre aucune implémentation ni migration.

## 19. GO / NO-GO

**B.5 — CADRAGE TECHNIQUE : terminé sur les sources locales et le runtime disponible.**

**GO** pour transmettre aux responsables métier les questions de périmètre et préciser les cardinalités.  
**NO-GO** pour l'implémentation RBAC, les changements de schéma et toute attribution initiale UserVillageAccess avant résolution d'identité/gouvernance.

Prochain jalon après validation : documenter les réponses métier et produire un modèle cible détaillé avec plan de rapprochement/migration pour revue; aucun DDL/DML ne découle de ce rapport.
