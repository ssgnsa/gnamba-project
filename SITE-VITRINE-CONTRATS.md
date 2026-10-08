# Audit des contrats réels du Site vitrine — Phase 2

Date : 2026-09-23  
Branche examinée : `audit/fix-schema-site`  
Portée : lecture du code courant, lecture seule du PostgreSQL local `egs_local` (port 5433), requêtes HTTP GET/HEAD publiques. Aucune écriture, migration, modification de code ou suppression n'a été faite. Ce rapport est le seul nouvel artefact.

## A. Contrat des routes

`src/lib/publicRoutes.ts` définit 16 routes de pages publiques (certaines routes représentent l'authentification ou une fonctionnalité transactionnelle, pas des pages éditoriales). `App.tsx` mappe ces routes vers des composants et assure la navigation par historique navigateur, sans routeur. Les routes dynamiques `/verify/*` et `/verification-attestation` sont traitées séparément. `/forgot-password` et `/reset-password` sont des variantes de connexion.

| Route canonique du code | Composant / comportement | Page Builder possible | CMS direct / données |
|---|---|---:|---|
| `/` | `PublicHome` | Oui (`accueil`) | CMS; réalisations; lots vitrine; messages de contact |
| `/a-propos` | `PublicAbout` | Oui (`about`) | CMS |
| `/services` | `PublicServices` | Oui (`services`) | CMS |
| `/immobilier` | `PublicImmobilier` | Non | Texte et sections codés |
| `/foncier` | `PublicFoncier` | Non | Texte et sections codés |
| `/lotissement` | `PublicLotissement` | Non | Texte et sections codés |
| `/btp-construction` | `PublicBtpConstruction` | Non | Texte et sections codés |
| `/realisations` | `PublicRealisations` | Oui (`realisations`) | Table `site_realisations` |
| `/temoignages` | `PublicTestimonials` | Non | Données éditoriales codées |
| `/blog` | `PublicBlog` | Non | Page codée; pas de module d'articles repéré dans ce parcours |
| `/contact` | `PublicContact` | Oui (`contact`) | CMS; écrit un message de contact |
| `/faq` | `PublicFAQ` | Non | FAQ codée |
| `/mentions-legales` | `PublicLegal` | Non | Contenu codé / réglages de marque |
| `/login` | `LoginPage` | Non | API d'authentification et Turnstile |
| `/verification-attestation` | `PublicVerification` | Non | Données et API de vérification |
| `/lots-disponibles` | `PublicLots` | Non | Lots vitrine; création d'opportunité/tâche lors d'une demande |

Les pages classiques existent donc dans le dépôt pour les cinq clés du constructeur. Le site ne consulte pas une table de layout pour les onze autres clés/routes. `PublicLayout` applique le même habillage et fournit `SiteContentProvider`; cela ne rend pas toutes ces pages pilotées par le CMS.

## B. Contrat des pages et sources de contenu

| Page | Sections structurantes observées | Contenu éditorial | Données métier / formulaires |
|---|---|---|---|
| Accueil classique | Hero, services, lots, réalisations, avantages, CTA, contact | Une partie des valeurs et statistiques vient de `site_content`; plusieurs titres et sections restent codés | Lit `site_realisations` et `vitrine_lots`; insère dans `contact_messages` |
| À propos classique | Hero, présentation, valeurs, jalons, équipe | Overrides CMS ciblés, structure codée | Pas de lecture Immobilier/Foncier repérée |
| Services classique | Hero et domaines de service | Overrides CMS ciblés, structure codée | Pas de catalogue de services ERP repéré |
| Réalisations classique | Hero, filtres, grille | Structure et textes codés | Lit `site_realisations` |
| Contact classique | Hero, coordonnées et formulaire | Overrides CMS ciblés | Insère un message; traitement commercial par l'ERP en aval non vérifié ici |
| Immobilier / foncier / lotissement / BTP | Pages métier éditoriales avec sections propres | Principalement codé | Pas de projection des fiches ERP démontrée dans ces composants |
| Lots disponibles | Listing, filtres, fiche et formulaire de demande | Labels principalement codés | Lit `vitrine_lots`; crée une opportunité puis tâche/trace de demande |
| Témoignages / blog / FAQ / légal | Sections éditoriales propres | Codé; aucune API éditoriale dédiée repérée | Aucun flux ERP démontré |

Dans le rendu Builder, les sections sont triées par `order` et les types non reconnus retournent `null`. Le parseur d'override tente d'ignorer un JSON invalide, mais les propriétés de sections ne sont pas validées contre un schéma runtime avant le rendu.

## C. Contrat des sections

`src/components/page-builder/types.ts` et `PublicPageLayoutRenderer.tsx` définissent 16 types :

| Section | Responsabilité | Source habituelle | Fallback / limites |
|---|---|---|---|
| `hero` | Bannière, texte, CTA, image | Props JSON de layout; overrides `site_content` | Champs absents restent vides ou valeurs par défaut du Builder |
| `text` | Bloc de texte | Props JSON / overrides | Aucun modèle éditorial distinct |
| `services` | Liste de services | Props JSON / overrides | Pas de source ERP |
| `gallery` | Galerie d'images | URLs dans props JSON / overrides | Aucune liaison média typée requise |
| `testimonials` | Témoignages | Props JSON / overrides | Pas de source CRM dédiée |
| `contact` | Coordonnées et formulaire | Props JSON / overrides | Formulaire selon le renderer; le flux de soumission de cette section n'a pas été vérifié en navigateur |
| `cta` | CTA simple | Props JSON / overrides | Destination URL éditable |
| `faq` | Questions / réponses | Props JSON / overrides | Props JSON |
| `footer` | Pied de page du layout | Props JSON / overrides | Si absent, le footer global `PublicLayout` reste visible |
| `featured-lots` | Lots mis en avant | `vitrine_lots`, filtrés par indicateur public | Retourne `null` si aucun lot; la page classique reprend seulement si tout le layout est absent, pas si cette section seule est vide |
| `site-realisations` | Réalisations mises en avant | `site_realisations` via `/tables` | Retourne `null` si liste vide |
| `trust-signals` | Signaux de confiance | Props JSON / overrides | Aucune preuve d'ERP |
| `advantages` | Avantages | Props JSON / overrides | Aucune preuve d'ERP |
| `stats-bar` | Statistiques affichées | Props JSON / overrides | Valeurs éditoriales statiques possibles; pas un indicateur calculé automatiquement |
| `cta-band` | Bandeau CTA double | Props JSON / overrides | Destination URL éditable |
| `contact-form` | Formulaire compact | Props JSON / overrides | Téléphone/email dans props; endpoint de soumission à confirmer selon renderer |

Le Builder accepte des URL d'image en texte. MediaPicker est employé dans certains onglets Site Editor (par ex. réalisations/lots), mais le parcours de propriétés Page Builder n'enregistre pas une référence `media_id` pour les images de sections. Les usages média peuvent donc être des URLs non reliées à `media_usage`.

## D. Contrat CMS

Deux stockages coexistent :

1. `site_content(section, key, value, ...)` : dictionnaire libre de chaînes. Les composants classiques lisent certaines clés via `useSiteContent`; les sections Builder fusionnent aussi des overrides ciblés.
2. `page_layouts` : JSON de sections complet, un document potentiellement structurel par clé de page.

L'onglet « Texte & Valeurs » sauvegarde chaque valeur `site_content` connue dans l'éditeur. Il n'existe pas, dans le contrat inspecté, d'entités éditoriales typées ni d'état brouillon/publié/archivé par contenu. `site_content` n'a pas de status, auteur ou date de publication. Le Builder conserve un état `is_published`; les changements peuvent être enregistrés tout en restant publiés si cet état est déjà vrai.

## E. Contrat Page Builder et workflow observé

Les seules clés admises par l'interface sont `accueil`, `about`, `services`, `realisations`, `contact`.

1. `PageBuilder` charge la mise en page depuis `GET /api/v1/page-layouts/{slug}`. En cas d'absence/erreur, il démarre avec des sections vides (les templates sont une action d'édition, non une récupération automatique de la page classique).
2. « Enregistrer » appelle `POST /api/v1/page-layouts` avec `layout_json` et le booléen `is_published` courant. Donc un layout déjà publié peut recevoir des modifications sans repasser par un état brouillon.
3. « Publier » appelle `PATCH /api/v1/page-layouts/{slug}/publish`. L'API met `is_published=true`; aucun endpoint de dépublication explicite n'est câblé dans ce workflow. L'upsert peut envoyer `false` mais l'éditeur n'expose pas un contrôle dédié de retrait/publication.
4. Côté public, `App.tsx` charge ces layouts uniquement pour cinq routes. Si la réponse indique publiée et renvoie un tableau non vide, le renderer remplace entièrement le composant classique. Si l'API répond en erreur, que le layout est absent/non publié ou que le tableau est vide, le composant classique sert de fallback.
5. Une structure dont certains types sont inconnus est rendue partiellement, les sections inconnues disparaissant. Un JSON qui n'est pas un tableau ou un tableau vide déclenche le fallback. Aucune validation profonde de props, preview indépendante ou historique/rollback de version n'a été trouvé.
6. Tant que le fetch n'a pas répondu, `publishedLayoutLoading` garde le chargement public à l'écran. Le client API n'a pas de timeout explicite dans le chemin examiné : une requête qui reste pendante retarde donc aussi le fallback.

