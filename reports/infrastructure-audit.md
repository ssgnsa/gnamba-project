# Audit d'infrastructure — Rapport initial

Objectif: Inspecter la configuration Docker, réseau, proxy, Cloudflare et les headers de sécurité pour proposer des corrections afin d'obtenir une configuration cohérente et sécurisée.

Résumé exécutif

- Très bonne base: existe une configuration `docker-compose.prod.secure.yml` avec images digestées, `nginx/nginx-production.conf` durci et scripts d'installation de tunnel Cloudflare.
- Points d'amélioration prioritaires: gestion des secrets, homogénéité des réseaux/volumes, normalisation des images (éviter `:latest` en prod), vérification TLS/ALPN pour HTTP/2/3, contrôle CSP en bordure Cloudflare, verrouillage des permissions sur volumes et fichiers de credentials.

Observations et recommandations par thème

- **Docker / Docker Compose**:
  - Observations: `docker-compose.yml` (dev) expose images `:latest`; `docker-compose.prod.secure.yml` utilise des images pinées par digest et variables obligatoires référencées via `.env.server`.
  - Recommandations: Utiliser toujours des images versionnées/digestées en production; valider `docker compose config` avant déploiement; activer `no-new-privileges` et limiter `cap_add` (déjà fait sur plusieurs services); ajouter `read_only: true` pour les services statiques quand possible.

- **Réseaux Docker**:
  - Observations: `docker-compose.yml` référence un réseau externe `gnamba-network`; le compose prod définit `egs-network` bridge avec subnet 172.28.0.0/16.
  - Recommandations: Standardiser un seul réseau d'orchestration ou documenter l'interconnexion; éviter chevauchement d'adresses réseau avec infra existante; restreindre les communications inter-services via policies (utiliser `internal: true` sur réseaux non exposés) si possible.

- **Volumes**:
  - Observations: montages directs vers `/home/soma/...` dans plusieurs services (postgres data, filebrowser, file shares).
  - Risques: exposition accidentelle d'hôtes ; permissions non contrôlées.
  - Recommandations: utiliser volumes nommés gérés par Docker pour données (et bind mounts seulement quand nécessaire), fixer UID/GID appropriés, limiter l'accès au groupe utilisateur, chroot/permission tight sur dossiers contenant secrets.

- **Images**:
  - Observations: production utilise digests — bonne pratique. Dev compose et certains scripts utilisent `:latest`.
  - Recommandations: éliminer `:latest` en production; mettre en place CI qui publie et pinne digests; scanner les images (Trivy) et automatiser mise à jour des digests.

