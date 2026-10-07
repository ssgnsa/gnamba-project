---
document: TECHNICAL_DEBT_REGISTER.md
phase: "0"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - git status --short
  - docker ps -a
  - supabase/config.toml
  - ~/.cloudflared/config.yml
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Technical Debt Register

## Dette à réduire

| ID | Dette | Impact | Priorité | Remédiation |
| --- | --- | --- | --- | --- |
| `TD-001` | `egs-web.service` est un wrapper systemd très minimal et `active (exited)` | Moyen | Haute | Le remplacer par une unité plus claire ou un gestionnaire de service plus explicite |
| `TD-002` | Plusieurs chemins de déploiement coexistent dans le dépôt | Moyen | Haute | Réduire à une chaîne de build / run de production unique |
| `TD-003` | `egs-kong` reste présent alors que la cible ne le mentionne pas explicitement | Moyen | Moyenne | Confirmer son usage métier puis décider de le conserver ou non |
| `TD-004` | `edge_runtime` peut rester ambigu si aucune fonction locale n’est appelée | Moyen | Moyenne | Décider explicitement si les fonctions Supabase locales restent dans le périmètre |
| `TD-005` | Les métriques de temps de réponse métier ne sont pas encore automatisées | Faible | Moyenne | Ajouter un smoke test / benchmark simple |
| `TD-006` | La trace `backups/somagro` existe encore comme archive historique | Faible | Basse | Conserver en archive, mais la documenter comme non-cible |

## Lecture

La dette technique restante n’est pas bloquante. Elle devient bloquante seulement si elle remet en cause la lisibilité du runbook ou la capacité d’un seul opérateur à dépanner sans hésitation.
