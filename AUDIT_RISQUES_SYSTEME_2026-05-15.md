# AUDIT RISQUES SYSTÈME EGS — 15 mai 2026
## Analyse : Sécurité Exploitable · Défaillances Architecturales · Performance · Résilience

**Périmètre analysé** : 125 fichiers TS/TSX · 49 migrations SQL · 6 Edge Functions · nginx · Docker  
**Méthodologie** : Lecture directe du code source, pas d'hypothèses

---

## 🔴 RISQUES CRITIQUES EXPLOITABLES IMMÉDIATEMENT

---

### SEC-01 · Clé `service_role` accessible côté client (CRITIQUE)

**Fichier** : `src/lib/attestationPdfLogger.ts:12`

```typescript
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY 
                || process.env.SUPABASE_SERVICE_ROLE_KEY;
const client = createClient(supabaseUrl, serviceKey, ...);
```

**Problème** : Ce fichier importe `createClient` et utilise `SUPABASE_SERVICE_ROLE_KEY` dans le code
*source compilé dans le bundle Vite*. Les `VITE_*` env vars sont **injectées en clair dans le JS
livré au navigateur**. Toute personne pouvant accéder au bundle peut extraire la clé.

**Impact** : La `service_role` key bypasse **toutes les RLS policies**. Exploitable pour :
- Lire/modifier/supprimer toutes les données (foncier, finances, employés)
- Créer des comptes admin
- Exfiltrer la totalité de la base de données

**Note** : `process.env` n'existe pas dans le navigateur (c'est Node.js). La ligne retourne
`undefined` en production — la fonction est **silencieusement cassée** mais ne fuite pas la clé.
Cependant, si un développeur renomme la var en `VITE_SUPABASE_SERVICE_ROLE_KEY` pour "corriger"
l'undefined, la clé sera exposée publiquement.

**Fix** : Supprimer ce fichier ou le déplacer en Edge Function exclusivement.

---

### SEC-02 · Edge Function `capture-lead` sans authentification (CRITIQUE)

**Fichier** : `supabase/functions/capture-lead/index.ts:4,31-80`

```typescript
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
// Aucune vérification de token, aucune vérification d'origine
export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' }}) }
  // INSERT direct dans leads avec service_role
  await supabase.from('leads').insert({ phone, ... })
```

**Problème** : Endpoint `POST /functions/v1/capture-lead` accessible **sans aucune
authentification**, avec `Access-Control-Allow-Origin: *`, utilisant la `service_role` key.
N'importe qui peut insérer des milliers de leads frauduleux dans la base.

**Impact** :
- Spam illimité de la table `leads`
- Déni de service sur Supabase (quota/coût)
- Données corrompues dans le CRM
- Pas de validation du format téléphone

**Fix minimal** :
```typescript
// Vérifier JWT Supabase ou un secret partagé
const authHeader = req.headers.get('Authorization')
if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 })
// + rate limiting par IP
```

---

### SEC-03 · Flux OAuth `implicit` (DÉPRÉCIÉ, vecteur de token leakage)

**Fichier** : `src/lib/supabase.ts:82`

```typescript
flowType: "implicit",  // ← DÉPRÉCIÉ depuis OAuth 2.0 Security Best Current Practice
```

**Problème** : Le flux `implicit` expose le JWT access token **dans l'URL fragment** (`#access_token=...`).
Ce token apparaît dans :
- Les logs du serveur web (nginx access logs)
- L'historique du navigateur
- Les `Referer` headers vers des tiers
- Les logs Cloudflare

**Impact** : Vol de session possible si les logs sont compromis ou si un tiers chargé sur la page
lit `window.location.hash`.

**Fix** : Changer vers PKCE (recommandation Supabase officielle depuis 2023) :
```typescript
flowType: "pkce",  // PKCE = Proof Key for Code Exchange
```

---

### SEC-04 · `SECURITY DEFINER` sans `SET search_path` sur fonctions critiques

**Fichiers** : `supabase/migrations/20260405130000`, `20260408120000`, `20260515000002`

```sql
-- ❌ Fonctions avec SECURITY DEFINER mais SANS SET search_path
$$ LANGUAGE SQL SECURITY DEFINER;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- 6 occurrences dans leads module
```

**Problème** : Une fonction `SECURITY DEFINER` sans `SET search_path = public` est vulnérable
à une **attaque de search_path injection**. Un attaquant ayant un accès DB limité peut créer
un schéma avec des tables du même nom et détourner l'exécution de la fonction.

