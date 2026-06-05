# Standalone Deployment Guide

## Overview

The standalone deployment is a **single-service, production-ready container** that can run independently without external dependencies like `filebrowser`. This is ideal for:

- 🚀 Production deployments
- 🐳 Cloud platforms (AWS ECS, Azure Container Instances, etc.)
- 📦 CI/CD pipelines
- 🌐 Static hosting scenarios

## Architecture

```
┌─────────────────────────────┐
│   egs-frontend:standalone   │
├─────────────────────────────┤
│  Dockerfile.standalone      │  1. Build React app with Vite
│  ↓                          │  2. Package into minimal nginx:alpine
│  nginx:alpine               │  3. Serve SPA with proper routing
│  (1.29.7)                   │  4. Security headers included
└─────────────────────────────┘
         Port 8080 (default)
```

## Configuration

### 1. Environment File (`.env.standalone`)

```bash
VITE_SUPABASE_MODE=cloud
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Switch Supabase environments:**

```bash
# Cloud (production)
VITE_SUPABASE_MODE=cloud
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Local development
VITE_SUPABASE_MODE=local
VITE_SUPABASE_LOCAL_URL=http://localhost:54321
VITE_SUPABASE_LOCAL_ANON_KEY=your_local_anon_key
```

### 2. Nginx Configuration

**File:** `nginx-standalone.conf`

Key features:
- ✅ SPA routing (fallback to `/index.html`)
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Gzip compression
- ✅ Cache optimization
- ✅ No external proxies (filebrowser, etc.)

## Building

### Quick Build

```bash
# Using provided script
./build-standalone.sh
```

### Manual Build

```bash
docker build \
  -f Dockerfile.standalone \
  --build-arg VITE_SUPABASE_MODE=cloud \
  --build-arg VITE_SUPABASE_URL=https://... \
  --build-arg VITE_SUPABASE_ANON_KEY=... \
  -t egs-frontend:standalone .
```

### With Docker Compose

```bash
docker-compose -f docker-compose.standalone.yml build egs-frontend-standalone
```

## Running

### Local Development

```bash
# Start container (port 8080)
docker-compose -f docker-compose.standalone.yml up egs-frontend-standalone

# Access: http://localhost:8080
```

### Production (Cloud)

```bash
# Run with standard port 80
docker run -d \
  -p 80:80 \
  --name egs-frontend \
  egs-frontend:standalone

# Or with custom port
docker run -d \
  -p 3000:80 \
  --name egs-frontend \
  egs-frontend:standalone
```

### Docker Compose (Any Port)

Edit `docker-compose.standalone.yml`:

```yaml
ports:
  - "3000:80"  # External:Internal
```

Then:

```bash
docker-compose -f docker-compose.standalone.yml up -d
```

## Image Details

### Image Specifications

- **Base Image:** `nginx:alpine@sha256:e7257f1ef28ba17cf7c248cb8ccf6f0c6e0228ab9c315c152f9c203cd34cf6d1`
- **Size:** ~95 MB
- **Node Base:** `node:20-alpine` (build stage only)
- **Health Check:** `GET /` every 30 seconds

### Files in Image

```
/usr/share/nginx/html/
├── index.html          (SPA root)
├── manifest.json       (PWA manifest)
├── assets/
│   ├── *.js           (48 total files)
│   └── *.css          (built by Vite)
└── [other static files]
```

## Troubleshooting

### Blank Page

**Symptoms:** HTTP 200 but page shows blank

**Solutions:**

1. Check browser console for JavaScript errors
2. Verify Supabase credentials in build args
3. Check nginx logs: `docker logs egs-frontend-standalone`
4. Verify assets load: `curl http://localhost:8080/assets/`

### Connection Refused

**Symptoms:** Cannot connect to container

**Solutions:**

1. Check if container is running: `docker ps | grep egs-frontend`
2. Verify port mapping: `docker port egs-frontend-standalone`
3. Check firewall rules
4. Verify port is not already in use: `lsof -i :8080`

### Supabase Connection Issues

**Symptoms:** App loads but auth fails, data doesn't sync

**Solutions:**

1. Verify credentials in `.env.standalone`
2. Check CORS settings in Supabase dashboard
3. Ensure Supabase URL is accessible
4. Check browser network tab for auth failures

## Production Deployment

### AWS ECS Example

```json
{
  "image": "my-registry/egs-frontend:standalone",
  "portMappings": [
    {
      "containerPort": 80,
      "hostPort": 80
    }
  ],
  "environment": [
    {
      "name": "VITE_SUPABASE_MODE",
      "value": "cloud"
    }
  ],
  "healthCheck": {
    "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1"],
    "interval": 30,
    "timeout": 3,
    "retries": 3,
    "startPeriod": 5
  }
}
```

### Docker Registry

```bash
# Tag image
docker tag egs-frontend:standalone my-registry/egs-frontend:latest
docker tag egs-frontend:standalone my-registry/egs-frontend:$(date +%Y%m%d)

# Push
docker push my-registry/egs-frontend:latest
```

## Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile.standalone` | Production Dockerfile |
| `docker-compose.standalone.yml` | Docker Compose for local testing |
| `nginx-standalone.conf` | Nginx configuration (no filebrowser proxy) |
| `.env.standalone` | Build environment variables |
| `build-standalone.sh` | Build automation script |

## Comparison: Standard vs Standalone

| Feature | Standard | Standalone |
|---------|----------|-----------|
| Filebrowser proxy | ✅ Yes | ❌ No |
| SPA routing | ✅ Yes | ✅ Yes |
| Multi-service | ✅ Yes | ❌ No |
| Single container | ❌ No | ✅ Yes |
| Production ready | ⚠️ Partial | ✅ Yes |
| Size | ~95 MB | ~95 MB |
| Build time | ~30s | ~30s |

## FAQ

**Q: Can I use standalone in development?**
A: Yes! Use `docker-compose.standalone.yml` with port 8080.

**Q: How do I change the port?**
A: Edit the port mapping in `docker-compose.standalone.yml` or use `docker run -p PORT:80`.

**Q: Does standalone support HTTPS?**
A: The container runs HTTP only. Use a reverse proxy (nginx, HAProxy, AWS ALB, etc.) for HTTPS.

**Q: Can I add more services?**
A: Use `docker-compose.yml` (standard) instead. Standalone is intentionally minimal.

**Q: What about environment variables?**
A: Pass build args during build: `--build-arg VAR=value`.

## Next Steps

1. ✅ Build the image
2. ✅ Test locally on port 8080
3. ✅ Push to your registry
4. ✅ Deploy to cloud platform
5. ✅ Configure HTTPS with reverse proxy
6. ✅ Set up monitoring/logging

---

**Last Updated:** 2026-06-02
**Version:** 1.0.0
