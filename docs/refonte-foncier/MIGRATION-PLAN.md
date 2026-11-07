# Plan de migration (24h, 8 phases)

| Phase | Contenu | Durée |
|---|---|---|
| 0 | Nettoyage + branche refonte | 1h |
| 1 | Patterns communs (6 fichiers + tests) | 4h |
| 2 | Fusion Villages | 2h |
| 3 | Page Lotissements & Îlots | 3h |
| 4 | Refonte LotFormModal (wizard) | 4h |
| 5 | Refonte WorkflowValidation | 3h |
| 6 | Corrections DB (4 migrations) | 2h |
| 7 | Vue d'ensemble (dashboard) | 2h |
| 8 | Tests E2E Playwright | 3h |

## Règles
- 1 phase = 1 commit atomique
- Pas de code hors périmètre
- Tests + build verts avant commit
