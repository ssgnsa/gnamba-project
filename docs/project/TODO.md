# Tâches Priorisées

## Haute priorité
- [ ] Résoudre le blocage réseau Docker Hub / PyPI (externe)
- [ ] Rebuild image Docker egs-api avec corrections modèles auth
- [ ] Redémarrer stack Docker complète (egs-postgres, egs-redis, egs-api, egs-web, filebrowser)
- [ ] Valider endpoints API (/health, /api/v1/dashboard/stats, /api/v1/auth/*)
- [ ] Tester authentification (login, logout, refresh token)
- [ ] Valider RLS PostgreSQL sur toutes les tables

## Moyenne priorité
- [ ] Vérifier module Foncier (CRUD lots, villages, attestations)
- [ ] Vérifier module Immobilier (properties, tenants, contracts, payments)
- [ ] Vérifier module Finances (transactions, catégories, rapports)
- [ ] Vérifier module Documents (upload, versioning, signatures)
- [ ] Vérifier module Médias (library, brand assets, usage tracking)
- [ ] Vérifier module BTP/Projets (chantiers, planification, avancement)
- [ ] Vérifier module RH (employés, présences, congés)
- [ ] Vérifier module CRM/Clients (leads, contacts, interactions)
- [ ] Vérifier module Fournisseurs/Achats
- [ ] Vérifier Site Vitrine (page builder, CMS, SEO)

## Basse priorité
- [ ] Optimiser bundle frontend (code splitting, lazy loading)
- [ ] Configurer monitoring (Sentry, logs structurés)
- [ ] Tests E2E (Playwright/Vitest)
- [ ] Documentation API (OpenAPI/Swagger)
- [ ] Backup/restore automatisé PostgreSQL
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Audit sécurité (headers, CORS, secrets, JWT)