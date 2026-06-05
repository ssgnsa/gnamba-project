# EGS WOPI Gateway

Cette application fournit un point d'accès WOPI simplifié pour l'ERP EGS.

## Endpoints principaux

- `GET /wopi/files/:fileId` — CheckFileInfo
- `GET /wopi/files/:fileId/contents` — GetFile
- `PUT /wopi/files/:fileId/contents` — PutFile
- `POST /wopi/files/:fileId/lock` — Lock
- `POST /wopi/files/:fileId/unlock` — Unlock
- `POST /wopi/files/:fileId/refreshLock` — RefreshLock
- `GET /wopi/files/:fileId/lock` — GetLock

## Configuration

Variables d'environnement recommandées :

- `WOPI_JWT_SECRET` — secret JWT partagé pour authentifier les clients WOPI
- `WOPI_API_KEY` — clé API pour autoriser la génération de liens WOPI depuis l'ERP
- `WOPI_DOC_ROOT` — chemin local du dépôt documentaire (ex: `/srv/egs-docs`)
- `WOPI_BASE_URL` — URL publique du gateway WOPI
- `COLLABORA_URL` — URL publique de Collabora Online

## Déploiement Docker

Le service est construit depuis `wopi-gateway/Dockerfile`.

### Exemple de requête WOPI JWT

```bash
curl -H "Authorization: Bearer <token>" https://wopi.gnambaservices.ci/wopi/files/<fileId>
```

### Génération d'un token WOPI

```bash
curl -X POST "https://wopi.gnambaservices.ci/wopi/files/<fileId>/token" \
  -H "x-wopi-api-key: change-me-strong-api-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","name":"Jean Dupont"}'
```

### Création d'un URL d'édition Collabora

```bash
curl "https://wopi.gnambaservices.ci/wopi/files/<fileId>/open?userId=user-123&name=Jean%20Dupont" \
  -H "x-wopi-api-key: change-me-strong-api-key"
```

### Format `fileId`

Le `fileId` est un encodage Base64 du chemin relatif dans le dépôt documentaire.
Exemple : `docs/contrat.docx` → `ZG9jcy9jb250cmF0LmRvY3g=`.
