# Foncier — Suivi des corrections

## Portée

Correction fonctionnelle du module Foncier selon les constats de `AUDIT_FONCIER_INTERACTIONS_REPORT.md`. La validation métier B.6 reste ouverte : cette intervention ne modifie ni rôles, ni ACL, ni permissions, ni politique d’autorisation.

## Corrections appliquées

- La configuration village est désormais écrite par la route du repository Foncier dans `foncier_villages.config_jsonb`; les erreurs de chargement, village introuvable ou mise à jour ne sont plus traitées comme une sauvegarde réussie.
- La configuration `config_jsonb` est prioritaire à la lecture. Les anciennes valeurs `app_settings` restent un recours de compatibilité quand aucune configuration n’existe dans le village; une réponse vide ne fabrique plus une configuration par défaut qui écraserait les valeurs de la base.
- Les deux chemins de sauvegarde (modal de configuration et hook Villages) utilisent le même stockage et propagent l’échec au formulaire.
- Le type partagé du lot expose les champs GPS utilisés par l’API courante. L’impression ne prétend plus que les limites textuelles de l’attestation proviennent du lot; elle reprend les valeurs sauvegardées sur l’attestation.
- Le workflow Foncier n’utilise plus de propriété `name` absente du type `UserProfile` pour afficher le nom d’utilisateur.

## État des autres constats de l’audit

- Les onglets Attestations et Workflow disposent d’interfaces dans l’état courant du dépôt; les appels et transitions n’ont pas été validés en exécution dans cette étape.
- CORS : la configuration locale `localhost:5173` est présente dans les valeurs par défaut du code courant, mais l’essai navigateur/API et la politique d’origines entre développement et production restent à confirmer. Aucun élargissement d’origines ni changement d’autorisation n’est effectué ici.
- Les règles de permissions rôle par rôle restent hors de cette correction tant que B.6 n’est pas clôturée.
- L’impression, le parcours complet d’attestation, le workflow Chef, l’audit et la synchronisation hors ligne restent à valider au runtime.

## Contrôles et verdict

- `git diff --check` : réussi.
- Tests, typecheck et parcours runtime : non exécutés dans cette étape.
- Aucune migration, écriture de base de données, modification de schéma, de rôle ou d’ACL effectuée.
- Aucun commit, push ou déploiement.

**Verdict : GO SOUS RÉSERVES pour poursuivre la validation fonctionnelle Foncier.** La correction de persistance est appliquée; la sortie complète du module n’est pas déclarée GO tant que les contrôles runtime et l’origine CORS autorisée ne sont pas établis.
