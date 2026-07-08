---
document: MISSION_CODEX_v6.3.md
phase: 0
session: 1
generated_at: "2026-06-17T12:06:17Z"
status: final
inputs_used:
  - /home/soma/.codex/attachments/e428ee73-7897-4bfc-a4cc-6bfd3003184f/pasted-text.txt
  - docs/governance/CODEX_ASSISTANT_CAHIER_DES_CHARGES.md
  - docs/governance/CODEX_ASSISTANT_SCAFFOLD.md
absent_services: []
---

# Mission Codex v6.3

## But

Servir de référentiel unique pour la transformation EGS Enterprise System en mode `MODE_SOLO`, avec une base locale stable, documentée et vérifiable.

## Objectif opérationnel

- Lire l’état réel du serveur avant toute action
- Détecter les conflits entre anciens services et cible actuelle
- Préparer une architecture simple, maintenable et reproductible
- Produire les livrables d’audit, de sécurité, d’architecture et de migration
- Protéger l’exploitation avec un protocole de sauvegarde et de rollback

## Cible finale

- Une seule application de production: EGS Studio
- Déploiement 100% local sur le serveur
- Aucune dépendance cloud pour Supabase
- Accès local via `http://localhost` et `http://REDACTED_LEGACY_HOST`
- Exposition Internet exclusivement via Cloudflare Tunnel
- Aucun port public ouvert sur Internet

## Règles absolues

1. Toujours lire `PROGRESS_STATE.json` avant toute action
2. Refuser de continuer si `stop_condition_active = true`
3. Refuser de continuer si `cve_critical_open > 0`
4. Respecter `current_phase`
5. Ne supprimer que les composants morts ou explicitement ciblés
6. Ne jamais casser EGS, Supabase, PostgreSQL, Docker ou Cloudflare
7. Toujours privilégier l’action la plus simple à maintenir par une seule personne

## Stop conditions

Arrêt immédiat si l’un des points suivants apparaît:

- `program_health_score < 50`
- perte ou suspicion de perte de données
- échec répété de rollback
- service critique indisponible au-delà du RTO
- disque au-dessus du seuil critique
- vulnérabilité critique confirmée sur un service critique

Quand cela arrive, basculer `stop_condition_active` à `true` et attendre validation explicite.

## Périmètre de nettoyage autorisé

Supprimer uniquement les traces liées à `SOMAGRO`:

- conteneurs
- volumes
- images
- réseaux
- services systemd
- cron
- scripts
- logs

Tout le reste doit être conservé.

## Livrables prioritaires par phase

- Phase 0: `PROGRESS_STATE.json`, `SERVICE_CRITICALITY_MATRIX.md`, `RISK_REGISTER.md`
- Phase 0bis: `SECURITY_AUDIT.md`, `VULNERABILITY_REGISTER.md`
- Phase 0ter: `BASELINE_STATE.md`, `QUICK_WIN_LIST.md`
- Phase 2: `DEPENDENCY_GRAPH.md`
- Phase 11: `MIGRATION_PLAN.md`, `TRANSFORMATION_BACKLOG.md`

## Règle d’or

Ne jamais traiter le pseudo-stack historique comme la cible finale. La cible est une architecture locale, séparée, lisible et documentée.
