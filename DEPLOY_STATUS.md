# Status Deploiement - EGS Production

**Date:** 2026-06-05
**Build frontend deploye:** `index-DhcRsq4l.js` / `index-CqzWsiSq.css`
**Mode:** Supabase Cloud + IndexedDB/offline
**Frontend:** `egs-frontend`
**Reverse proxy:** `egs-nginx-proxy`

---

## Etat actuel

- `egs-frontend` est demarre et healthy.
- `egs-nginx-proxy` est demarre et healthy.
- Le build production est publie dans `/usr/share/nginx/html/`.
- L'origine locale sert un HTML non vide avec `#root` et des assets d'entree hashes (`assets/index-*.js`, `assets/index-*.css`).
- Les domaines publics `gnambaservices.ci`, `www.gnambaservices.ci` et `portal.gnambaservices.ci` servent le build valide.
- Les assets JS/CSS hashes sont servis avec cache long `max-age=31536000, immutable`.
- Les assets manquants repondent maintenant avec un 404 court `Asset not found` au lieu de renvoyer `index.html`, pour eviter les erreurs MIME trompeuses sur les vieux chunks.
- Le HTML est servi avec cache court `max-age=300`.
- Les pages d'auth publiques (`/login`, `/forgot-password`, `/reset-password`, `/register`, `/auth`) sont servies en `no-cache, no-store, must-revalidate`.
- FileBrowser est expose cote application via `/filebrowser/` et son API via `/filebrowser/api`, sans URL navigateur `localhost`.
- La CSP publique laisse passer la CSP Nginx complete, avec OneSignal, Turnstile, YouTube, Sentry US et Supabase Cloud.
- Les checks Supabase/Auth utilisent un faux login attendu `invalid_credentials` pour eviter les faux 401 du endpoint REST racine.
- `/favicon.ico` repond `200 image/svg+xml` via le logo par defaut.
- Les fonctions Supabase Edge `attestation-sign`, `attestation-verify` et `verify-turnstile` ont ete publiees le 2026-06-05 apres correction CORS/runtime.
- Le secret serveur `CLOUDFLARE_TURNSTILE_SECRET_KEY` est configure cote Supabase; `verify-turnstile` retourne maintenant `400 Missing token` sur un appel vide au lieu de `500`.
- Les warnings Nginx `listen ... http2` deprecation ont ete supprimes dans les configs proxy en utilisant `http2 on;`.
- Le monitoring `scripts/gnamba-monitor.sh` est aligne sur le flux local expose via tunnel: conteneurs `egs-*`, Supabase local auth health, tables REST critiques et sauvegardes non vides.
- Une sauvegarde REST Supabase Cloud fraiche a ete creee: `backups/supabase/20260605_210007_rest/supabase_backup_20260605_210007.json.gz`.

---

## Correction page de connexion

Probleme observe: la page `/login` etait melangee avec le fallback global `Application EGS / Module indisponible`, et la console affichait plusieurs erreurs sans lien direct avec l'authentification.

Corrections appliquees:

- Cause racine isolee: le navigateur chargeait un melange d'anciens et nouveaux bundles (`react-vendor-DieVQPKr.js` avec `react-vendor-CenJeXy9.js`), ce qui declenchait React #321 et le fallback global.
- Le build Vite utilise maintenant des entrees hashees (`assets/index-*.js`, `assets/index-*.css`) au lieu de `assets/index.js?v=...`, afin d'eviter toute collision de cache CDN/browser.
- Les anciennes rewrites Nginx `assets/index-*.js -> assets/index.js` ont ete supprimees pour ne jamais casser les assets hashes.
- Le deploiement Docker local purge le dossier `/usr/share/nginx/html/` avant copie du nouveau build, afin de ne plus laisser d'anciens chunks `LoginPage-*`, `react-vendor-*` ou `icons-vendor-*`.
- `npm run validate:frontend` bloque maintenant toute regression qui remettrait un entry bundle stable, une rewrite dangereuse ou une URL FileBrowser `localhost:8081` dans les assets de production.
- Le module Documents utilise maintenant `/filebrowser/api` en production; la route Nginx `/filebrowser/` proxy vers le conteneur FileBrowser en retirant le prefixe.
- Le fallback React ignore maintenant le cas recuperable `NotFoundError/removeChild`, typique d'une extension navigateur qui modifie le DOM.
- La transition apres connexion est exclusive: le formulaire login est demonte, puis un loader "Ouverture de l'espace interne" s'affiche jusqu'a validation de la session.
- Si un utilisateur authentifie arrive encore sur `/login`, l'application rend le dashboard au lieu de garder le formulaire de connexion.
- Les libelles publics sont harmonises autour de "Espace interne" / "Connexion espace interne".
- OneSignal ne s'initialise plus sur la page publique de connexion; il attend un utilisateur authentifie.
- Les erreurs OneSignal bloquees par le navigateur/adblock sont silencieuses en production.
- L'envoi Sentry utilise maintenant l'URL envelope derivee du DSN au lieu d'une URL hardcodee incorrecte.
- La CSP autorise maintenant le host Sentry derive du DSN via `https://*.ingest.us.sentry.io`.
- La CSP autorise les ressources YouTube utiles (`www.youtube.com`, `www.youtube-nocookie.com`, `s.ytimg.com`, miniatures YouTube) sans ouvrir les scripts a tout `https:`.
- Les pages d'auth ne sont plus cachees par le proxy/CDN.
- Le favicon par defaut est declare dans `index.html` et servi par Nginx pour eviter le 404 initial.