- **Variables d'environnement & secrets**:
  - Observations: plusieurs services exigent variables via `.env.server` (mention obligatoire). Le dépôt contient `.env.local.example` (dev tokens visibles, ex. Turnstile keys d'exemple).
  - Recommandations: ne jamais committer secrets réels; stocker secrets en vault / Docker secrets / environnement orchestrateur; restreindre permissions sur `.env.server` (chmod 600); documenter rotation des clés.

- **Cloudflare Tunnel & DNS**:
  - Observations: scripts `scripts/deploy-cloudflared-tunnel.sh` et `setup-cloudflare-dns.sh` présents; la stratégie par défaut semble être `tunnel` (CNAME->cfargotunnel.com).
  - Recommandations: protéger `CLOUDFLARE_API_TOKEN` et fichiers de credentials `~/.cloudflared/*.json` (600); exécuter cloudflared en tant que service systemd avec `--no-autoupdate` si nécessaire et limiter accès logs; vérifier que les enregistrements DNS ne laissent pas proxypass ouvert inutilement (orange cloud) pour services d'administration; déployer CSP et autres headers aussi au niveau Cloudflare Workers (cf. `CSP_REFERENCE.txt`) pour cohérence edge <-> origin.

- **Reverse Proxy (Nginx)**:
  - Observations: `nginx/nginx-production.conf` inclut TLS hardening, HSTS, security headers, gzip activé, rate limiting, server_tokens off. `nginx.conf` (simple) expose une CSP large incluant `static.cloudflareinsights.com` et `cdn.onesignal.com`.
  - Recommandations: valider que `ssl_protocols TLSv1.2 TLSv1.3;` et `ssl_prefer_server_ciphers on;` sont présents (si non, les ajouter); vérifier `ssl_ciphers` et utiliser la liste moderne recommandée par Mozilla; considérer activation d'OCSP stapling; activer HTTP/2 (`listen 443 ssl http2;`) si souhaité; vérifier compatibilité HTTP/3 (Nginx requires quiche or patch — si besoin, utiliser Cloudflare front pour HTTP/3 et laisser origin en HTTP/2).

- **DNS & SSL**:
  - Observations: scripts pour créer les enregistrements CNAME via tunnel; certs attendues sous `nginx/ssl`.
  - Recommandations: automatiser issuance via certbot (ACME) ou utiliser Cloudflare Origin CA certs; stocker clés privées en filesystem restreint (600); vérifier renouvellement automatique et surveillance des expirations.

- **HTTP/2 & HTTP/3**:
  - Observations: Nginx config mentionne durcissement TLS mais pas explicitement HTTP/2/3 flags dans les extraits lus.
  - Recommandations: activer `http2` sur `listen 443` (backwards compatible); pour HTTP/3, préférer Cloudflare edge (Workers) qui supporte QUIC/HTTP3 et laisse origin en HTTP/2.

- **Cache Cloudflare & Compression (Brotli/Gzip)**:
  - Observations: gzip activé (`gzip on`); Brotli non vu dans config (Alpine nginx default sans module brotli).
  - Recommandations: activer Brotli au niveau Cloudflare (plus performant) ; activer `brotli` dans nginx si module disponible ou fournir compression via build pipeline; vérifier `Vary: Accept-Encoding` header; définir politiques de cache pour assets `/assets/` (déjà mise en place) et pour HTML (no-cache).

- **Headers HTTP (CSP, CORS, HSTS, Permissions-Policy, Referrer-Policy, X-Frame-Options, COEP/COOP/CORP)**:
  - Observations: `CSP_REFERENCE.txt` et `nginx` configs contiennent CSP et autres headers. CSP inclut explicitement Cloudflare Insights et OneSignal, et un sha256 pour script inline Cloudflare. COEP/COOP/CORP: COOP set to `same-origin` in nginx; COEP commented as `unsafe-none` to avoid breaking Supabase Storage.
  - Recommandations:
    - Valider que le CSP renvoyé par l'edge Cloudflare est identique à l'origin (tester avec `curl -I`).
    - Minimiser les directives 'unsafe-inline' et 'unsafe-eval' si possible; remplacer par hash ou nonce pour scripts inline.
    - CORS: garder restrictions côté endpoints (ne pas exposer wildcard). Utiliser `Access-Control-Allow-Origin` spécifiques côté API (Kong/PostgREST).
    - HSTS: OK mais surveiller preload list implications (s'assurer que tous sous-domaines sont prêts).
    - Permissions-Policy, Referrer: bonnes valeurs par défaut; documenter exceptions si besoin.
    - COEP/COOP/CORP: si vous devez charger ressources cross-origin (Supabase Storage), `Cross-Origin-Embedder-Policy` doit rester `unsafe-none` mais documenter les risques et envisager require-corp pour ressources contrôlées uniquement.

Priorités d'implémentation (rapide)

1. Protéger secrets (.env.server, ~/.cloudflared, systemd unit) et documenter rotation.
2. Standardiser images en prod (remplacer `:latest` partout) et activer scanning d'images.
3. Remplacer bind-mounts sensibles par volumes nommés ou CIFS/SMB stricts; vérifier permissions.
4. Vérifier et activer HTTP/2 sur nginx; laisser HTTP/3 à Cloudflare edge.
5. Valider CSP sur l'edge Cloudflare (curl depuis l'extérieur) et harmoniser les worker rules (cf. `CSP_REFERENCE.txt`).

Pièces jointes utiles (dans le dépôt)

- [docker-compose.yml](docker-compose.yml)
- [docker-compose.prod.secure.yml](docker-compose.prod.secure.yml)
- [Dockerfile](Dockerfile)
- [nginx/nginx-production.conf](nginx/nginx-production.conf)
- [nginx.conf](nginx.conf)
- [.env.local.example](.env.local.example)
- [scripts/deploy-cloudflared-tunnel.sh](scripts/deploy-cloudflared-tunnel.sh)
- [scripts/setup-cloudflare-dns.sh](setup-cloudflare-dns.sh)
- [CSP_REFERENCE.txt](CSP_REFERENCE.txt)

Prochaine étape proposée

- Exécuter les vérifications suivantes (nécessite accès infra/host):
  - `docker compose -f docker-compose.prod.secure.yml config` pour valider la config produite.
  - `docker images --digests` et scanner images (Trivy).
  - `dig +short gnambaservices.ci` et `curl -I https://gnambaservices.ci/` pour valider headers CSP/ HSTS depuis edge.
  - Vérifier permissions des fichiers: `stat -c "%a %U:%G %n" .env.server ~/.cloudflared/*.json nginx/ssl/*`.

Souhaitez-vous que j'exécute les commandes de validation automatisées (si vous m'autorisez à lancer des commandes Docker / réseau sur cet hôte) ou préfèrez-vous que je génère un playbook étape-par-étape pour corriger les items ?
