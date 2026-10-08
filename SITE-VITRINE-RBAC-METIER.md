# Matrice RBAC métier — Site Vitrine et Media

État Phase 3.3.1. Les routes appliquent techniquement les permissions décrites ici, mais le dépôt ne contient pas de catalogue métier formel approuvant les accès par rôle. Le rapport Phase 3.3 consigne un mapping temporaire (admin écrit, gestionnaire lit, employé limité) et indique que sa validation métier reste attendue. La politique est donc **implémentée, mais pas confirmée comme politique métier définitive**.

## Sources réelles des rôles et décisions techniques

- Les rôles reconnus par EGS sont `admin`, `gestionnaire`, `employe` et `guest`, dans `backend/app/models/user.py` (`RoleEnum`) et dans le champ `users.role`.
- `POST /api/v1/auth/login` délivre les tokens. `get_current_user` valide le JWT puis recharge l'utilisateur; la décision serveur lit le `role` courant, pas un rôle UI.
- `backend/app/core/authorization.py` accorde toutes les actions exposées à `admin`, la lecture privée d'un ensemble limité de modules à `gestionnaire`, et aucune permission privée aux autres rôles.
- `ACCESS_LEVEL_MODULES`/`hasAccess` côté React est une visibilité d'interface; elle ne remplace pas les guards serveur.
- L'ACL `UserVillageAccess` reste une autorisation objet propre à certaines routes Foncier.
- À la lecture seule initiale de `egs_local`, il y avait 1 admin, 2 employés et aucun compte gestionnaire. Pour exercer cette dernière branche, un compte temporaire a été créé via l'API admin puis authentifié par le vrai endpoint login; il a été supprimé après le test.

## Matrice observée

`403` signifie refus serveur d'un utilisateur authentifié sans la permission correspondante; les lectures CMS publiques et layouts publiés restent accessibles conformément à leur route.

| Ressource | Action | Employé | Gestionnaire | Admin | Preuve |
|---|---|---|---|---|---|
| CMS | lecture de contenu | Public | Public | Oui | GET public; code `site_content/router.py` |
| CMS | création | 403 | 403 | Autorisé | guard `site_vitrine/create`; écriture admin réelle CMS consignée Phase 3.3 |
| CMS | modification | 403 | 403 | Autorisé | guard `site_vitrine/update` |
| CMS | suppression | 403 | 403 | Autorisé | guard `site_vitrine/delete` |
| Layout | lecture publié | Publié seulement | Oui | Oui | `page_layouts/{slug}` et filtre SQL `is_published` |
| Layout | lecture liste/brouillons | 403 | Oui | Oui | guard `site_vitrine/read_draft` |
| Layout | modification/upsert | 403 | 403 | Autorisé | guard `site_vitrine/create`; admin réel testé Phase 3.3 |
| Layout | publication | 403 | 403 | Autorisé | guard `site_vitrine/publish`; manager refusé par JWT réel |
| Site Vitrine | lots/réalisations publics | Lecture publique | Lecture publique | Oui | routes publiques et projections filtrées |
| Site Vitrine | création/modification/suppression privée | 403 | 403 | Autorisé | guards create/update/delete; contrôle de politique testé |
| Media | lecture privée | 403 | Oui | Oui | parcours HTTP réel: employé 403, gestionnaire/admin 200 |
| Media | upload | 403 | 403 | Autorisé | parcours HTTP réel: anonyme 401, employé/gestionnaire 403, admin 200 |
| Media | remplacement | 403 | 403 | Autorisé | guard `media/replace`; action réservée admin par la policy |
| Media | modification/suppression/restauration/usage | 403 | 403 | Autorisé | guards `media/update`, `delete`, `restore`, `create_usage`, `delete_usage` |
| Media | audit/purge | 403 | 403 | Autorisé | guards `media/read_audit`, `write_audit`, `purge` |
| `/tables` | lecture allowlist gestionnaire | 403 hors allowlist | Autorisée dans allowlist | Autorisée | `/tables/app_settings` refusé au manager réel; listes dans `authorization.py` |
| `/tables` | écriture/suppression | 403 | 403 | Autorisée sur tables exposées | guards dynamiques par table/action |

## État de validation métier

Le code impose le mapping temporaire ci-dessus. La preuve de Phase 3.3.1 vérifie sa mise en œuvre avec des JWT réels, mais le workspace ne fournit pas de décision métier durable, procédure d'approbation ou comptes gestionnaires existants. En application de la consigne « ne pas décider arbitrairement », la distinction métier employé/gestionnaire/admin reste **POLITIQUE NON DÉFINIE / À confirmer par le responsable métier**. Les permissions effectives sont donc documentées comme état serveur, pas comme validation métier finale.

Risque à faire valider : l'allowlist `/tables` du gestionnaire comprend notamment `parties`, `leads`, `lead_captures`, `media_files` et `media_versions`; ces tables peuvent contenir des données personnelles ou sensibles et la route générique n'ajoute pas de portée par ligne. Le refus sur `app_settings` est vérifié; une approbation métier de chaque table de l'allowlist manque.