---

## Validations passees

```bash
npm run lint
npm run typecheck
npm run build
npm run validate:frontend
bash scripts/validate-frontend-release.sh --strict --url https://gnambaservices.ci/ --url https://gnambaservices.ci/login --url https://www.gnambaservices.ci/login --url https://gnambaservices.ci/assets/index-DhcRsq4l.js --url https://gnambaservices.ci/assets/Documents-xY12apw9.js --url https://gnambaservices.ci/assets/SiteMediaAssignments-2xua6QU5.js
./scripts/gnamba-monitor.sh
```

Resultat: OK.

Le test Supabase Auth password avec des identifiants volontairement faux retourne `400 invalid_credentials`, pas `401`: la cle anon est acceptee et GoTrue repond correctement.

Le test REST `app_settings` avec la cle anon retourne `200`.

Le test REST racine `/rest/v1/` avec la cle anon retourne `401`, ce qui est attendu chez Supabase: cet endpoint racine exige une cle `service_role` et ne doit pas etre utilise comme health check public.

Le HTML public de `https://gnambaservices.ci/login` retourne `200`, pese environ `3625` octets, contient `#root`, et reference `/assets/index-DhcRsq4l.js`.

Les anciens assets critiques retournes par les navigateurs en cache repondent maintenant `404` cote origine/CDN avec le corps court `Asset not found`: `react-vendor-DieVQPKr.js`, `icons-vendor-MsBvJH8w.js`, anciens `LoginPage-*`, anciens `Documents-*`, anciens `SiteMediaAssignments-*`, `index.js`, `index.css`.

Le test `https://gnambaservices.ci/filebrowser/health` retourne `200` avec `{"status":"OK"}`.

Le monitoring de production locale retourne `6/6` checks reussis. Les anciens faux positifs `localhost:54321`, `filebrowser` sans prefixe et backups vides ont ete corriges. Le statut Git reste un warning attendu pendant cette session de maintenance, sans alerte critique tant que le seuil configure n'est pas depasse.

Les tests live non destructifs des fonctions Supabase Edge retournent les erreurs attendues:

- `attestation-verify` sans reference: `400` avec CORS `https://gnambaservices.ci`.
- `verify-turnstile` avec corps vide: `400 Missing token`, sans erreur serveur.
- `attestation-sign` sans JWT: `401 Missing authorization header`.

---

## Cloudflare CSP

Regle CSP Cloudflare retiree. Le header public laisse maintenant passer la CSP de l'origine Nginx.

Header observe sur `https://www.gnambaservices.ci/`:

```http
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://cloudflareinsights.com https://cdn.onesignal.com https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com; ...
```

Validation publique: OK.

Etat des alias publics au 2026-06-05:

| Hostname | HTTP | CSP |
| --- | --- | --- |
| `gnambaservices.ci` | 200 | OK |
| `www.gnambaservices.ci` | 200 | OK |
| `portal.gnambaservices.ci` | 200 | OK |
| `erp.gnambaservices.ci` | 200 | OK |
| `immobilier.gnambaservices.ci` | 200 | OK |
| `foncier.gnambaservices.ci` | 200 | OK |
| `www.erp.gnambaservices.ci` | DNS cree | TLS Cloudflare non couvert actuellement |

Note: `www.erp.gnambaservices.ci` est un sous-sous-domaine. Selon la couverture TLS Cloudflare disponible, il faut soit activer Total TLS / certificat avance pour ce hostname, soit supprimer cet alias et garder `erp.gnambaservices.ci` comme hostname canonique.

---

## Commandes utiles

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker exec egs-frontend nginx -t
docker exec egs-nginx-proxy nginx -t
curl -sSI -H "Host: gnambaservices.ci" http://127.0.0.1/
curl -sSI https://www.gnambaservices.ci/
```

---

## Notes de securite

- Ne jamais exposer de `SUPABASE_SERVICE_ROLE_KEY` dans le frontend.
- Ne jamais exposer de cle REST OneSignal avec un prefixe `VITE_`.
- Les secrets OneSignal serveur doivent rester dans les secrets Supabase Edge Functions / CI, sous `ONESIGNAL_APP_ID` et `ONESIGNAL_API_KEY`.
- La cle Supabase anon/publishable peut etre presente cote frontend, mais elle doit rester protegee par RLS.