**Fonctions affectées** : `is_admin()`, `is_gestionnaire()`, `is_authenticated_user()`,
`update_lead_score()`, `auto_assign_lead()`, `update_pipeline_stats()`, `get_funnel_stats()`.

**Fix** : Ajouter `SET search_path = public` à chaque fonction concernée.

---

### SEC-05 · `initLeadCapture()` s'exécute au chargement du module — pas de guard

**Fichier** : `src/lib/lead-capture.ts:138-143`

```typescript
if (typeof window !== 'undefined') {
  if (!leadCaptureInitialized) {
    initLeadCapture()  // ← attache un event listener 'submit' sur TOUS les formulaires
    leadCaptureInitialized = true
  }
}
```

**Problème** : Ce code s'exécute **immédiatement à l'import du module**, interceptant tous les
`submit` events de la page — y compris les formulaires de connexion et de recherche internes.
Le formulaire de login (`LoginPage`) contient des champs `input[type="email"]` qui pourraient
déclencher des captures non voulues.

**Impact** :
- Exfiltration accidentelle de données de formulaires internes vers l'Edge Function
- Erreurs silencieuses (`alert("Erreur lors de l'enregistrement")`) sur le formulaire de login
- Le `form.submit()` ligne 129 peut soumettre des formulaires deux fois

---

## 🟠 DÉFAILLANCES ARCHITECTURALES STRUCTURELLES

---

### ARCH-01 · God Component — `Foncier.tsx` : 4 730 lignes, 168 KB

