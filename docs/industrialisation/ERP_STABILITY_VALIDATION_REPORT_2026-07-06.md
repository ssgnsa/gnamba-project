# Rapport de stabilité ERP - 2026-07-06

## Objectif

Qualifier l'ERP EGS self-hosted en conditions d'usage interne continu, sans migration d'architecture et sans réintroduire Supabase Cloud.

## Mode de validation ERP

Un protocole automatisé est disponible via :

```text
npm run erp:validate -- --api-base-url http://127.0.0.1:8000 --logical-minutes 30
```

Options utiles :

- `--web-base-url http://127.0.0.1:5173 --browser` : ajoute une navigation UI Puppeteer si Chromium est disponible.
- `EGS_VALIDATION_EMAIL` / `EGS_VALIDATION_PASSWORD` : surcharge le compte de test.
- `--output <fichier.json>` : écrit le rapport brut JSON à un chemin défini.

Le script exécute une simulation logique longue sur 30 minutes continues par défaut, sous forme de cycles API successifs, sans attente murale artificielle.

## Tests effectués

| Domaine | Couverture |
|---|---|
| Authentification | `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, re-login |
| Session | persistance token, multi-session simulée, refresh après access token invalide |
| Navigation modules | équivalents API des modules utilisateurs, projets, médias, finances, employés, fournisseurs, fournitures |
| CRUD métier | création, modification, liste, suppression sur projets, employés, fournisseurs, produits, finance |
| Résilience | erreur API 404 contrôlée, perte réseau temporaire simulée, reprise `/auth/me` après retour réseau |
| Usage continu | 30 cycles logiques sur endpoints métier et auth |
| Anti-Supabase | scan `src/`, scan `dist-local`/`dist` si présent, blocage `/functions`, `/storage/v1`, `/rest/v1`, `supabase.co`, `supabase.in`, SDK direct, chunk `supabase-vendor` |
| UI navigateur | optionnel via Puppeteer avec capture des erreurs console et appels réseau interdits |

## Résultats de la validation courante

Rapport brut :

```text
docs/industrialisation/validation-runs/erp-operational-validation-2026-07-06T19-00-22-059Z.json
```

Commandes exécutées :

```text
npm run selfhosted:guard
npm run erp:validate -- --api-base-url http://127.0.0.1:8000 --web-base-url http://127.0.0.1:5173 --browser --logical-minutes 30
npm run test:run -- src/api/client.settings.test.ts src/lib/__tests__/attestationVerification.test.ts src/lib/__tests__/supabase.selfhosted.test.ts
npm run typecheck
npm run build
```

Résultats :

| Test | Résultat |
|---|---|
| `selfhosted:guard` | OK, aucun pattern Supabase interdit dans `src/` |
| Login `/api/v1/auth/login` | OK, access token + refresh token |
| Session `/api/v1/auth/me` | OK |
| Refresh `/api/v1/auth/refresh` | OK |
| Multi-session simulée | OK |
| CRUD projets | OK |
| CRUD employés | OK |
| CRUD fournisseurs | OK |
| CRUD produits/fournitures | OK |
| CRUD finance | OK |
| Médias / brand assets | OK en lecture |
| Expiration/invalidation access token + refresh | OK |
| Perte réseau temporaire simulée + reprise | OK |
| Simulation longue | OK, 30 minutes logiques, 30 requêtes |
| Scan build courant | OK sur `dist-local`, 63 fichiers scannés |
| Tests Vitest ciblés | OK, 3 fichiers, 7 tests |
| TypeScript | OK après correction `AuthContext` |
| Build | OK, généré dans `dist-local` |
| Navigateur Puppeteer | Non exécuté : Chromium échoue sur `libatk-bridge-2.0.so.0` manquante |

## Corrections appliquées

- Ajout du mode de validation opérationnelle `scripts/erp-operational-validation.mjs`.
- Ajout de la commande `npm run erp:validate`.
- Ajout du présent rapport de stabilité.
- Correction TypeScript ciblée dans `src/context/AuthContext.tsx` : suppression de la dépendance circulaire du callback `refreshLocalSession`.

Aucune migration structurelle, aucun nouveau système externe, aucune dépendance Supabase Cloud n'a été ajoutée.

## Comportement auth attendu

- Login retourne un access token et un refresh token.
- `/auth/me` reste cohérent pendant la navigation normale.
- Un access token invalide ou expiré est récupérable via `/auth/refresh` si le refresh token est valide.
- Le logout FastAPI est stateless dans l'implémentation actuelle; la sécurité côté frontend repose sur la suppression locale des tokens après `/auth/logout`.

## Matrice de risques restants

| Niveau | Risque | Statut |
|---|---|---|
| Critique | Appel Supabase Cloud depuis le frontend ou le build courant | Bloqué par `selfhosted:guard` et `erp:validate`; `dist-local` propre |
| Critique | CRUD principal instable | Non observé sur API locale |
| Moyen | Ancien `dist/` root-owned contient encore des chunks Supabase hérités | Ne pas servir `dist/`; servir `dist-local` ou purger `dist/` avec droits root |
| Moyen | Validation navigateur absente si Chromium système manque | Échec environnemental confirmé : `libatk-bridge-2.0.so.0` manquante |
| Moyen | Logout backend stateless, tokens déjà émis valides jusqu'à expiration | Acceptable pour usage interne si TTL court; à renforcer plus tard par révocation serveur si exigée |
| Faible | Données de validation résiduelles si interruption brutale du script | Les IDs sont préfixés `OPS-VALIDATION-*` et nettoyables manuellement |

## Verdict final

ERP utilisable interne stable : **OUI**, pour l'API locale FastAPI et le build courant `dist-local`.

Conditions restantes :

- Ne pas déployer l'ancien dossier `dist/` tant qu'il contient des artefacts Supabase hérités.
- Exécuter le parcours navigateur sur une machine disposant des bibliothèques Chromium complètes.
