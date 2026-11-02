# Registre des arbitrages métier restants — EGS / GNAMBA

**Statut du registre : ouvert.** Ce document consigne les décisions métier qui ne sont pas encore établies et qui bloquent ou conditionnent la mise en production de certaines fonctionnalités techniques. Il ne constitue pas une approbation de mise en production.

## Conventions

- `OPEN` : aucune décision prise, la fonctionnalité reste bloquée (HOLD/BLOCKED) jusqu'à arbitrage.
- `HOLD` : comportement sécurisé conservé en attendant la décision ; aucune donnée n'est exposée, aucun faux succès n'est retourné.
- `APPROVED` : décision prise et implémentée.

Aucune proposition technique présentée ici ne vaut décision métier approuvée.

---

## 1. Formats CSV d'import/export (Foncier)

| Champ | Valeur |
|---|---|
| Question | Quelles colonnes métier sont importables/exportables pour les lots, villages, lotissements, îlots et attestations ? Quelles ressources sont concernées ? |
| Options | (a) Importer/exporter tous les champs des modèles ; (b) Un sous-ensemble de colonnes sûres et documentées ; (c) Aucun import/export CSV tant que le contrat n'est pas défini. |
| Conséquences | (a) Risque d'exposition de données personnelles et d'écritures partielles silencieuses ; (b) Contrat lisible et validable, couverture partielle ; (c) Fonctionnalité indisponible, pas de régression. |
| Comportement sécurisé retenu | `POST /ilots/{ilot_id}/lots/import` et `POST /lots/export` restent en `501 Not Implemented`. Aucun fichier simulé, aucun succès fictif. |
| Fonctionnalités bloquées | Import/export CSV lots fonciers. |
| Validations nécessaires | Définition des colonnes, encodage UTF-8, validation stricche des données, rapport d'erreurs, idempotence, permissions par rôle et par village. |
| Statut | OPEN |

---

## 2. Génération et téléchargement des attestations PDF

| Champ | Valeur |
|---|---|
| Question | Quel est le modèle officiel de l'attestation, quelles mentions, signatures, cachets et formules légales sont requis ? |
| Options | (a) Générer un PDF à partir d'un modèle inventé ; (b) Générer un squelette technique sans contenu juridique ; (c) Attendre le modèle officiel validé. |
| Conséquences | (a) Risque juridique et de non-conformité ; (b) Fournit une URL/QR mais pas de valeur probante officielle ; (c) Fonctionnalité indisponible, pas de régression. |
| Comportement sécurisé retenu | `POST /attestations/{attestation_id}/generate-pdf` et `GET /attestations/{attestation_id}/pdf` restent en `501 Not Implemented`. Aucun contenu juridique, signature ou cachet n'est inventé. |
| Fonctionnalités bloquées | Génération et téléchargement PDF d'attestation. |
| Validations nécessaire | Modèle officiel d'attestation, mentions requises, circuit de signature, contrôle d'accès avant génération/téléchargement, traçabilité. |
| Statut | OPEN |

---

## 3. Export du journal d'audit (PDF / CSV)

| Champ | Valeur |
|---|---|
| Question | Quels événements d'audit sont exportables, avec quels champs, et quels rôles sont autorisés à exporter ? |
| Options | (a) Exporter tous les événements avec tous les champs ; (b) Un sous-ensemble d'événements autorisés et des champs nécessaires seulement ; (c) Aucun export tant que le périmètre n'est pas défini. |
| Conséquences | (a) Risque d'exposition de secrets, mots de passe, jetons et données personnelles ; (b) Export maîtrisé et auditable ; (c) Fonctionnalité indisponible, pas de régression. |
| Comportement sécurisé retenu | `POST /audit/export-pdf` et `POST /audit/export-csv` restent en `501 Not Implemented`. Aucun secret ni donnée personnelle n'est exporté. |
| Fonctionnalités bloquées | Export du journal d'audit. |
| Validations nécessaires | Liste des événements exportables, champs inclus/exclus, matrice rôle → droit d'export, traçabilité des exports sans modification des événements sources. |
| Statut | OPEN |

