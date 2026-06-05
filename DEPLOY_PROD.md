# EGS Production Deployment Guide

## ✅ Statut Actuel (2026-06-05)

### Services Running
- **nginx-proxy**: ✅ (reverse proxy SSL)
- **egs-frontend**: ✅ (Vite React app)
- **postgres**: ✅ (database)
- **kong**: ✅ (API gateway)
- **filebrowser**: ✅ (document management)
- **egs-wopi-gateway**: ✅ (WOPI server)
- **collabora**: ✅ (LibreOffice Online)
- **n8n**: ✅ (workflow automation)
- **egs-samba**: ✅ (network share)

### HTTPS Status
- ✅ Port 443 active via nginx
- ✅ SSL certificates present
- ✅ Test: `curl -sk https://gnambaservices.ci/health` → HTTP 200

### Configuration
- ✅ `docker-compose.prod.yml` fixed (depends_on added)
- ✅ Healthchecks added for nginx, filebrowser, n8n, collabora
- ✅ GitHub Actions CI/CD workflow created

## ⚠️ Known Issues & Resolution

### 1. Supabase Cloud API (401)
**Issue**: Cloud Supabase API returns "Invalid API key"
```
GET https://thykrnoqgylrbfupophs.supabase.co/rest/v1/user_profiles
HTTP 401: Invalid API key
```

**Resolution**:
- [ ] Verify Supabase project is active at: https://app.supabase.com
- [ ] Confirm project URL and anon key in `.env`
- [ ] If project deleted, create new Supabase project and update `.env`:
  ```bash
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- [ ] Rebuild and deploy: `docker compose -f docker-compose.prod.yml up -d --build`

### 2. n8n Webhook Not Registered (404)
**Issue**: Production webhook returns 404
```
GET http://n8n:5678/webhook/{workflow-id}/gnamba-trigger
HTTP 404: The requested webhook is not registered
```

**Root Cause**: n8n requires workflow to be in "production" mode, not just `active: true` in DB

**Resolution Options**:

#### Option A: Manual UI Activation (Recommended)
1. Access n8n UI: `https://n8n.gnambaservices.ci` (admin/EgsN8nPass2026Secure)
2. Open workflow: **gnamba-trigger**
3. Edit workflow settings → Enable **Production** mode
4. Save and publish
5. Test webhook: `curl http://n8n:5678/webhook/{workflow-id}/gnamba-trigger`

#### Option B: Database Direct Edit
```bash
docker exec -it egs-n8n sqlite3 /home/node/.n8n/db/database.sqlite
-- Verify workflow published:
SELECT id, name, active FROM workflow_entity WHERE id='17defc2c-3c01-4f79-96f2-dc7a5a7d0b17';

-- Set as active + published:
UPDATE workflow_entity 
SET active=1, publish_status='published' 
WHERE id='17defc2c-3c01-4f79-96f2-dc7a5a7d0b17';
```

#### Option C: Use Activation Script (WIP)
```bash
bash scripts/activate-n8n-webhook.sh http://n8n:5678
```

## 🚀 GitHub Actions CI/CD

### Setup Required

Add GitHub Secrets (Settings → Secrets → Actions):
```
SSH_HOST          → 192.168.1.58
SSH_PORT          → 2222
SSH_USER          → soma
SSH_PRIVATE_KEY   → (your private SSH key content)
```

### Workflow
- **Trigger**: Push to `main` branch
- **Actions**:
  1. Build Docker image
  2. Push to ghcr.io
  3. SSH into remote
  4. Pull latest code
  5. Restart services: `docker compose up -d --remove-orphans`
  6. Health check: HTTPS endpoint test

### Files
- `.github/workflows/deploy-prod.yml` — Main deployment workflow

## 📋 Healthchecks

All critical services now have healthchecks:
```yaml
nginx-proxy:    wget http://localhost/health (30s interval)
filebrowser:    wget http://localhost (30s interval)
n8n:            curl http://localhost:5678/health (30s interval)
collabora:      curl http://localhost:9980/hosting/discovery (30s interval)
postgres:       pg_isready -U postgres (10s interval)
kong:           kong health (10s interval)
```

View status:
```bash
docker compose -f docker-compose.prod.yml ps
docker inspect egs-nginx-proxy | jq '.[] | {Name, State.Health}'
```

## 🔧 Maintenance Commands

### View Logs
```bash
docker logs -f egs-nginx-proxy
docker logs -f egs-frontend
docker logs -f egs-n8n
```

### Restart Service
```bash
docker compose -f docker-compose.prod.yml restart egs-frontend
```

### Full Redeployment
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

### Backup Database
```bash
docker exec egs-postgres pg_dump -U postgres postgres > backup-$(date +%Y%m%d).sql
```

## 📞 Support

For issues:
1. Check service logs: `docker logs <container>`
2. Verify network connectivity: `docker network inspect gnamba-project_egs-network`
3. Review this guide for known issues
4. Check GitHub Actions workflow runs: https://github.com/ssgnsa/gnamba-project/actions
