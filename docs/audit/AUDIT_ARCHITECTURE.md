# EGS — Audit d'architecture live

**Capture :** 2026-10-07, hôte `gnamba-server`  
**Statut :** Session 1, observation en lecture seule; validation humaine requise  
**Sécurité opérationnelle :** aucune action d'arrêt/redémarrage, aucun accès aux
contenus métier ou aux valeurs de secrets.

## Résumé

Le runtime observé n'est pas la topologie Supabase documentée dans les anciens
rapports de juin. L'architecture actuellement visible est React/Vite →
FastAPI → PostgreSQL, complétée par Redis, Filebrowser, Nginx et un tunnel
Cloudflare. Le code dans le dépôt correspond globalement à cette topologie,
mais le Compose, l'image API et la base live ne sont pas entièrement alignés.

Les services `supabase_db` et `somagro-erp` cités comme critiques dans la
mission ne sont pas présents sous ces noms dans `docker ps -a`. Il ne faut pas
supposer qu'ils correspondent à `egs-postgres` ou `egs-api` sans confirmation
de l'opérateur. La matrice historique des services et la baseline du
2026-06-17 sont à considérer comme obsolètes pour l'état courant.

## Runtime observé

### Hôte

- Ubuntu 24.04.4 LTS, Linux 6.8.0-124-generic, x86-64.
- Services systemd actifs : `cloudflared`, `nginx`, `docker`, `ssh`,
  `fail2ban`, `egs-web`.
- Cloudflare Tunnel : quatre règles d'entrée observées, trois noms de site
  pointant vers le port 80 et le nom API vers le port 8000; fallback 404.
- L'état du firewall et la configuration effective SSH n'ont pas pu être
  obtenus sans privilèges administrateur.
- Host Nginx a des configurations sous `/etc/nginx/sites-available`; son
  test a émis des avertissements de noms de serveur dupliqués sur le port
  8000. Le test complet est bloqué par l'accès non-root à `/run/nginx.pid`.

### Conteneurs

| Nom | État | Fonction observée | Binding / données |
| --- | --- | --- | --- |
| `egs-web` | sain, actif | Frontend servi par Nginx dans le conteneur | `0.0.0.0:8080`, `/var/www/egs` monté en lecture seule |
| `egs-api` | sain, actif | FastAPI | `0.0.0.0:8000`, `backend/storage` monté en lecture-écriture |
| `egs-postgres` | sain, actif | PostgreSQL 16 | `0.0.0.0:5433`, volume persistant |
| `egs-redis` | actif | Redis 7 | réseau interne Docker uniquement; usage applicatif non confirmé |
| `filebrowser` | sain, actif | Gestionnaire de fichiers | `0.0.0.0:8081`, partage hôte monté en lecture-écriture |
| `egs-rc-test-pg` | arrêté | PostgreSQL de test | conteneur arrêté, non inspecté plus avant |
| `egs-api-security-test` | arrêté | image API de test | conteneur arrêté |

Totaux : 7 conteneurs (5 actifs, 2 arrêtés), 24 images, 16 volumes et
5 réseaux Docker. Docker rapporte 7.48 GiB de cache de build. Aucun nettoyage
de conteneur, volume ou image n'a été effectué.

Les images n8n et Collabora sont présentes localement, mais aucun conteneur
correspondant n'est déclaré dans `docker ps -a`. Aucun conteneur Supabase,
MinIO ou Qdrant n'est actuellement déclaré. Ollama est référencé côté frontend;
son fonctionnement runtime reste à confirmer.

## Topologie de dépendance observée

```text
Navigateur
  ├─ HTTPS → Cloudflare → cloudflared → host Nginx → egs-web
  └─ HTTPS → Cloudflare → cloudflared → FastAPI egs-api
                                      ├─ PostgreSQL egs_local
                                      ├─ stockage local backend/storage
                                      └─ Redis (dépendance à confirmer)

Administrateur → Filebrowser → /home/soma/partage
```

Le backend et PostgreSQL sont également liés à toutes les interfaces IPv4
via leurs ports publiés; cela n'établit pas que le firewall autorise leur
accès depuis Internet.

## Code et déploiement

- Frontend : React 18, TypeScript, Vite et Tailwind dans `src/`.
- Backend : Python/FastAPI, SQLAlchemy et API v1 dans `backend/app/`.
- Base : PostgreSQL; Alembic est l'outil de migrations présent.
- Le Compose racine déclare PostgreSQL, Redis, API, web et Filebrowser.
- `backend/docker-compose.yml` définit une seconde topologie différente.
- Deux Dockerfiles sont présents; les scripts de déploiement frontend et les
  scripts de migration backend ne forment pas encore une publication unique.
- Le conteneur API live est l'image mutable `egs-api:latest`; il n'expose pas
  un identifiant de release vérifiable au endpoint version.

## Écarts / points bloquants

1. Les rapports documentaires antérieurs décrivent une pile Supabase qui n'est
   plus visible dans les conteneurs actuels.
2. Une ancienne demande ciblait Flask/Jinja; la mission v4 décrit une
   harmonisation de l'EGS existant et conserve une organisation de services
   incluant Supabase. La cible architecturale finale n'est pas décidée dans
   cette session.
3. Le dépôt contient des modifications indexées/non indexées et fichiers
   non suivis préexistants. Aucun changement de ces travaux n'est inclus dans
   le présent audit.
4. La révision DB (`029_auth_password_lifecycle`) est inconnue de l'image API
   live (image limitée à la tête `028_normalize_vitrine_lots_types`); le
   contrôle Alembic live échoue.
5. La base utilise le rôle superutilisateur `postgres`; les ports DB/API et
   autres mappings actifs sont sur `0.0.0.0`.
6. `/ready` retourne 404 malgré son ajout dans le checkout local.
7. Le disque système est à 94% d'occupation.

## Méthodes / limites

Inspectés : métadonnées Docker, état systemd, sockets, métriques hôte,
Cloudflare ingress (règles seulement), Nginx (directives/erreurs seulement),
health checks HTTP GET et métadonnées PostgreSQL. Les journaux sur 7 jours
n'ont pas été lus pour éviter une exposition éventuelle de secrets. Les
services qui exigent `root`/accès aux sockets privilégiés sont à confirmer par
un opérateur habilité.
