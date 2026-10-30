# Journal de la refonte contrôlée

## 2026-10-08 — LOT 0 — Git / sécurisation

- État initial conservé sur `main`, commit de référence `dce8a11bb2b3be2a2b408773731cd8169702baa4`.
- Worktree initial déjà fortement modifié ; aucune modification préexistante n’a été supprimée ni écrasée.
- Branche créée : `refonte/clean-slate`.
- Tag créé : `pre-refonte-20261008`.
- Branche et tag pointent vers le commit de référence initial.
- Sauvegarde PostgreSQL créée dans `backups/pre-refonte-20261008.dump` au format custom et vérifiée avec `pg_restore --list`.
- Empreinte SHA-256 : `f99be1d0a6421e58ce3bf3ab02cac35fd076eb2ad919e21e5c12817aa825ab35`.
- Aucune suppression, migration, réinitialisation de base ou modification de donnée n’a été effectuée.
- Le mécanisme de sauvegarde existant et les conteneurs Docker actifs seront documentés dans le LOT 1.

Statut : terminé, en attente de validation du LOT 0.

## 2026-10-08 — LOT 1 — Références forensic

- Snapshot de l'état de travail avant audit : commit `8be48d0567cc5e49dba54c53395dcf004a690927` (`8be48d05`).
- Tag de référence associé : `pre-refonte-wip-20261008`, pointant vers le même commit.
- Rapport forensic read-only : `docs/audit/LOT1-RAPPORT.md`.
- Verdict : LOT 1 NON VALIDÉ ; aucune migration ni correction DB autorisée avant la qualification des écarts.
- Le worktree contenait déjà `M .codex/context/server-context.json`, `?? docs/ARCHITECTURE.md` et `?? docs/SPEC.md`. Ces changements préexistants ont été préservés.
- `docs/SPEC.md` demeure un brouillon explicitement non validé tant que l'audit du Lot 1 ne l'est pas.

## 2026-10-30 — Incident coupure électrique + recovery

Voir docs/INCIDENT_2026-10-30.md. Récupération sans perte. Hotfix ed4014dd.
