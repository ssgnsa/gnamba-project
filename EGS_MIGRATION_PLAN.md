# EGS Migration Plan

## 1. État actuel

- Frontend React/Vite déployé dans Docker avec Nginx frontal.
- Backend Supabase Cloud/Local utilisé pour Auth, DB et Storage.
- FileBrowser exposé pour consultation documentaire.
- Pas de service WOPI/Collabora intégré.
- Pas de partage réseau Samba formel.
- Architecture de production non encore alignée sur l'objectif GED/Office en ligne.

## 2. État cible

- Plateforme documentaire unifiée avec :
  - `filebrowser` pour navigation et upload
  - `samba` pour partage réseau `/srv/egs-docs`
  - `wopi-gateway` pour édition Office en ligne
  - `collabora` pour rendu DOCX/XLSX/PPTX
- Accès sécurisé HTTPS sur :
  - `erp.gnambaservices.ci`
  - `api.gnambaservices.ci`
  - `docs.gnambaservices.ci`
  - `office.gnambaservices.ci`
  - `wopi.gnambaservices.ci`
- Volumes documentaires partagés entre `samba`, `filebrowser` et `wopi-gateway`.
- Sauvegarde PostgreSQL séparée et monitoring de l’infra.

## 3. Écarts

- `docker-compose.prod.yml` doit inclure les services `collabora`, `wopi-gateway`, `samba`, `n8n`.
- Le reverse proxy doit exposer `wopi.gnambaservices.ci` vers le gateway WOPI.
- L’intégration WOPI nécessite un token JWT sécurisé.
- Les URLs Office en ligne ne sont pas encore générées par l’ERP.

## 4. Actions

1. Ajouter services Docker : `samba`, `collabora/code`, `wopi-gateway`, `n8n`.
2. Mettre à jour `nginx/nginx.conf` pour exposer `wopi.gnambaservices.ci`.
3. Monter `/home/soma/partage/egs-docs` en tant que volume documentaire partagé.
4. Ajouter documentation `samba/smb.conf` et `wopi-gateway/README.md`.
5. Ajouter un script de migration `scripts/migrate-docs.sh`.
6. Valider avec `docker compose -f docker-compose.prod.yml config`.
7. Démarrer en préproduction et tester :
   - SMB share access
   - FileBrowser navigation
   - WOPI CheckFileInfo + content operations
   - Collabora browser rendering
   - n8n automation health

## 8. Migration documentaire cible

### 8.1 Arborescence canonique

- `/srv/egs-docs/Clients/`
- `/srv/egs-docs/Foncier/`
- `/srv/egs-docs/Immobilier/`
- `/srv/egs-docs/BTP/`
- `/srv/egs-docs/Finances/`
- `/srv/egs-docs/Archives/`
- `/srv/egs-docs/GED/`

### 8.2 Politique de migration

- Utiliser `rsync` avec sauvegarde intermédiaire pour préserver l’historique :
  - `scripts/migrate-docs.sh /chemin/existant /home/soma/partage/egs-docs`
- Ne pas copier les caches, les binaires ou les fichiers temporaires.
- Conserver les structures métiers lors du déplacement vers les dossiers cibles.
- Vérifier les permissions et appliquer :
  - `chmod -R 2775 /home/soma/partage/egs-docs`
  - `find /home/soma/partage/egs-docs -type f -exec chmod 664 {} +`
  - `find /home/soma/partage/egs-docs -type d -exec chmod 2775 {} +`

### 8.3 Validation de la migration

1. Vérifier l’accès SMB sur `\\<serveur>\egs-docs`.
2. Vérifier l’accès FileBrowser sur `https://docs.gnambaservices.ci`.
3. Vérifier l’ouverture de fichiers Office via `https://office.gnambaservices.ci`.
4. Comparer les rapports `rsync` et les backups générés.
5. Documenter les dossiers orphelins dans un répertoire d’archive `Archives/Orphelins/`.

## 5. Priorité

1. WOPI Gateway + Collabora (édition Office)
2. Samba share (partage réseau centralisé)
3. Reverse proxy HTTPS pour `office` et `wopi`
4. Backup et monitoring
5. Migration des documents existants vers `/srv/egs-docs`

## 6. Risques

- Risque de conflit de permission entre Samba et FileBrowser sur `/home/soma/partage`.
- Collabora peut nécessiter une configuration SSL ou un proxy complémentaire.
- WOPI JWT mal configuré empêche l’accès Office.
- Volume partagé non sauvegardé peut entraîner perte documentaire.

## 7. Planning

- Jour 1 : déploiement des services `samba`, `collabora`, `wopi-gateway` et test réseau.
- Jour 2 : validation des workflows Office et migration de documents.
- Jour 3 : finalisation du reverse proxy, tests sécurisés et stabilisation.
- Jour 4 : mise en production et documentation opérationnelle.
