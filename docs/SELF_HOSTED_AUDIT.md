# Audit EGS — architecture 100% auto-hébergée

## Résumé exécutif

Le dépôt contient déjà plusieurs briques locales utiles : Ollama pour l’IA, Filebrowser pour les documents, Nginx pour la proxy et des scripts de sauvegarde/monitoring. La transformation principale consiste à remplacer les dépendances cloud restantes par des services locaux et à rendre le frontend tolérant aux indisponibilités locales.

## Dépendances détectées

| Service                    | Usage                      | Fichier                                            | Dépendance critique | Remplaçable localement                             |
| -------------------------- | -------------------------- | -------------------------------------------------- | ------------------- | -------------------------------------------------- |
| Supabase client            | Auth, DB, storage, RPC     | src/lib/supabase.ts                                | Oui                 | Oui via PostgreSQL + API locale                    |
| Edge Functions attestation | Vérification d’attestation | src/lib/attestationVerification.ts                 | Oui                 | Oui via API FastAPI locale                         |
| OneSignal                  | Notifications push         | src/App.tsx, src/components/NotificationButton.tsx | Oui                 | Oui via service interne                            |
| Turnstile                  | Anti-bot                   | src/pages/public/LoginPage.tsx                     | Oui                 | Oui via vérification locale / captcha auto-hébergé |
| Sentry                     | Monitoring                 | src/lib/sentry.ts                                  | Non critique        | Oui via logs locaux                                |
| Filebrowser                | Stockage fichiers          | src/lib/filebrowser.ts                             | Non critique        | Oui                                                |
| Ollama                     | IA                         | src/lib/ollama.ts                                  | Non critique        | Oui                                                |

## Inventaire des appels réseau principaux

| URL / endpoint                                                  | Méthode  | Module                              | Impact métier           |
| --------------------------------------------------------------- | -------- | ----------------------------------- | ----------------------- |
| /functions/v1/attestation-verify                                | GET      | Vérification d’attestation          | Validation documentaire |
| /auth/v1/health                                                 | GET      | Synchronisation hors ligne / réseau | Auth et disponibilité   |
| https://onesignal.com/api/v1/notifications                      | POST     | Notifications push                  | Alertes de paiement     |
| https://challenges.cloudflare.com/turnstile/v0/siteverify       | POST     | Connexion                           | Protection anti-bot     |
| https://\*.ingest.sentry.io                                     | POST     | Monitoring                          | Collecte d’erreurs      |
| https://www.youtube.com/oembed                                  | GET      | Mur social public                   | Contenu média           |
| https://graph.facebook.com / api.linkedin.com / api.twitter.com | POST     | Publication social                  | Diffusion réseau        |
| http://localhost:11434                                          | GET/POST | IA                                  | Assistant Copilot       |
| http://localhost:9000                                           | GET/POST | Stockage                            | Documents et médias     |

## Modules audités

| Module                        | Dépendances cloud observées | État de la transformation |
| ----------------------------- | --------------------------- | ------------------------- |
| Dashboard                     | Ollama, Supabase            | Local-first prêt          |
| CRM / Prospects / Clients     | Supabase                    | À brancher sur API locale |
| RH / Paie                     | Supabase                    | À brancher sur API locale |
| Projets / BTP                 | Supabase                    | À brancher sur API locale |
| Achats / Ventes / Stocks      | Supabase                    | À brancher sur API locale |
| Parc informatique / Documents | Filebrowser, Supabase       | Local-first prêt          |
| Finance / Reporting           | Supabase, Ollama            | Local-first prêt          |
| IA                            | Ollama                      | Local-first prêt          |

## Architecture cible

- Internet → Cloudflare → Nginx → Frontend React
- Nginx → Backend FastAPI → PostgreSQL / Redis / MinIO
- Frontend → Ollama local pour l’IA
- Filebrowser / MinIO pour les fichiers métier
- Uptime Kuma / Watchtower / n8n pour l’opérationnel local

## Actions réalisées dans ce dépôt

- Ajout des switches d’environnement pour le mode auto-hébergé
- Désactivation par défaut des intégrations cloud sensibles (OneSignal, Turnstile, Sentry)
- Routage de la vérification d’attestation vers un backend local par défaut
- Ajout d’un compose local pour PostgreSQL, Redis, MinIO, Ollama, n8n, Watchtower, Uptime Kuma et le backend FastAPI
- Ajout d’un script de validation locale et d’un audit de référence