---

## 4. Conflits de synchronisation hors ligne

| Champ | Valeur |
|---|---|
| Question | Quelle règle de fusion et d'arbitrage s'applique lorsqu'un conflit de sync survient sur une donnée foncière sensible (local, serveur, fusion) ? |
| Options | (a) Dernier écrit gagnant ; (b) Conserver le conflit sans perte et demander une décision manuelle ; (c) Fusion automatique guidée par des règles métier validées. |
| Conséquences | (a) Risque d'écrasement silencieux de données ; (b) Aucune perte de données, résolution manuelle requise ; (c) Dépend de règles métier non encore validées. |
| Comportement sécurisé retenu | `POST /sync/queue/{queue_item_id}/resolve` reste en `501 Not Implemented`. Aucun écrasement automatique, aucune fusion de données sensibles sans règle validée. |
| Fonctionnalités bloquées | Résolution de conflits de sync. |
| Validations nécessaires | Règle d'arbitrage métier, idempotence, identité du propriétaire de la file, contrôle d'accès au moment de la sync, conservation des informations de résolution. |
| Statut | OPEN |

---

## 5. Matrice de permissions rôle × fonction Foncier

| Champ | Valeur |
|---|---|
| Question | Quelles correspondances explicites entre rôles et permissions (`foncier.read`, `foncier.create`, `foncier.update`, `foncier.validate`, `foncier.export`, `foncier.configure`, `foncier.audit.read`, `foncier.audit.export`) ? |
| Options | (a) Accorder toutes les permissions à tous les rôles ; (b) Accorder aucune permission par défaut et attendre la matrice ; (c) Appliquer les correspondances déjà déductibles du code et laisser le reste en attente. |
| Conséquences | (a) Escalade de privilèges, refus par défaut violé ; (b) Fonctionnalité indisponible ; (c) Comportement sécurisé conservé, décisions explicites en attente. |
| Comportement sécurisé retenu | Refus par défaut pour les opérations non autorisées. `foncier.validate` et `foncier.revoke` requièrent le niveau `validateur` sur le village de l'attestation ; `foncier.archive` requiert le niveau `agent` ; `foncier.deliver` requiert le niveau `gestionnaire` ; `foncier.access.manage` est réservé à l'administrateur. Les autres correspondances (foncier.read/create/update/export/configure/audit.*) restent en attente. |
| Fonctionnalités bloquées | Toute opération dont la correspondance rôle/permission n'est pas explicitement validée. |
| Validations nécessaires | Matrice rôle → permission complète, contrôle d'accès côté serveur, vérification du périmètre de la ressource (village), tests positifs et négatifs. |
| Statut | PARTIELLEMENT IMPLÉMENTÉ |

---

## 6. Vérification publique des attestations — données personnelles

| Champ | Valeur |
|---|---|
| Question | Le nom et le prénom du propriétaire doivent-ils être exposés publiquement ? |
| Décision | **NON (décidée et appliquée).** |
| Comportement retenu | La réponse publique de `/attestations/verify/{reference}` ne contient aucune donnée personnelle du propriétaire (`proprietaire` est un objet vide). Seul un résultat minimal non sensible est retourné, vérifié côté serveur. |
| Fonctionnalités concernées | Vérification publique d'attestation (implémentée et testée). |
| Statut | APPROVÉ — implémenté |

---

## Synthèse des statuts

| Arbitrage | Statut | Conséquence technique |
|---|---|---|
| 1. Formats CSV | OPEN | Routes import/export CSV restent en 501 (HOLD) |
| 2. Attestations PDF | OPEN | Routes génération/téléchargement PDF restent en 501 (HOLD) |
| 3. Export journal d'audit | OPEN | Routes export audit CSV/PDF restent en 501 (HOLD) |
| 4. Conflits de sync | OPEN | Route résolution conflit reste en 501 (HOLD) |
| 5. Matrice permissions | OPEN | Refus par défaut, aucune permission attribuée arbitrairement |
| 6. Confidentialité publique attestation | APPROVÉ | Implémenté et testé (proprietaire vide) |