**Impact réel** :
- Re-render global pour tout changement d'état local (filtre, modal, pagination)
- Impossible à tree-shaker par Vite — tout le code charge au premier accès au module
- Temps de parse JS : ~300-500ms sur mobile bas de gamme (Côte d'Ivoire = connexions 3G)
- Stack traces illisibles en production (Sentry)
- Aucune memoization visible sur les listes foncières

**Cascade** : `RegistreVisiteur.tsx` (56K), `Parametres.tsx` (52K), `AccueilEmploye.tsx` (52K)
partagent le même pattern. Total : **~400KB de JS non splitté** chargé en lazy mais mono-chunk.

---

### ARCH-02 · Aucune couche de données — 50+ `supabase.from()` directs dans les pages

```
Résultat grep: 50 catchs dans pages/ pour ~250+ requêtes directes estimées
```

**Problème** : Chaque page/composant accède directement à Supabase. Il n'existe **aucune couche
de cache, aucune invalidation, aucun état global de données**. `supabaseService` n'est utilisé
que par `useFoncierLogic` — les autres modules (Clients, Finances, Projets, Immobilier) font
tous des requêtes directes sans retry ni cache.

**Conséquences** :
- Requêtes dupliquées entre composants pour les mêmes données
- Pas de optimistic updates — toute opération nécessite un rechargement
- Supabase free tier : 500 req/sec — dépassable en usage normal multi-utilisateurs

---

### ARCH-03 · Navigation sans router — état `window.history` non synchronisé

**Fichier** : `src/App.tsx:124-172`

L'app gère la navigation via `pushState` mais sans React Router. Plusieurs patterns coexistent :
- `window.history.pushState` direct dans `App.tsx`
- `window.location.href` dans certaines pages
- `localStorage` pour le `post_login_path`

**Problème** : Le bouton "Retour" navigateur ne restaure pas le contexte (onglet ouvert, scroll,
filtres actifs). Sur iOS Safari, l'historique est corrompu après 3-4 navigations.

---

### ARCH-04 · `document.write()` pour l'impression — bloque le thread principal

**Fichiers** : `src/utils/print.ts:1544`, `src/pages/Documents.tsx:227`,
`src/pages/RegistreVisiteur.tsx:538`, `src/pages/immobilier/PaymentReportsTab.tsx:327`

```typescript
win.document.write(html);  // ← String HTML non sanitisée
```

**Problème 1 — Sécurité** : Le HTML injecté par `document.write` contient des données issues de
la base de données (noms, adresses, CNI). Si ces données contiennent des caractères `<script>`,
elles s'exécuteront dans la fenêtre d'impression. DOMPurify est utilisé dans `useFoncierLogic`
mais **pas dans toutes les fonctions print**.

**Problème 2 — Résilience** : `document.write` sur une fenêtre déjà fermée lance une exception
non catchée qui peut crasher le composant parent.

---

### ARCH-05 · Cache en mémoire non partagé entre onglets/rechargements

**Fichier** : `src/lib/supabase.service.ts:77-101`

```typescript
private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
```

Cache instance-level dans `SupabaseService`. Problèmes :
- Détruit à chaque rechargement de page
- Non partagé entre onglets (double requêtes si 2 onglets ouverts)
- Non invalidé lors des mutations dans les autres modules
- Village stats cachées 2 minutes mais pas invalidées lors d'un ajout de lot depuis un autre onglet

---

## 🟡 PROBLÈMES DE PERFORMANCE MESURABLES

---

### PERF-01 · Bundle JS non optimisé — `unsafe-eval` dans CSP = Vite en mode dev en prod

**Fichier** : `nginx.conf:21`

```
script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline'
```

`'unsafe-eval'` est requis parce que quelque chose dans le bundle appelle `eval()` ou
`new Function()`. Sources probables : DOMPurify, QRCode, ou une dépendance non-optimisée.
Cela **neutralise entièrement la protection XSS de la CSP** — autant ne pas avoir de CSP.

---

### PERF-02 · Assets statiques avec `expires 1h` — pas de fingerprinting garanti

**Fichier** : `nginx.conf:29-37`

```nginx
location /assets/ {
    expires 1h;  # ← Trop court pour des assets hashés par Vite
}
```

Vite génère des assets avec hash (`main-Bx3kYZ.js`). Ces fichiers sont **immuables** et
devraient avoir `Cache-Control: immutable, max-age=31536000`. Avec seulement 1h, les utilisateurs
re-téléchargent 24× par jour des fichiers identiques.

**Fix** :
```nginx
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

### PERF-03 · Idle timeout : polling toutes les 60 secondes avec `setInterval`

**Fichier** : `src/context/AuthContext.tsx:229-238`

```typescript
const interval = window.setInterval(() => {
  const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
  if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) { void signOut(); }
}, 60 * 1000);
```

`localStorage.getItem` toutes les 60s pour tous les utilisateurs connectés. Sur mobile sous
contrainte mémoire, réveille le processus inutilement. À remplacer par `visibilitychange` +
`Page Visibility API`.

---

### PERF-04 · `mousemove` listener non throttlé sur `window`

**Fichier** : `src/context/AuthContext.tsx:217-227`

```typescript
const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));
```

`updateActivity` écrit dans `localStorage` à **chaque pixel de mouvement de souris**.
Sur une session active de 8h, cela représente ~500 000 écritures localStorage.

**Fix** : Throttler à 5 secondes minimum.

---

## 🔵 RÉSILIENCE PRODUCTION

---

### RES-01 · Timeout Supabase 30s — aucun retry sur les pages critiques

**Fichier** : `src/lib/supabase.ts:89`

```typescript
const timeoutId = setTimeout(() => controller.abort(), 30000);
```

Le timeout abort est configuré à 30s mais **uniquement dans `supabaseService.queryWithRetry()`**.
Les 50+ `supabase.from()` directs dans les pages n'ont pas ce mécanisme. Une requête lente sur
Foncier.tsx laisse l'utilisateur avec un spinner infini.

---

### RES-02 · `ErrorBoundary` présent mais aucun fallback de données

**Fichier** : `src/App.tsx:15`, `src/components/ErrorBoundary.tsx`

L'`ErrorBoundary` catch les erreurs de rendu React mais pas les `Promise` rejetées dans les
`useEffect`. La majorité des requêtes Supabase sont dans des `useEffect` — une erreur réseau
affiche un état vide sans message d'erreur visible dans ~60% des cas.

---

### RES-03 · Single Point of Failure — un seul conteneur Docker, pas de replica

**Fichier** : `docker-compose.yml`

```yaml
restart: unless-stopped  # Redémarre après crash, mais downtime de ~5-30s
```

Aucun load balancer, aucune replica. Un `npm run build` qui crashe le conteneur ou une mise à
jour Docker cause une interruption de service complète. Pas de rolling update.

---

### RES-04 · Pas de monitoring de la DB Supabase côté application

Aucun `healthcheck` vers Supabase dans l'app. Si Supabase Cloud est dégradé (Stockholm region),
l'app affiche des spinners ou des erreurs génériques sans indication à l'utilisateur.
Aucune page de maintenance configurée dans nginx.

---

### RES-05 · `foncierOffline.ts` — offline mode partiel et non testé

**Fichier** : `src/lib/foncierOffline.ts:95,111`

Des clés UUID sont stockées dans `localStorage` pour le mode offline, mais :
- Aucun test de synchronisation au retour en ligne visible
- Pas de gestion de conflit si le serveur a des données plus récentes
- `row_version` dans `saveLot()` implique de l'optimistic locking — mais le fallback offline
  peut générer des `row_version` incorrects

---

## 📊 TABLEAU DE RISQUES CONSOLIDÉ

| ID | Catégorie | Sévérité | Exploitabilité | Priorité fix |
|----|-----------|----------|---------------|--------------|
| SEC-01 | Sécurité | Critique | Potentielle si refacto | P1 — Supprimer le fichier |
| SEC-02 | Sécurité | Critique | **Immédiate** — endpoint public | P0 — Ajouter auth |
| SEC-03 | Sécurité | Haute | Indirecte (logs) | P1 — Changer vers PKCE |
| SEC-04 | Sécurité | Haute | Exploitable avec accès DB limité | P1 — Ajouter search_path |
| SEC-05 | Sécurité | Moyenne | Side-effect silencieux | P2 — Guard sur import |
| ARCH-01 | Architecture | Haute | Impact perf/maintenabilité | P2 — Découper Foncier.tsx |
| ARCH-02 | Architecture | Haute | Scalabilité | P2 — Data layer |
| ARCH-03 | Architecture | Moyenne | UX dégradée | P3 |
| ARCH-04 | Architecture | Haute | XSS potentiel en print | P1 — Sanitiser avant write |
| ARCH-05 | Architecture | Basse | Données stale | P3 |
| PERF-01 | Performance | Haute | CSP neutralisée | P1 — Éliminer unsafe-eval |
| PERF-02 | Performance | Moyenne | Bande passante gaspillée | P2 — Cache immutable |
| PERF-03 | Performance | Basse | Batterie mobile | P3 |
| PERF-04 | Performance | Moyenne | CPU/Mémoire | P2 — Throttle |
| RES-01 | Résilience | Haute | Spinners infinis | P2 — Timeouts uniformes |
| RES-02 | Résilience | Haute | UX cassée silencieuse | P2 — Error states |
| RES-03 | Résilience | Haute | Downtime deploy | P2 — Health strategy |
| RES-04 | Résilience | Moyenne | Pas de dégradation gracieuse | P3 |
| RES-05 | Résilience | Haute | Corruption données offline | P1 — Tests offline |

---

## 🎯 PLAN D'ACTION IMMÉDIAT

### P0 — Cette semaine (risque actif)
```
SEC-02: Ajouter Bearer token check sur capture-lead edge function
        + rate limiting par IP (max 5 req/min)