### Layouts actuellement publiés dans la DB locale

La base `egs_local` contient des lignes publiées pour `about`, `accueil`, `contact`, `services`, et des lignes historiques avec clé/slug vide. La dernière entrée valide `accueil` lue a 3 sections; `about`, `contact` et `services` en ont chacune 1. Aucun layout valide `realisations` n'a été retourné par l'inspection. Il y a plusieurs enregistrements `accueil` et plusieurs lignes dont `page_slug` et `page_key` sont vides. Ce constat concerne uniquement la DB locale, pas la production.

## F. Contrat Media

Le backend possède `media_files`, `media_versions`, `media_usage`, taxonomie et journalisation. `MediaResponse` expose notamment URL, alt, tags, taille/type, dimensions, identifiant et état de suppression; le fournisseur de stockage produit une URL publique et `main.py` sert le stockage local. Paramètres de marque et certaines assignations de Site Editor réutilisent l'API Media.

Le flux Page Builder, lui, persiste des URL de chaînes dans `layout_json`; `og_image_media_id` existe dans la réponse/API layout mais le code SEO runtime d'`App.tsx` choisit une image depuis les réglages de marque et n'utilise pas les champs SEO/OG du layout. Le lien entre image éditoriale, média, alt text et suivi d'usage est donc facultatif, pas contractuel de bout en bout.

