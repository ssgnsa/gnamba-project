# Cleanup report

Date: 2026-07-07
Statut: inventaire factuel

## Resume

Ce rapport documente les artefacts historiques identifiés pendant l'opération d'unification. Les éléments listés ici ne sont pas des chemins de release actifs.

## Éléments supprimés ou à supprimer

| Élément | Emplacement précédent | Date | Raison |
|---|---|---|---|
| `dist_old/` | Racine du dépôt | 2026-07-07 | Ancien bundle frontend, déplacé hors du dépôt pour retirer l'artefact actif |
| `dist-local/` | Racine du dépôt | 2026-07-07 | Fallback de build interdit par la nouvelle baseline |

## Éléments historiques encore visibles

| Élément | État courant | Action recommandée |
|---|---|---|
| `supabase/migrations/.archive/` | Présent | Conserver comme archive ou sortir du chemin actif |
| `supabase/migrations/20260330000000_fix_unique_constraint.sql.old` | Présent | Archiver ou supprimer après vérification qu'aucun runbook ne l'utilise |
| `nginx.conf.backup`, `PROGRESS_STATE.json.backup` | Présents | Supprimer s'ils ne servent plus de sauvegarde ponctuelle |
| `scripts/_archive/`, `_archive/`, `backups/` | Présents | Conserver comme historique, mais hors du chemin de release |

## Conclusion

La release est désormais centrée sur `dist/` et `/var/www/egs/current`. Les autres artefacts doivent rester archivés, ou être supprimés s'ils ne servent plus à l'exploitation.
