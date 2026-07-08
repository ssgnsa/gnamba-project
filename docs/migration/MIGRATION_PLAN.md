---
document: MIGRATION_PLAN.md
phase: "11"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - PROGRESS_STATE.json
  - docs/audit/BASELINE_STATE.md
  - docs/architecture/ARCHITECTURE_TARGET.md
  - docs/security/SECURITY_AUDIT.md
  - docs/services/SERVICE_CRITICALITY_MATRIX.md
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Migration Plan

## Note de cadrage

Le moteur de migration codé dans `src/lib/codex-assistant/migration-assistant.ts` suit 6 phases opérationnelles. Le cahier des charges documentaire ajoute des phases de cadrage (`0`, `0bis`, `0ter`, `2`, `11`) qui servent à préparer, sécuriser et valider la transformation.

## 1. Sauvegarde

### Commandes

```bash
mkdir -p backups/$(date +%Y%m%d)
cp PROGRESS_STATE.json backups/$(date +%Y%m%d)/PROGRESS_STATE.json
docker ps -a > backups/$(date +%Y%m%d)/docker-ps-a.txt
docker volume ls > backups/$(date +%Y%m%d)/docker-volumes.txt
docker network ls > backups/$(date +%Y%m%d)/docker-networks.txt
supabase status > backups/$(date +%Y%m%d)/supabase-status.txt
```

### Risque

Faible si la sauvegarde reste en lecture seule. Le risque principal est d’oublier un artefact utile au rollback.

### Rollback

Aucun rollback requis à ce stade. Conserver le point de sauvegarde comme référence.

## 2. Audit

### Commandes

```bash
docker ps -a
docker images
docker volume ls
docker network ls
systemctl --failed
systemctl --user status cloudflared
systemctl status egs-web
supabase status
~/bin/cloudflared tunnel list
ss -tulpn
curl -I http://localhost
curl -I http://REDACTED_LEGACY_HOST
curl -I https://gnambaservices.ci
curl -sS -o /dev/null -w '%{http_code}\n' https://api.gnambaservices.ci/auth/v1/health
curl -I https://api.gnambaservices.ci/rest/v1/
```

### Risque

Faible à moyen. Un scan trop agressif peut saturer la machine si on multiplie les commandes lourdes en parallèle.

### Rollback

Pas de rollback. On n’exécute pas de modification pendant l’audit.

## 3. Nettoyage profond

### Commandes

```bash
docker ps -a --filter name='somagro'
docker volume ls --format '{{.Name}}' | rg '^somagro'
docker network ls --format '{{.Name}}' | rg '^somagro'
systemctl --user list-units --all | rg 'somagro'
find /home/soma -maxdepth 3 -path '*somagro*' -o -path '*SOMAGRO*'
```

### Risque

Élevé si la cible n’est pas filtrée strictement. Le nettoyage ne doit viser que les composants `somagro*` confirmés.

### Rollback

Restaurer depuis les sauvegardes si un volume ou un artefact utile a été retiré par erreur.

## 4. Réparation Cloudflare

### Commandes

```bash
sed -n '1,220p' ~/.cloudflared/config.yml
~/bin/cloudflared tunnel list
systemctl --user restart cloudflared
systemctl --user status cloudflared --no-pager
```

### Risque

Moyen. Une mauvaise cible d’ingress ou un credentials file manquant peut casser l’accès externe.

### Rollback

Restaurer l’ancien `config.yml`, puis redémarrer `cloudflared`.

## 5. Vérification DNS

### Commandes

```bash
dig +short gnambaservices.ci
dig +short api.gnambaservices.ci
dig +short files.gnambaservices.ci
```

### Risque

Faible. Le point sensible est la confusion entre enregistrement A proxifié et CNAME visible.

### Rollback

Restaurer les enregistrements Cloudflare si un alias pointe vers la mauvaise origine.

## 6. Vérification EGS

### Commandes

```bash
curl -I http://localhost
curl -I http://REDACTED_LEGACY_HOST
curl -I https://gnambaservices.ci
```

### Risque

Moyen. Un rendu 200 peut encore masquer un problème de contenu si la SPA casse au runtime.

### Rollback

Réorienter le tunnel vers l’ancien origin ou relancer le conteneur `egs-web` si l’instance active est défaillante.

## 7. Vérification Supabase

### Commandes

```bash
supabase status
curl -sS -o /dev/null -w '%{http_code}\n' https://api.gnambaservices.ci/auth/v1/health
curl -I https://api.gnambaservices.ci/rest/v1/
```

### Risque

Moyen. La couche API reste sensible à la configuration RLS et à l’exposition des schémas.

### Rollback

Redémarrer uniquement les services nécessaires et garder la base locale intacte.

## 8. Tests locaux

### Commandes

```bash
npm run build
npm run typecheck
npm run lint
```

### Risque

Faible. Le risque est surtout de découvrir une régression déjà présente dans le code.

### Rollback

Corriger le code ou revenir au commit / état de travail précédent si un changement récent a cassé la compilation.

## 9. Tests externes

### Commandes

```bash
curl -I https://gnambaservices.ci
curl -sS -o /dev/null -w '%{http_code}\n' https://api.gnambaservices.ci/auth/v1/health
curl -I https://api.gnambaservices.ci/rest/v1/
```

### Risque

Moyen. Les tests externes dépendent du tunnel et de la DNS publique.

### Rollback

Revenir au tunnel précédent si une nouvelle configuration rend l’origine inaccessible.

## 10. Validation finale

### Commandes

```bash
git status --short
cat PROGRESS_STATE.json
```

### Risque

Faible. Cette étape sert à s’assurer que rien d’inattendu n’est resté en place.

### Rollback

Aucun, sauf si un artefact de travail doit encore être restauré.

## Conclusion

Le plan est volontairement séquentiel: sauvegarder, observer, nettoyer seulement ce qui est mort, puis valider localement et publiquement. C’est la seule façon d’avancer sans casser EGS.