## G. Contrat Immobilier / Foncier

La table vitrine contient `lot_id` et `property_id` qui référencent respectivement un lot foncier et une propriété immobilière. En revanche, le formulaire Site Editor permet de saisir titre, description, prix, surface, localisation, images, statut et `publier_sur_vitrine` sur une ligne vitrine. Le public lit ces valeurs de `vitrine_lots`; il ne lit pas directement `properties` ou `foncier_lots` dans le listing.

Classification prouvée par le code : **D — mélange**. Le modèle permet une projection liée (FK), mais permet également une fiche vitrine enrichie/autonome. La présence d'une référence n'entraîne pas de synchronisation visible des champs. La source de vérité des champs de vente/publication est donc la ligne `vitrine_lots` tant que l'API de jointure/synchronisation n'est pas démontrée.

Dans la DB locale au moment de la lecture : 1 lot vitrine publié, 0 ligne avec `lot_id`, 0 avec `property_id`. Cela décrit seulement les données locales examinées.

## H. Contrat Réalisations

Le Site Editor crée et modifie `site_realisations` (référence, titre, description, type, localisation, photos, dates, budgets, `publier_vitrine`). Le renderer Builder et `PublicRealisations` lisent cette table. `src/pages/Projets.tsx` administre la table ERP `projects`, mais aucun FK ou adaptateur entre `site_realisations` et `projects` n'a été trouvé dans le modèle inspecté.

