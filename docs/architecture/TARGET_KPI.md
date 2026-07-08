---
document: TARGET_KPI.md
phase: "0ter"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docker ps -a
  - df -h /
  - free -h
  - curl http://localhost
  - supabase status
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Target KPI

## KPI système

| Indicateur | Observé | Cible | Commentaire |
| --- | --- | --- | --- |
| Conteneurs actifs | 11 | `<= 12` | Bon niveau, mais à surveiller |
| Instances PostgreSQL | 1 | `= 1` | Conforme |
| Occupation disque | `69%` | `<= 80%` | Conforme |
| RAM utilisée | `4.2 GiB / 7.7 GiB` | `<= 6 GiB` en usage normal | Acceptable pour le moment |
| Services orphelins / morts | 0 confirmés côté SOMAGRO | `= 0` | Nettoyage encore à documenter |
| Temps réponse page d’accueil | `200 OK` | `<= 2.5 s` | Mesure fine à automatiser |
| Systèmes d’auth distincts | 1 | `= 1` | Supabase Auth doit rester l’unique système |
| `docker-compose.yml` de production | 1 cible | `= 1` | Réduction attendue des variantes de déploiement |
| Workflow métier 1 | non mesuré | `<= 30 s` | Mesure à ajouter |
| Workflow métier 2 | non mesuré | `<= 45 s` | Mesure à ajouter |
| Workflow métier 3 | non mesuré | `<= 15 s` | Mesure à ajouter |

## Seuils d’alerte

- Avertir si CPU > 80%, RAM > 85%, disque > 85%
- Intervenir sous 48h si CPU > 90%, RAM > 93%, disque > 92%
- Stopper si disque > 97% ou si `program_health_score < 50`

## Priorité

Les KPI les plus utiles dans l’immédiat sont le nombre de conteneurs actifs, l’occupation disque, le temps de réponse de la page d’accueil et le niveau de complexité de la chaîne d’entrée.
