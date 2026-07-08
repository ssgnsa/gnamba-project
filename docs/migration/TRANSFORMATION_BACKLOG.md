---
document: TRANSFORMATION_BACKLOG.md
phase: "11"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docs/architecture/ARCHITECTURE_TARGET.md
  - docs/security/SECURITY_AUDIT.md
  - docs/audit/BASELINE_STATE.md
  - src/lib/codex-assistant/migration-assistant.ts
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# Transformation Backlog

## Priorités immédiates

| ID | Sujet | Priorité | Statut | Prochaine action |
| --- | --- | --- | --- | --- |
| `TB-001` | Verrouiller l’architecture cible sur un seul chemin Internet | Haute | En cours | Garder Cloudflare Tunnel comme entrée unique |
| `TB-002` | Clarifier le rôle de `egs-kong` | Moyenne | Ouvert | Confirmer s’il est encore utile ou simplement historique |
| `TB-003` | Élaguer les traces `somagro*` restantes | Haute | Ouvert | Nettoyer seulement après backup et filtrage strict |
| `TB-004` | Automatiser le smoke test local et externe | Haute | Ouvert | Ajouter un script simple et reproductible |
| `TB-005` | Formaliser la vérification RLS / exposition REST | Haute | Ouvert | Auditer les policies et les schémas exposés |
| `TB-006` | Réduire les variantes de déploiement de production | Moyenne | Ouvert | Converger vers une seule chaîne de déploiement |
| `TB-007` | Décider explicitement du statut d’`edge_runtime` | Moyenne | Ouvert | Garder seulement si des fonctions sont réellement utilisées |
| `TB-008` | Documenter le rollback de bout en bout | Haute | Ouvert | Lier backup, restore, tunnel, app et Supabase |

## Lecture par phase

- Phase 0: état, sauvegarde, matrice de criticité, risque
- Phase 0bis: audit sécurité et vulnérabilités
- Phase 0ter: baseline, quick wins, KPI
- Phase 2: graphe de dépendances
- Phase 11: plan de migration et backlog

## Règle pratique

Un item n’entre en exécution que s’il réduit réellement le nombre de chemins possibles pour une seule personne en situation de dépannage.
