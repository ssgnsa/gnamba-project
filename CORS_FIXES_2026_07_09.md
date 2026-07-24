# Correctifs CORS - 2026-07-09

## Problème identifié

Le navigateur bloque les requêtes CORS et les images depuis :

- `https://api.gnambaservices.ci` (requêtes DELETE media)
- `https://files.gnambaservices.ci` (images brand assets)

**Erreur en console** : `Access to fetch/image at '...' from origin 'https://gnambaservices.ci' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

## Cause racine

### 1. `api.gnambaservices.ci` - Nginx n'envoyait pas l'en-tête `Origin`

- Le serveur virtuel `api.gnambaservices.ci` manquait:
  - `proxy_set_header Origin $http_origin;`
  - Les en-têtes `add_header Access-Control-*`
- FastAPI CORS middleware ne pouvait pas valider l'Origin

### 2. `files.gnambaservices.ci` - Service n'existait pas

- Aucun bloc `server` pour `files.gnambaservices.ci` dans Nginx
- Filebrowser (port 8081) n'était pas exposé/proxié

## Correctifs appliqués

### Fichier : `nginx/nginx-release.conf`

#### 1. Ajouter upstream filebrowser

```nginx
upstream filebrowser {
    server filebrowser:80;
}
```

#### 2. Corriger bloc `api.gnambaservices.ci`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.gnambaservices.ci;

    location / {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Origin $http_origin;  # ← AJOUTÉ

        # ← SECTION AJOUTÉE : En-têtes CORS
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, PATCH, DELETE" always;
        add_header Access-Control-Allow-Headers "$http_access_control_request_headers" always;
    }
}
```

#### 3. Ajouter bloc `files.gnambaservices.ci`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name files.gnambaservices.ci;

    client_max_body_size 100M;

    location / {
        proxy_pass http://filebrowser;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Origin $http_origin;

        # Enable CORS for file serving
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, PATCH, DELETE" always;
        add_header Access-Control-Allow-Headers "$http_access_control_request_headers" always;

        # Cache static assets
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }
}
```

## Étapes de déploiement

### 1. Validation locale (Docker)

```bash
# Reconstruire l'image du frontend avec la nouvelle config Nginx
docker compose down
docker compose up -d --build
```

### 2. Vérifier que filebrowser tourne

```bash
docker ps | grep filebrowser
# Doit afficher: filebrowser ... 0.0.0.0:8081->80/tcp
```

### 3. Tests CORS (localhost)

```bash
# Test 1: API CORS
curl -I -H "Origin: http://localhost:8080" http://localhost:8000/api/v1/auth/me | grep -i access-control

# Test 2: Fichiers CORS
curl -I -H "Origin: http://localhost:8080" http://localhost:8081/egs/brand_assets/test.webp | grep -i access-control

# Résultat attendu:
# access-control-allow-origin: http://localhost:8080
# access-control-allow-credentials: true
```

### 4. Déploiement en production

```bash
# Sur le serveur de production:
cd /home/soma/gnamba-project

# Copier la nouvelle config Nginx
sudo cp nginx/nginx-release.conf /etc/nginx/sites-available/egs.conf

# Activer le site (si pas encore fait)
sudo ln -sf /etc/nginx/sites-available/egs.conf /etc/nginx/sites-enabled/egs.conf 2>/dev/null || true

# Tester la syntaxe
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Vérifier le statut
sudo systemctl status nginx
```

### 5. Tests en production

```bash
# Test CORS API
curl -I -H "Origin: https://gnambaservices.ci" https://api.gnambaservices.ci/api/v1/health | grep -i access-control

# Test CORS Fichiers
curl -I -H "Origin: https://gnambaservices.ci" "https://files.gnambaservices.ci/" | grep -i access-control

# Résultat attendu:
# access-control-allow-origin: https://gnambaservices.ci
# access-control-allow-credentials: true
```

## Vérification dans le navigateur

1. Ouvrir `https://gnambaservices.ci` dans le navigateur
2. Accéder au module Media
3. Vérifier que les images de brand assets se chargent (pas d'erreur CORS)
4. Vérifier que la suppression de média fonctionne (pas d'erreur CORS)
5. Ouvrir la console (F12) → pas d'erreurs `Access to fetch` ou `Access to image`

## Rollback (en cas de problème)

```bash
# Si Nginx ne démarre pas:
sudo systemctl status nginx
sudo nginx -t  # Pour voir les erreurs
tail -f /var/log/nginx/error.log

# Restaurer l'ancienne config:
sudo cp /etc/nginx/sites-available/egs.conf /etc/nginx/sites-available/egs.conf.broken
sudo git checkout nginx/nginx-release.conf  # ou restaurer depuis backup
sudo nginx -t
sudo systemctl reload nginx
```

## Références

- [Nginx CORS Headers](https://enable-cors.org/server_nginx.html)
- [FastAPI CORS Middleware](https://fastapi.tiangolo.com/tutorial/cors/)
- [Filebrowser Documentation](https://filebrowser.org/)

## Statut

- ✅ Problème identifié et diagnosti qué
- ✅ Correctifs appliqués à `nginx/nginx-release.conf`
- ⏳ En attente de déploiement en production et vérification
