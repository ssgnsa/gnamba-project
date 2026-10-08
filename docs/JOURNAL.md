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