La source de vérité publique est donc `site_realisations`; la source ERP de projets BTP est `projects`. Une synchronisation est possible via champs/flux externes, mais elle n'est pas attestée par ce contrat. Dans la DB locale lue : 5 réalisations et 5 avec `publier_vitrine=true`.

## I. Contrat API et sécurité

| Endpoint écrit | Authentification serveur / permission dans le routeur | Validation observée | Risque source |
|---|---|---|---|
| `POST /api/v1/site-content` | Aucune dépendance; commentaire mentionne compatibilité tests | Pydantic impose `section`, `key`, `value` chaîne nullable | **P1** : écriture de contenu public sans auth |
| `PATCH /api/v1/site-content/{content_id}` | Aucune dépendance | Même schéma; pas de statut/validation métier | **P1** : écriture libre sans auth; route attend aussi un `id` DB |
| `DELETE /api/v1/site-content/{content_id}` | Aucune dépendance | Pas de validation métier | **P1** : suppression sans auth |
| `POST/PATCH/DELETE /api/v1/page-layouts...` | Upsert/publication exigent utilisateur `admin` | Pydantic structure de base, pas validation du type/props des sections | Auth correcte dans ces handlers; validation CMS superficielle |
| `POST/PATCH/DELETE /api/v1/site/realisations...` | Handler exige `admin` | Modèles Pydantic dédiés | Contrat dédié protégé |
| `POST/PATCH/DELETE /api/v1/site/vitrine-lots...` | Handler exige `admin` | Modèles Pydantic dédiés | Contrat dédié protégé |
| `POST/PATCH/DELETE /api/v1/tables/{table}` | **Aucune auth/dépendance d'utilisateur** | Allowlist/config de colonnes et validation repository, variable selon table | **P0 candidat** : écriture générique anonyme de tables ERP/vitrine accessibles par cette API |
| `POST /api/v1/media`, `PATCH/DELETE /{id}`, restore/purge/replace, usage et audit write | Plusieurs handlers sans auth; upload/delete/replace n'ont qu'un utilisateur optionnel | Contrôle de fichier et métadonnées présent à certains endroits | **P0/P1 candidat** : mutation de médias et relations sans auth dans le routeur |

Le frontend Site Editor utilise de fait `/tables/site_realisations`, `/tables/vitrine_lots` et `/tables/contact_messages` pour certains CRUD; il n'utilise donc pas toujours les handlers dédiés protégés `/site/...`. La protection `adminOnly` de la navigation n'est pas une protection serveur. Les formulaires publics utilisent aussi `/tables` pour les écritures, ce qui explique vraisemblablement l'ouverture historique de cette API mais ne justifie pas l'exposition d'opérations génériques de modification/suppression.

La production API n'a pas répondu depuis cet environnement : l'hôte `api.gnambaservices.ci` a expiré après 12 secondes sur les GET lecture. L'accessibilité effective de ces routes depuis internet/proxy de production est donc **non vérifiée**; les problèmes ci-dessus sont confirmés dans le code de la branche inspectée.

## J. Contrat DB / migrations