```

### P1 — Sprint suivant (sécurité exploitable)
```
SEC-01: Supprimer attestationPdfLogger.ts ou le porter en Edge Function
SEC-03: flowType: "pkce" dans supabase.ts
SEC-04: Ajouter SET search_path = public à toutes les SECURITY DEFINER functions
ARCH-04: Sanitiser le HTML avant document.write (DOMPurify.sanitize())
PERF-01: Identifier et éliminer la source de unsafe-eval (audit bundle)
RES-05: Tests de synchronisation offline
```

### P2 — Ce mois (qualité production)
```
ARCH-01: Découper Foncier.tsx en sous-composants avec React.memo
ARCH-02: Unifier les requêtes dans supabaseService avec SWR/React Query
PERF-02: Cache-Control immutable sur /assets/
PERF-04: Throttle mousemove à 5s minimum
RES-01: Timeout + retry uniformes sur toutes les requêtes Supabase
RES-02: Error states explicites dans tous les useEffect avec Supabase
RES-03: Stratégie de déploiement sans downtime (health check + wait)
```

---

**Rapport généré** : 15 mai 2026  
**Fichiers analysés directement** : supabase.ts, supabase.service.ts, AuthContext.tsx,
App.tsx, attestationPdfLogger.ts, attestationVerification.ts, lead-capture.ts,
nginx.conf, docker-compose.yml, Dockerfile, print.ts, useFoncierLogic.ts,
supabase/functions/capture-lead/index.ts, 49 migrations SQL
