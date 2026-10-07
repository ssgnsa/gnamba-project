# Lot 1 - Decisions a prendre avant les lots suivants

Date: 2026-07-06
Statut: pre-decision, aucune suppression autorisee

## Objectif

Ce document liste les arbitrages necessaires avant de lancer les Lots 2 a 6. Il ne valide aucune suppression et ne remplace pas les audits detaillees prevus.

## Decisions bloquantes

### D1 - Compose officiel cible

Question:

Quel fichier Docker Compose doit devenir la source de verite de production locale?

Options observees:

- `docker-compose.selfhosted.yml`
- `docker-compose.prod.secure.yml`
- nouveau Compose consolide derive des deux

Recommendation Lot 1:

- partir d'un Compose consolide inspire de `docker-compose.selfhosted.yml` pour le coeur local;
- reintegrer uniquement les hardenings utiles de `docker-compose.prod.secure.yml`;
- garder Filebrowser/WOPI/n8n/monitoring en profils optionnels.

Decision requise avant:

- Lot 5, architecture auto-hebergee;
- Lot 6, nettoyage des Compose redondants.

### D2 - Gouvernance des migrations

Question:

Alembic devient-il officiellement la seule source de verite schema?

Constat:

- `backend/alembic` est la cible ADR;
- `supabase/migrations` contient l'historique schema le plus riche;
- certains Compose prod initialisent PostgreSQL depuis les migrations Supabase.

Recommendation Lot 1:

- declarer Alembic comme gouvernance cible;
- traiter `supabase/migrations` comme source historique a migrer/figer;
- interdire tout nouveau schema metier hors Alembic apres validation.

Decision requise avant:

- Lot 2, inventaire Supabase;
- Lot 5, migration architecture;
- Lot 6, nettoyage migrations obsoletes.

### D3 - API unique

Question:

La cible `/api/v1` est-elle exclusive pour toutes les nouvelles routes?

Constat:

- `/api/v1/*` existe;
- `/api/*` existe encore dans FastAPI;
- `nginx.conf` peut bloquer ou traiter `/api/` differemment selon le conteneur;
- des tests backend couvrent encore `/api/auth`, `/api/users`, `/api/media`.

Recommendation Lot 1:

- confirmer `/api/v1` comme seule API cible;
- conserver temporairement les routes legacy uniquement comme compatibilite documentee;
- ne plus ajouter de route non versionnee.

Decision requise avant:

- Lot 3.

### D4 - Stockage documentaire cible

Question:

MinIO remplace-t-il Filebrowser pour les medias/documents applicatifs?

Constat:

- ADR 0001 cible MinIO;
- Filebrowser est deja integre dans le frontend et les Compose;
- backend storage actuel utilise un provider local fichier;
- aucun client S3/MinIO n'est declare dans `backend/requirements.txt`.

Recommendation Lot 1:

- MinIO pour stockage applicatif versionne;
- Filebrowser uniquement comme interface documentaire optionnelle ou partage administrateur;
- WOPI/Collabora optionnel sur documents geres, pas source primaire de stockage.

Decision requise avant:

- Lot 5;
- Lot 6.

### D5 - Proxy officiel

Question:

Nginx ou Traefik devient-il le reverse proxy officiel?

Constat:

- Nginx est present dans Dockerfiles et Compose prod;
- Traefik existe dans `docker-compose.https.yml`;
- Kong existe comme gateway legacy;
- Cloudflared est optionnel.

Recommendation Lot 1:

- retenir Nginx comme proxy officiel court terme, car il est deja integre aux images frontend et aux Compose prod;
- isoler Traefik comme variante experimentale;
- qualifier Kong au Lot 2/3 avant retrait.

Decision requise avant:

- Lot 5;
- Lot 6.

### D6 - Services optionnels en production

Question:

Quels services font partie du coeur obligatoire?

Recommendation Lot 1:

Coeur obligatoire:

- frontend React/Nginx;
- backend FastAPI;
- PostgreSQL;
- Alembic;
- Redis si sessions/cache/workers actives;
- MinIO quand provider implemente;
- Nginx reverse proxy.

Optionnels/profils:

- Ollama;
- Filebrowser;
- WOPI Gateway;
- Collabora;
- n8n;
- Samba;
- Uptime Kuma;
- Watchtower;
- Cloudflared.

Decision requise avant:

- Lot 5.

### D7 - CI/CD cible

Question:

Le pipeline doit-il construire et tester frontend + backend + Compose local?

Constat:

- workflows actuels construisent surtout le frontend;
- un workflow de deploy Supabase Edge Functions existe encore;
- backend FastAPI n'est pas encore premier citoyen CI/CD.

Recommendation Lot 1:

- pipeline cible: lint/typecheck/test frontend, tests backend, validation Alembic, build images frontend/backend, validation Compose officiel;
- workflow Edge Functions a figer puis retirer seulement apres Lot 2 et validation de remplacement.

Decision requise avant:

- Lot 5.

## Decisions non bloquantes mais importantes

| Decision | Pourquoi | Lot concerne |
|---|---|---|
| Conserver ou retirer `dockerode`, `ws`, `commander` | Lies aux scripts Codex/ops, pas au coeur ERP | Lot 4/6 |
| Conserver Sentry/OneSignal/Turnstile | Services externes contraires au strict local si actives | Lot 2/5 |
| Conserver n8n | Workflows utiles mais augmente surface infra | Lot 5 |
| Conserver WOPI/Collabora | Utile documents Office, lourd en production | Lot 5 |
| Normaliser les docs | Nombreuses docs avec statuts/dates divergents | Lot 6 |
| Retirer scripts Supabase | Necessite inventaire et remplacement | Lot 2/6 |

## Ordre de decision recommande

1. Confirmer `/api/v1` comme seule API cible.
2. Confirmer Alembic comme seule gouvernance schema cible.
3. Choisir le Compose officiel cible ou autoriser la creation d'un Compose consolide.
4. Trancher Nginx comme proxy officiel court terme.
5. Trancher MinIO comme stockage applicatif et Filebrowser comme optionnel.
6. Definir les services obligatoires vs profils optionnels.
7. Reviser CI/CD pour inclure backend et validation Compose.

## Garde-fous pour la suite

- Aucun fichier legacy ne doit etre supprime seulement parce qu'il est legacy.
- Toute suppression doit avoir:
  - un remplacement identifie;
  - un consommateur verifie;
  - un test de non-regression;
  - une procedure de rollback.
- Toute route non versionnee doit etre consideree comme transition.
- Toute migration Supabase doit etre consideree comme historique tant qu'elle n'a pas ete portee ou explicitement archivee.
- Toute dependance externe doit etre classee: obligatoire, optionnelle, legacy ou interdite en mode local strict.

## Feu vert propose pour Lot 2

Lot 2 peut demarrer quand les points suivants sont valides:

- `/api/v1` est confirmee comme cible exclusive;
- Alembic est confirme comme gouvernance cible;
- Supabase est confirme comme compatibilite transitoire uniquement;
- aucun nettoyage n'est autorise avant inventaire complet.