| Objet | Modèle SQLAlchemy | Migration versionnée | API / frontend | DB locale réelle |
|---|---|---|---|---|
| `page_layouts` | `PageLayout` expose `page_key`, `page_name`, `is_active`, `layout_json`, SEO, og media, timestamps/auteurs | migration 012 crée ces colonnes, **pas** `page_slug`, `page`, `is_published`, `published_at`, `updated_by` | Router lit/écrit ces colonnes supplémentaires et utilise aussi `page_key` | Colonnes supplémentaires présentes localement; pas d'unicité sur slug/key constatée; 42 lignes dont plusieurs sans slug/key |
| `site_content` | Modèle expose section/key/value/type | migration 012 ajoute id, value_type, description, translations, timestamps, unique `(section,key)` | Router lit/écrit section/key/value et `updated_at`; patch/delete supposent `id` | DB locale contient les deux formes de colonnes; contrainte PK sur section/key et `id` nullable |
| `site_realisations` | Modèle fourni est ancien/minimal (titre, description, image_url, categorie, statut) | migration 012 crée le modèle détaillé (référence, type, photos, publier, etc.) | Router/table frontend utilisent le modèle détaillé | DB locale a les champs détaillés et colonnes historiques supplémentaires |
| `vitrine_lots` | Modèle contient propriétés ERP reliées et données vitrine | migration 012 initiale définit une forme plus courte | Router/table frontend attendent champs vitrine ajoutés | DB locale a le jeu étendu de colonnes; certains types historiques diffèrent des déclarations ORM |
| `contact_messages` | Modèle simple (nom/email/tel/sujet/message/statut) | migration 012 crée des colonnes enrichies de traitement | Formulaires/table générique utilisent aussi aliases anglais name/phone/subject | DB locale contient les deux formes et colonnes d'affectation/réponse |

