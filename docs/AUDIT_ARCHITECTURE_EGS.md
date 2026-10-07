# Rapport d’audit architectural EGS

## 1. Inventaire Supabase

### Frontend

Les fichiers suivants utilisent directement la SDK Supabase ou ses APIs :

- src/context/AuthContext.tsx
- src/lib/supabase.ts
- src/lib/supabase.service.ts
- src/lib/supabaseConfig.ts
- src/lib/foncierOffline.ts
- src/lib/logoUtils.ts
- src/lib/mediaUtils.ts
- src/lib/bot-engine.ts
- src/lib/social-publish.ts
- src/pages/AccueilEmploye.tsx
- src/pages/CatalogueLots.tsx
- src/pages/Documents.tsx
- src/pages/Employes.tsx
- src/pages/Finances.tsx
- src/pages/Foncier.tsx
- src/pages/Fournisseurs.tsx
- src/pages/Fournitures.tsx
- src/pages/Immobilier.tsx
- src/pages/Leads.tsx
- src/pages/Media.tsx
- src/pages/Parametres.tsx
- src/pages/Projets.tsx
- src/pages/RegistreVisiteur.tsx
- src/pages/Statistiques.tsx
- src/pages/Taches.tsx
- src/pages/Utilisateurs.tsx
- src/pages/public/PublicHome.tsx
- src/pages/public/PublicLots.tsx
- src/pages/public/PublicContact.tsx
- src/pages/public/PublicRealisations.tsx
- src/pages/admin/SiteEditor.tsx
- src/components/media/MediaUploader.tsx
- src/components/media/MediaDetailModal.tsx
- src/components/NotificationButton.tsx
- src/components/foncier/WorkflowValidation.tsx
- src/components/page-builder/PageBuilder.tsx
- src/components/public/PublicPageLayoutRenderer.tsx
- src/components/public/PublicSocialWall.tsx
- src/hooks/useRealtimePayments.ts
- src/hooks/useFoncier\*.ts
- src/data/\*.repository.ts

### Backend

Aucune dépendance Python directe à Supabase n’a été détectée dans les fichiers backend actuels, mais l’architecture globale reste dépendante de la logique d’accès Supabase côté frontend et des données/logiciels déjà embarqués autour de Supabase.

### Types d’usage observés

- Auth : signIn, signOut, session, user
- DB : supabase.from(...).select/insert/update/delete/upsert
- RPC : supabase.rpc(...)
- Storage : supabase.storage.from(...)
- Edge Functions : supabase.functions.invoke(...)

---

## 2. Inventaire des endpoints et appels métier

### FastAPI existants

Routes actuellement présentes dans le backend :

- /health
- /api/auth/login
- /api/auth/me
- /api/auth/refresh
- /api/auth/logout
- /api/auth/reset-password
- /api/users
- /api/users/{user_id}
- /api/settings
- /api/site-content
- /api/media
- /api/media/{media_id}
- /api/media/usage
- /api/media/{media_id}/restore
- /api/media/{media_id}/purge
- /api/media/{media_id}/replace
- /api/v1/auth/login
- /api/v1/auth/me
- /api/v1/auth/refresh
- /api/v1/auth/logout
- /api/v1/auth/password/reset
- /api/v1/users
- /api/v1/users/{user_id}

### Appels frontend vers Supabase

Le frontend appelle massivement Supabase pour les modules suivants :

- Auth/utilisateurs
- Projets, tâches, employés, fournisseurs, produits
- Finances, immobilier, foncier, documents, médias
- Site vitrine et contact
- Leads / campagnes / interactions

### Cas critiques identifiés

- Auth hybride (frontend + local API) : source probable de sessions incohérentes.
- RPC foncier : appels de logique métier côté base via fonctions SQL.
- Edge Functions : attestations / notifications / lead capture.
- Stockage media : fichiers uploadés via Supabase Storage.

---

## 3. État de la base de données

### Présent

- Alembic présent dans [backend/alembic](backend/alembic)
- Fichier initial de migration : [backend/alembic/versions/001_initial_create_users.py](backend/alembic/versions/001_initial_create_users.py)
- Répertoires SQL additionnels : [sql](sql)

### À noter

- La base n’est pas encore gouvernée de façon unifiée autour d’un modèle DDD/SQLAlchemy cohérent.
- Des migrations SQL historiques et des scripts externes coexistent avec Alembic.

---

## 4. Matrice de migration

| Fonctionnalité actuelle | Source actuelle                                 | Cible FastAPI          | Notes                           |
| ----------------------- | ----------------------------------------------- | ---------------------- | ------------------------------- |
| Authentification        | AuthContext + Supabase auth                     | /api/v1/auth/\*        | JWT + refresh + RBAC            |
| Gestion utilisateurs    | user_profiles / Supabase                        | /api/v1/users/\*       | CRUD utilisateurs               |
| Paramètres système      | app_settings / site_content                     | /api/v1/settings/\*    | configuration centralisée       |
| Médias                  | storage + media_files                           | /api/v1/media/\*       | upload / metadonnées / versions |
| Projets                 | projects                                        | /api/v1/projects/\*    | CRUD projet                     |
| Tâches                  | tasks                                           | /api/v1/tasks/\*       | CRUD tâche                      |
| Employés                | employees                                       | /api/v1/employees/\*   | CRUD RH                         |
| Fournisseurs            | suppliers                                       | /api/v1/suppliers/\*   | CRUD fournisseurs               |
| Produits                | products                                        | /api/v1/products/\*    | CRUD produits                   |
| Finances                | finances                                        | /api/v1/finance/\*     | transactions, paiements         |
| Immobilier              | properties / lease_contracts / rent_payments    | /api/v1/real-estate/\* | biens, contrats, paiements      |
| Foncier                 | foncier_lots / attestations                     | /api/v1/foncier/\*     | lots, villages, attestations    |
| Leads                   | leads / campaigns / interactions                | /api/v1/leads/\*       | pipeline commercial             |
| Site vitrine            | page_layouts / site_content / site_realisations | /api/v1/site/\*        | contenu public                  |
| Contact public          | contact_messages                                | /api/v1/contact/\*     | formulaire de contact           |

---

## 5. Conclusion de l’audit

Le projet n’est pas en train d’être “corrigé” localement ; il est en train d’être remplacé par une architecture plus stable. La priorité absolue est de supprimer la dépendance directe au client Supabase côté frontend et de centraliser la logique métier dans FastAPI avec une base PostgreSQL unique et des migrations Alembic gouvernées.
