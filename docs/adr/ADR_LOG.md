---
document: ADR_LOG.md
phase: "0"
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: validated
inputs_used:
  - docs/architecture/ARCHITECTURE_TARGET.md
  - docs/services/SERVICE_CRITICALITY_MATRIX.md
  - docs/security/SECURITY_AUDIT.md
  - ~/.cloudflared/config.yml
absent_services:
  - supabase_imgproxy_gnamba-project
  - supabase_pg_meta_gnamba-project
  - supabase_pooler_gnamba-project
  - supabase_studio_gnamba-project
  - supabase_analytics_gnamba-project
  - supabase_edge_runtime_gnamba-project
---

# ADR Log

## ADR-001

- `date`: `2026-06-17`
- `status`: `accepted`
- `phase`: `0`
- `decision`: Un seul tunnel Cloudflare `gnamba-web` doit exposer la pile EGS
- `alternatives_rejected`: ancien tunnel historique, plusieurs tunnels parallèles
- `context_and_justification`: la confusion tunnel/domaine était une source probable de page blanche
- `impact`: élevé
- `affected_services`: `cloudflared`, `egs-web`
- `rollback_possible`: `true`
- `rollback_procedure`: restaurer l’ancien config tunnel uniquement si l’origin actuel échoue, puis refaire les tests
- `budget_impact_fcfa`: `0`
- `risk_ids_mitigated`: `RISK-001`, `RISK-002`
- `tech_debt_introduced`: `false`

## ADR-002

- `date`: `2026-06-17`
- `status`: `accepted`
- `phase`: `5`
- `decision`: EGS Studio reste la seule application de production visible sur Internet
- `alternatives_rejected`: exposition directe de services internes, multi-site en production
- `context_and_justification`: la simplicité d’exploitation prime pour un seul opérateur
- `impact`: élevé
- `affected_services`: `egs-web`, `cloudflared`
- `rollback_possible`: `true`
- `rollback_procedure`: réintroduire un service secondaire seulement si une exigence métier est démontrée
- `budget_impact_fcfa`: `0`
- `risk_ids_mitigated`: `RISK-002`, `RISK-004`
- `tech_debt_introduced`: `false`

## ADR-003

- `date`: `2026-06-17`
- `status`: `accepted`
- `phase`: `0bis`
- `decision`: Supabase local conserve seulement le noyau utile, les sidecars graphiques sont désactivés
- `alternatives_rejected`: garder Studio, Pooler, ImgProxy et Analytics actifs par défaut
- `context_and_justification`: réduire la surface d’attaque et la consommation mémoire
- `impact`: moyen
- `affected_services`: `supabase_studio_gnamba-project`, `supabase_pooler_gnamba-project`, `supabase_imgproxy_gnamba-project`, `supabase_analytics_gnamba-project`
- `rollback_possible`: `true`
- `rollback_procedure`: réactiver chaque service uniquement si un besoin concret réapparaît
- `budget_impact_fcfa`: `0`
- `risk_ids_mitigated`: `RISK-003`
- `tech_debt_introduced`: `false`

## ADR-004

- `date`: `2026-06-17`
- `status`: `accepted`
- `phase`: `11`
- `decision`: Le plan de migration reste séquentiel et centré sur backup, audit, nettoyage filtré et validation
- `alternatives_rejected`: nettoyage massif, migration en parallèle, coupure sans preuve
- `context_and_justification`: la machine doit rester opérable par une seule personne sans ambiguïté
- `impact`: élevé
- `affected_services`: `egs-web`, `cloudflared`, `supabase_db_gnamba-project`, `supabase_auth_gnamba-project`
- `rollback_possible`: `true`
- `rollback_procedure`: revenir au snapshot de départ et aux artefacts de sauvegarde
- `budget_impact_fcfa`: `0`
- `risk_ids_mitigated`: `RISK-005`, `RISK-006`
- `tech_debt_introduced`: `false`