La DB locale est à `027_fix_public_site_schema_drift`, alors que le répertoire versionné examiné ne contient aucun fichier portant cette révision (27 fichiers de migration y sont présents, jusqu'à 024 et deux migrations de fusion). La DB locale reflète donc un schéma postérieur ou construit autrement que la chaîne de migrations courante du checkout. `alembic_version` n'est pas une preuve que la migration manquante est reproductible depuis cette branche. Il faut réconcilier la chaîne avant toute migration.

Contraintes observées localement : PK sur layouts, site_content, réalisations, lots et messages; FK lots vitrine → lots fonciers/propriétés. Pas de FK/unique sur layouts page slug/key constatée; pas de FK `site_realisations` → projets ERP constatée. `media_usage.media_id` FK vers `media_files` est présent.

## K. Contrat de publication

Le seul véritable état de publication de layout observé est booléen `is_published`, et une date `published_at` utilisée par le handler de publication (colonne text dans la DB locale). L'auteur de création/modification est stocké pour layout dans le schéma local. Pas d'état d'archivage, d'historique de versions, de workflow de validation ni de rollback repéré. `site_content` n'a ni publication ni auteur. Les réalisations et lots ont leurs propres booléens (`publier_vitrine`, `publier_sur_vitrine`), sans historique éditorial démontré.

## L. Production et sitemap

Observations HTTP read-only le 2026-09-23 : `https://gnambaservices.ci/` renvoie 200 et un shell HTML React (`#root` vide, script JS chargé côté client). Le sitemap public renvoie ces 7 URL : `/`, `/about`, `/services`, `/realisations`, `/contact`, `/login`, `/verification-attestation`.

| Route | Code canonique | Sitemap | HTTP direct observé | Canonical runtime du code | État |
|---|---|---|---:|---|---|
| `/` | `/` | Oui | 200 | `/` | Correspond |
| `/a-propos` | `/a-propos` | Non | 200 | `/a-propos` | Omission sitemap |
| `/about` | alias de `/a-propos` | Oui | 200 | JS remplace l'URL par `/a-propos` | Sitemap référence l'alias, pas le canonique |
| `/services` | `/services` | Oui | 200 | `/services` | Correspond |
| `/immobilier` | `/immobilier` | Non | 200 observé partiellement | `/immobilier` | Omission sitemap |
| `/foncier` | `/foncier` | Non | 200 | `/foncier` | Omission sitemap; shell SPA |
| `/lotissement` | `/lotissement` | Non | 200 | `/lotissement` | Omission sitemap; shell SPA |
| `/btp-construction` | `/btp-construction` | Non | 200 | `/btp-construction` | Omission sitemap; shell SPA |
| `/realisations` | `/realisations` | Oui | 200 | `/realisations` | Correspond |
| `/temoignages` | `/temoignages` | Non | 200 | `/temoignages` | Omission sitemap; shell SPA |
| `/blog` | `/blog` | Non | 200 | `/blog` | Omission sitemap; shell SPA |
| `/contact` | `/contact` | Oui | 200 | `/contact` | Correspond |
| `/faq` | `/faq` | Non | 200 | `/faq` | Omission sitemap; shell SPA |
| `/mentions-legales` | `/mentions-legales` | Non | Non terminé | `/mentions-legales` | Omission sitemap |
| `/login` | `/login` | Oui | 200 | `noindex`; canonical `/login` | Présente malgré page noindex |
| `/verification-attestation` | `/verification-attestation` | Oui | 200 | `noindex`; canonical route de vérification | Présente malgré page noindex |
| `/lots-disponibles` | `/lots-disponibles` | Non | Non terminé | `/lots-disponibles` | Omission sitemap |

Les requêtes HTTP de `/`, `/a-propos`, `/about`, `/services`, `/immobilier`, `/foncier`, `/lotissement`, `/btp-construction`, `/realisations`, `/temoignages`, `/blog`, `/contact` et `/faq` ont répondu 200 avec le shell SPA. Les autres essais ont expiré sans réponse et sont non vérifiés, pas des 404 constatées. Aucun redirect HTTP serveur n'a été observé entre `/about` et `/a-propos`; le code client canonicalise l'alias via l'historique navigateur après exécution JS. Pas de navigateur automatisé disponible ici : console, rendu DOM, chargements d'images et métadonnées exécutées n'ont pas été validés. L'API prod expirant, les layouts et données réellement servis en production ne sont pas vérifiés.

## M. Contrat API réel

| Parcours | URL / méthode | Payload / réponse | Service et source |
|---|---|---|---|
| Pages publiques | `GET /page-layouts/{slug}` | Retour `page_slug`, `layout_json`, `is_published`, SEO/OG | SQL direct dans `page_layouts`; erreur/absence conduit au composant classique après réponse |
| Édition layout | `POST /page-layouts` | `PageLayoutRow` JSON; insert/update, réponse même schéma | SQL direct; admin requis |
| Publication layout | `PATCH /page-layouts/{slug}/publish` | Réponse `PageLayoutRow` | Met `is_published=true`, date/auteur; admin requis |
| Texte CMS | `GET /site-content`, `/site-content/{section}` | Liste de section/key/value | SQL direct; toute erreur sur liste globale est avalée et rend `[]` |
| Écriture texte CMS | `POST`, `PATCH`, `DELETE /site-content...` | Écrit/supprime une clé | SQL direct; aucune dépendance utilisateur dans ces handlers |
| Public lots/réalisations | `GET /tables/vitrine_lots`, `GET /tables/site_realisations` | Liste filtrée côté client ou paramètre égalité | Repository générique et tables locales |
| CRUD Site Editor | `POST/PATCH/DELETE /tables/{table}` | Payload/table row | Repository générique allowlist; aucun contrôle utilisateur dans les handlers |
| API dédiée métier | `/site/realisations`, `/site/vitrine-lots` | Modèles détaillés | SQL direct; write protégé admin; handlers GET retournent actuellement les lignes sans filtrer eux-mêmes les indicateurs de publication |
| Media | `/media` et routes d'usage/version | `MediaResponse`, URL public + métadonnées | MediaService → repository SQLAlchemy → storage provider; plusieurs écritures sans auth serveur |

Incohérences notables : Site Editor utilise les endpoints génériques `/tables` pour opérations de données vitrine même si des endpoints dédiés et protégés existent; schemas SQLAlchemy, migration historique et modèle Pydantic/API ne forment pas un seul contrat; API `site-content` avale certaines erreurs de lecture; publication UI dépend d'un chemin `/page-layouts` dont le schéma ne peut pas être produit par migration 012 seule.

## N. Architecture cible

| Couche cible | Responsabilité / source de vérité | API et permission | Fallback / validation requise |
|---|---|---|---|
| Routes | Chemins publics canoniques dans le code | Aucune édition CMS; accès public | 404 explicite ou alias canonique; tests routes + sitemap |
| Pages | Hiérarchie, ordre et comportements dans le code | Aucune mutation CMS de structure | Page classique toujours rendue; E2E page réelle |
| Sections | Composants typés connus du code | Props éditoriales validées; endpoints CMS admin | Validation server + runtime; erreur section isolée et journalisée |
| Contenu CMS | Textes, CTA, champs éditoriaux et SEO par page/section avec brouillon/publication contrôlée | API publique read-only publiée; écritures admin uniquement | Valeurs par défaut de code; tests publication/reload/rollback |
| Données ERP | Immobilier/Foncier/Projets propriétaires de leurs entités | Projection API publique dédiée et filtrée; écriture métier dans module propriétaire | État vide/indisponibilité explicite; aucun duplicata éditable silencieusement |
| Media | Fichiers, variantes, alt/metadata, URL et références d'usage centralisés | Lecture publique des assets publiés; mutation administrateur | Image placeholder/alt; vérification URL, type, taille, usage et effacement |
| Publication | État, date/auteur et historique versionné pour contenu éditorial | Permission contrôlée côté serveur, audit log | Dépublication/rollback définis, avec smoke public après publication |

## O. Options de migration Page Builder

| Option | Avantages | Inconvénients / risques | Effort et impact |
|---|---|---|---|
| A — conserver comme système principal | Utilise vite les fonctions déjà en place; structure modifiable sans déploiement | Contredit l'objectif de structure détenue par le code; validation, dépublication, sécurité et versionnage manquants; Layout peut effacer une page métier en publiant 1 section | Court terme faible, risque production/UX élevé; backend + éditeur + SEO restent à fiabiliser |
| B — adapter en contenu de sections fixes | Réutilise types, preview, données et contenus; aligne structure code / valeurs CMS | Il faut mapper des champs pour chaque composant et migrer le JSON existant; édition de l'ordre/ajout/suppression doit disparaître | Moyen; impact frontend/admin/API et tests, pas besoin de supprimer tables immédiatement |
| C — retirer progressivement et migrer vers pages codées | Contrat final le plus simple et hiérarchie explicite | Perte d'outillage/édition et migration manuelle de layouts en cours; risque de retirer un contenu réellement publié | Moyen à élevé; nécessite comparaison layout par layout et période de fallback |
| D — hybride | Possible pour cas métier distincts | Maintient deux chemins concurrents et rend contrat, SEO et support plus complexes | Variable; à réserver à un besoin concret d'exception, non attesté par l'audit |

### Besoin métier de modifier la structure ?

Pour les cinq clés `accueil`, `about`, `services`, `realisations`, `contact`, l'audit du dépôt ne montre pas de besoin métier exprimé qui justifie le pouvoir de retirer/ordonner librement des sections. Elles possèdent déjà des pages classiques et des structures dédiées. Le Builder stocke en outre des templates prédéfinis qui reflètent ces mêmes pages. Il n'y a donc pas de preuve métier en faveur de structure modifiable. Les données locales montrent néanmoins des layouts publiés, donc leur contenu doit être relevé/migré avant toute neutralisation.

## P. Décision recommandée

**Option B — adapter Page Builder en éditeur de contenus de sections fixes, avec migration progressive des valeurs/layouts réellement utilisés.** C'est l'option la moins risquée qui converge vers la cible, conserve l'investissement existant et évite une suppression immédiate. Le Builder ne devrait plus déterminer les types, le nombre ou l'ordre de sections d'une page; il peut devenir un éditeur de champs CMS par clé de page/section. Une suppression complète ne se justifie qu'après inventaire et reprise de chaque layout en production.

Les valeurs Page Builder actuelles (5 clés) doivent être exportées et comparées à leurs pages classiques. Les layouts locaux d'accueil/about/services/contact actuellement publiés ne prouvent pas qu'ils sont ceux de la production. Ne pas basculer les pages publiques avant consultation DB prod, sécurisation API, validation du fallback et tests navigateur.

## Q. Risques et suites nécessaires

1. **P0 candidat — intégrité/sécurité API** : les endpoints génériques `/tables` autorisent create/update/delete sans dépendance d'authentification et couvrent des tables ERP; endpoints CMS et plusieurs Media write ont aussi des mutations sans auth. Reachability prod non vérifiée à cause du timeout API.
2. **P1 — migrations non reproductibles depuis ce checkout** : PostgreSQL local est en révision `027_fix_public_site_schema_drift`, révision absente des migrations versionnées; les migrations inspectées s'arrêtent à 024 + fusion. Ne pas lancer Alembic avant réconciliation de la chaîne.
3. **P1 — layout destructurant** : un layout publié non vide remplace toute page classique, y compris si une section métier importante a été omise.
4. **P1 — doublons layouts** : DB locale contient 42 lignes layout, clés vides/alias et répétitions accueil; listing API prend la ligne la plus récente par clé coalescée, mais pas de contrainte d'unicité locale.
5. **P2 — SEO/sitemap** : sitemap référence `/about` alias, omissionne les pages publiques déclarées, et inclut deux routes `noindex`; HTML production est un shell client-only.
6. **P2 — propriétaires de données ambigus** : `vitrine_lots` hybride avec liens facultatifs et valeurs propres; réalisations séparées des `projects` ERP.
7. **P2 — média non relié** : image URL dans props JSON, usage Media optionnel, SEO runtime ignore SEO/OG du layout.
8. Risque de régression général **élevé** tant que prod API/DB et les layouts effectivement en ligne ne sont pas inspectés et que les endpoints anonymes ne sont pas maîtrisés.

## R. Preuves et limites

- État Git avant rapport : modifications préexistantes hors Site vitrine dans `.codex/context/server-context.json`, `backend/app/core/config.py`, tests Foncier, hooks et impression; `AUDIT_FONCIER_INTERACTIONS_REPORT.md` non suivi. Aucun de ces fichiers n'a été modifié.
- PostgreSQL local confirmé (`egs_local`, port 5433, rôle de lecture `postgres`) et interrogé dans transactions `BEGIN READ ONLY ... ROLLBACK`; pas de migration lancée.
- La DB de production n'est pas vérifiée : l'hôte API a expiré pour trois GET de lecture. La production web publique a répondu pour les routes testées, mais un 200 sur un shell SPA ne prouve pas que React, API ou contenus fonctionnent.
- Pas d'outil navigateur disponible dans cette session; pas de console JS, DOM rendu, interaction, appel réseau client, responsive ou image vérifiés.
- Aucun test de code n'a été lancé dans cette phase.

### Fichiers principaux examinés

- Frontend : `src/App.tsx`, `src/lib/publicRoutes.ts`, `src/context/SiteContentContext.tsx`, `src/components/page-builder/{types,PageBuilder,PropertiesPanel}.tsx`, `src/components/public/{PublicLayout,PublicPageLayoutRenderer}.tsx`, pages `src/pages/public/*`, `src/pages/admin/SiteEditor.tsx`, `src/data/tableClient.ts`.
- Backend : `backend/app/api/v1/{site_content,page_layouts,site,tables,media}/router.py`, `backend/app/models/public_site.py`, `backend/app/models/media.py`, `backend/app/services/storage_provider.py`, `backend/app/infrastructure/sqlalchemy_media_repository.py`, `backend/alembic/versions/012_public_site_tables.py`.
- Production read-only : `https://gnambaservices.ci/`, `/sitemap.xml`, `/about`, `/a-propos`, `/services`, `/realisations`, `/contact`; API `https://api.gnambaservices.ci/api/v1/...` a expiré.
