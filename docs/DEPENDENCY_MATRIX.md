# Matrice des dépendances — Migration self-hosted

Ce document recense les dépendances externes détectées et propose des alternatives locales.

| Nom                                                | Fichiers (exemples)                                                                                                      | Rôle / Fonction                                   | Impact métier                                            | Alternative locale proposée                                                                                             | Statut suggéré              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Supabase (client + functions + storage + realtime) | src/lib/supabase.ts, src/lib/supabase.service.ts, src/pages/Foncier.tsx, src/lib/mediaUtils.ts, src/offline/**, tests/** | Auth, DB (RPC, RLS), Storage, Functions, Realtime | Critique — auth, données métier, attestation, migrations | FastAPI + SQLAlchemy + Alembic + JWT + Redis + MinIO/Filebrowser. Wrapper "supabaseService" → migrate vers API backend. | À migrer                    |
| Edge Functions (attestation)                       | src/lib/attestationVerification.ts, usages via supabase.functions.invoke                                                 | Vérification et signature d’attestations          | Critique — flux attestation                              | Implémenter endpoint FastAPI `/api/v1/attestation/*` (p.ex. `/api/v1/attestation/sign`, `/verify`)                      | À migrer                    |
| OneSignal                                          | src/App.tsx, src/components/NotificationButton.tsx                                                                       | Notifications push (alerte paiement)              | Important — alertes temps réel                           | NotificationService local (SMTP, SMS provider, push via WebPush ou pwa-server), extensible                              | À migrer                    |
| Cloudflare Turnstile                               | src/pages/public/LoginPage.tsx                                                                                           | Anti-bot / Captcha                                | Auth protection                                          | Captcha local / hCaptcha auto-hébergé / option désactivation en réseau privé                                            | À migrer                    |
| Sentry (cloud)                                     | src/lib/sentry.ts                                                                                                        | Monitoring erreurs                                | Non critique mais utile                                  | Logs JSON → Promtail/ Loki / Prometheus + Grafana + Uptime Kuma / Health checks                                         | À remplacer                 |
| Filebrowser / MinIO                                | src/lib/filebrowser.ts, src/lib/filebrowserConfig.ts                                                                     | Stockage fichiers, navigation                     | Important — documents, médias                            | Filebrowser + MinIO local déjà disponibles; standardiser `StorageService`                                               | À conserver / standardiser  |
| Ollama                                             | src/lib/ollama.ts                                                                                                        | IA locale (model hosting)                         | IA assistant, génération                                 | Garder local Ollama; documenter endpoint baseUrl                                                                        | À conserver                 |
| Social APIs (YouTube, Facebook, LinkedIn, Twitter) | src/lib/social-publish.ts                                                                                                | Publication sociale                               | Moyennement critique                                     | Adapter asynchrone via n8n ou providers extensibles; rendre facultatif                                                  | À migrer / rendre optionnel |
| Supabase migrations / seeds / RPC / Policies / RLS | supabase/migrations/..., alembic/ (mix)                                                                                  | DB schema & sécurité                              | Critique — schéma et sécurité                            | Consolider vers Alembic, documenter et archiver migrations Supabase                                                     | À migrer / archiver         |
| Supabase realtime / subscriptions                  | src/hooks/useRealtimePayments.ts, realtime usages                                                                        | Realtime UI updates                               | Important pour paiements                                 | Redis Pub/Sub + WebSocket endpoints derrière FastAPI (ou Postgres LISTEN/NOTIFY)                                        | À migrer                    |

Notes:

- Le repo contient déjà un `supabaseService` utilisé comme couche d’abstraction (strangler pattern) — cela facilite une migration progressive.
- Priorité immédiate: créer une API backend unique `/api/v1` implémentant tous les endpoints utilisés par `src/services/api` et basculer le frontend pour qu’il n’appelle que `src/services/api`.
- Chaque suppression doit être accompagnée d’un plan de test et d’un rollback (cf. règles absolues).

---

## Inventaire rapide des fichiers utilisant `supabase` (extraits)

- src/lib/supabase.service.ts
- src/lib/supabase.ts
- src/pages/Foncier.tsx
- src/lib/mediaUtils.ts
- src/offline/network/connectivity.ts
- src/offline/sync/sync.engine.v2.ts
- src/hooks/useFoncierData.ts
- src/hooks/useFoncierSync.ts
- src/lib/foncierOffline.ts
- src/test/FoncierHooks.test.ts

(Le projet contient ~200 occurrences de `supabase` dans `src/`.)

---

## Inventaire des routes client appelées (extraits)

- `/api/*` : usages mixtes dans `src/api/client.ts`, `src/lib/mediaUtils.ts`, `src/lib/ollama.ts`, `src/pages/public/*`
- `/api/v1/*` : usages dans `src/services/api/client.ts` (ex: `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/users`)

Recommandation: standardiser toutes les routes backend sur `/api/v1/*` et retirer tous les usages directs de `/api/` qui ne respectent pas `/api/v1/`.

---

## Prochaines actions proposées

1. Générer un inventaire complet des routes `/api` (fichier `docs/API_ROUTES.md`).
2. Lancer Lot 1: refactorer tous les imports pour utiliser uniquement `src/services/api` et assurer que toutes les routes pointent vers `/api/v1`.
3. Plan détaillé pour migration Supabase (Lot 2).

Souhaitez-vous que je crée `docs/API_ROUTES.md` maintenant et y liste toutes les occurrences `/api` trouvées ?
