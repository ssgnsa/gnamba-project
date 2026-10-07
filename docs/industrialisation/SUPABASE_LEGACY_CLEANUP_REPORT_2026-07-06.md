# Rapport de suppression des chemins Supabase hérités - 2026-07-06

## Résumé

Le frontend self-hosted ne charge plus le SDK Supabase Cloud et ne contient plus de chemin réseau vers `capture-lead`, `/functions/*`, `/storage/v1/*`, `/rest/v1/*`, `supabase.co` ou `supabase.in` dans `src/`.

L'authentification frontend repose sur l'API FastAPI locale :

- login : `POST /api/v1/auth/login`
- session courante : `GET /api/v1/auth/me`
- refresh : `POST /api/v1/auth/refresh`
- logout : `POST /api/v1/auth/logout`

## Références trouvées et correctifs

| Référence trouvée | Risque | Correctif appliqué |
|---|---|---|
| `src/lib/lead-capture.ts` appelait l'ancienne Edge Function `.../functions/v1/capture-lead` et conservait des patterns `capture-lead`. | Appel réseau Supabase Edge Function encore possible. | Remplacé par `apiClient.request("/api/v1/leads/capture")`; suppression des patterns legacy. |
| `backend/app/api/v1/leads.py` définissait `/api/v1/leads/capture` mais le routeur n'était pas monté. | Le frontend local n'avait pas de route métier fiable pour remplacer l'Edge Function. | Ajout de `leads_router` dans `backend/app/api/v1/__init__.py`. |
| `src/lib/supabase.ts` importait/lazy-loadait `@supabase/supabase-js`. | Le bundle frontend embarquait encore un chunk `supabase-vendor` et gardait une voie Cloud. | Remplacé par une façade désactivée qui lève une erreur explicite pour `from`, `rpc`, `auth`, `storage`, `functions`, `channel`. |
| `src/context/AuthContext.tsx` pouvait expirer la session par timeout d'inactivité par défaut et ne refreshait pas proactivement le JWT FastAPI. | Déconnexion d'un utilisateur actif après expiration de l'access token. | Timeout d'inactivité désactivé par défaut (`VITE_IDLE_TIMEOUT_MINUTES=0` si non défini), refresh préventif basé sur `exp`, init via `/auth/me` + `/auth/refresh`, logout via FastAPI. |
| `src/api/client.ts` et `src/services/api/client.ts` ne rejouaient pas les requêtes 401 après refresh. | Une requête métier pouvait échouer dès que l'access token expirait. | Ajout d'un refresh automatique avec retry unique hors `/auth/login` et `/auth/refresh`. |
| `src/lib/logoUtils.ts` savait parser `/storage/v1/*`, détectait `supabase.co/.in` et pouvait recréer des signed URLs via storage. | Réactivation possible de chemins Storage cloud côté navigateur. | Suppression de toute conversion/signature cloud; les URLs médias doivent être servies localement. |
| `src/pages/Documents.tsx` acceptait explicitement `supabase.co/storage/v1/object/public/`. | Tolérance d'URL Storage Cloud dans le frontend. | Suppression de ce cas spécial. |
| `src/lib/__tests__/attestationVerification.test.ts` mockait une URL `supabase.co` et parlait d'Edge Function. | Test trompeur, non aligné avec FastAPI local. | Test mis à jour vers `/api/v1/foncier/attestations/verify` sans headers anon key. |
| `scripts/check-legacy-supabase.mjs` ne vérifiait pas les ressources réseau interdites. | La CI pouvait manquer un retour de `/functions`, `/storage/v1`, `/rest/v1` ou Cloud. | Garde remplacée par un scan des chemins interdits et des imports directs SDK dans `src/`. |

## Tests exécutés

```text
npm run selfhosted:guard
-> No forbidden Supabase network resources or direct SDK imports found in src/.
```

```text
npm run test:run -- src/api/client.settings.test.ts src/lib/__tests__/attestationVerification.test.ts src/lib/__tests__/supabase.selfhosted.test.ts
-> 3 files passed, 7 tests passed
```

```text
npm run typecheck
-> OK
```

```text
npm run build
-> OK, build généré dans dist-local
-> aucun chunk supabase-vendor dans le build courant
```

```text
PYTHONPATH=. ./.venv/bin/pytest backend/tests/test_v1_api.py backend/tests/test_auth_api.py -q
-> 3 passed
```

```text
Smoke HTTP/API local sur http://127.0.0.1:8000
-> login, /auth/me, création projet, liste projets, logout, reconnexion
-> forbiddenCount: 0
```

## Preuves anti-appel Supabase

Scans exécutés :

```text
rg -n "capture-lead|/functions/v1|/functions/|/storage/v1|/rest/v1|supabase\\.co|supabase\\.in" src
-> aucun résultat
```

```text
rg -n "@supabase/supabase-js|createClient|SupabaseClient|supabase\\.(?:co|in)|/rest/v1/|/storage/v1/|/functions(?:/v1)?/|capture-lead" dist-local/index.html dist-local/assets/index-mR09kxjo.js dist-local/assets/*.js
-> aucun résultat
```

Le `dist-local/index.html` courant ne précharge que :

- `rolldown-runtime-CVuCju2K.js`
- `icons-vendor-CPftFe5p.js`
- `react-vendor-B6ke1_qc.js`
- `client-BmJEx-y6.js`
- `officialContact-BgUbIGCQ.js`

Aucun `supabase-vendor` n'est référencé.

## Limite de validation

Le smoke navigateur Puppeteer n'a pas pu démarrer dans cet environnement, car Chromium échoue sur la bibliothèque système manquante `libatk-bridge-2.0.so.0`.

Le smoke API couvre connexion, session, CRUD, déconnexion et reconnexion. La navigation UI n'est donc pas déclarée validée par navigateur dans ce rapport.
