# Scénario B — Tableau de bord module foncier

**Objectif :** suivi du parcours complet village → lotissement → îlot → lot → dossier bénéficiaire → pièces → contrôle → préparation du document → impression → signature physique du chef → dépôt du scan signé → contrôle de concordance → confirmation de délivrance → vérification publique → révocation ou remplacement.

**Conventions :**
- `PASS` : implémenté, testé, conforme.
- `ÉCART` : fonctionnalité manquante ou affaiblie, à corriger si réalisable.
- `BLOCKED` : bloqué par une dépendance métier non fournie (modèle officiel, contrats CSV, règles de sync).
- `HOLD` : maintenu non opérationnel en attendant une décision (501 avec message explicite).

| # | Parcours | Résultat attendu | État constaté | Écart | Action | Dépendance métier | Test | Preuve |
|---|----------|------------------|---------------|-------|--------|-------------------|------|--------|
| 1 | Connexion / authentification | Accès API authentifié, session renouvelée | PASS (routes auth existantes) | Aucun | Vérifier CORS et proxy local | Aucune | test_auth | /health, /ready |
| 2 | Création village | Village créé, code unique | PASS | Aucun | Aucun | Aucune | API test | router villages |
| 3 | Création lotissement | Lotissement lié à un village | PASS | Aucun | Aucun | Aucune | API test | router lotissements |
| 4 | Création îlot | Îlot lié à un lotissement | PASS | Aucun | Aucun | Aucune | API test | router îlots |
| 5 | Création lot | Lot avec référence unique, pas de doublon | PASS | Aucun | Aucun | Aucune | API test | check_duplicate, unique index |
| 6 | Création attestation (brouillon) | Attestation brouillon créée, référence générée | PASS | Aucun | Aucun | Aucune | API test | service create |
| 7 | Soumission (brouillon→soumis) | Statut passe à "soumis", agent nommé | PASS | Aucun | Aucun | Aucune | API test | service submit |
| 8 | Validation (soumis→valide) | Statut passe à "valide", chef nommé | PASS | Aucun | Aucun | Aucune | API test | service validate |
| 9 | Préparation à signer | Document prêt, pas encore délivré | ÉCART | Route `print` couvre la préparation physique, mais pas de route distincte nommée "préparer à signer" | Définir si une route intermédiaire séparée est nécessaire | Rôle de l'acteur préparateur | À définir | — |
| 10 | Impression | Compteur d'impression incrémenté, `printed_by`/`printed_at` enregistrés | PASS | Aucun | Route `POST /attestations/{id}/print` ajoutée (exige statut `valide`) | Aucune | test_print_attestation_requiert_statut_valide | router + service print |
| 11 | Signature physique du chef | Signature sur papier (hors ERP) | PASS (hors ERP) | Aucun | Aucune | Aucune | Hors scope ERP | — |
| 12 | Dépôt du scan signé | Scan stocké, statut passe à "archive" | PASS | Aucun | Aucun | Aucun | API test | service scan |
| 13 | Contrôle de concordance | Scan vérifié avant délivrance (refus si pdf_media_id absent) | PASS | Aucun | Route `deliver` vérifie la présence du scan signé | Rôle de l'acteur contrôleur | test_deliver_attestation_refuse_sans_scan_signe | router + service deliver |
| 14 | Confirmation de délivrance | Délivrance confirmée uniquement si scan signé joint, événement d'audit | PASS | Aucun | Route `POST /attestations/{id}/deliver` ajoutée (refus si pas de scan) | Acteur habilité à confirmer | test_deliver_attestation_accepte_avec_scan_signe | router + service deliver |
| 15 | Vérification publique | Réponse minimale liste blanche, pas de données perso | PASS | Aucun | Aucun | Aucune | test sécurité | router verify + test |
| 16 | Révocation | Statut "revoque", visible en public | PASS | Aucun | Aucun | Aucune | API test | service revoke |
| 17 | Remplacement | Nouvelle attestation, ancien révoqué | ÉCART | Pas de route de remplacement explicite | Définir si nécessaire | Règle de remplacement | À définir | — |
| 18 | Recherche / consultation | Liste lots, filtres, pagination | PASS | Aucun | Aucun | Aucune | test régression | search_lots, list_lots_by_ilot |
| 19 | Permissions par action et village | Refus par défaut, contrôle serveur | ÉCART | Matrice rôle×permission non définie | Refus par défaut conservé, pas d'attribution arbitraire | Matrice B.6 (OPEN) | test sécurité | router access |
| 20 | Stockage privé des documents | Fichiers derrière autorisation API | PASS | Aucun | Aucun | Aucune | — | storage_files_router |
| 21 | Import/export CSV | Selon contrats approuvés | HOLD (501) | Colonnes et règles non définies | Maintenir 501 | Contrats CSV (OPEN) | — | router 501 |
| 22 | Audit et export contrôlé | Événements traçables, export selon règles | HOLD (501) | Événements exportables non définis | Maintenir 501 | Contrats audit (OPEN) | — | router 501 |
| 23 | Politique synchronisation | Conflits conservés sans perte | HOLD (501) | Règles de fusion non définies | Maintenir 501 | Politique sync (OPEN) | — | router 501 |
| 24 | Sauvegarde / restauration | Base et documents restaurables | ÉCART | Pas de procédure documentée | Documenter procédure | Aucune | — | À créer |
| 25 | Génération PDF officielle | Modèle configurable, numéro unique | BLOCKED | Modèle officiel et autorité émettrice non fournis | Maintenir 501 | Modèle officiel (OPEN) | — | router 501 |

## Décisions métier à regrouper (fiche unique)

| Décision | Statut | Détail |
|----------|--------|--------|
| Modèle officiel d'attestation | **En attente** | Contenu, mentions, signatures, cachets non fournis. Délivrance PDF bloquée. |
| Autorité émettrice | **En attente** | Qui émet, signe, délivre officiellement. |
| Acteur confirmant la délivrance dans l'ERP | **En attente** | Rôle habilité à confirmer la délivrance après scan. |
| Rôles réels et périmètres village | **En attente** | Matrice rôle × permission `foncier.*` (B.6 point 5 = OPEN). |
| Colonnes et règles CSV | **En attente** | Contrats d'import/export non définis. |
| Événements et champs exportables de l'audit | **En attente** | Périmètre d'export non déterminé. |
| Politique hors ligne et résolution des conflits | **En attente** | Règle de fusion non validée. |
| Confidentialité publique (pas de nom/prénom propriétaire) | **ACQUIS** | Implémenté et testé (`proprietaire={}`). |
| Chef signe physiquement sur papier | **ACQUIS** | Aucun compte ERP chef de village nécessaire. |
| Aucune délivrance sans scan signé | **ACQUIS** | À renforcer par une confirmation transactionnelle. |

**Règle de travail :** ne pas attribuer de permissions à des comptes réels sans approbation. Ne pas déduire une autorisation métier de la seule présence d'un rôle dans le code. Ne pas inventer de contenu juridique, signature ou cachet.

## Travaux indépendants réalisés

1. ✅ Renforcer la délivrance : routes `print` (impression, exige statut valide) et `deliver` (confirmation de délivrance, refuse si pas de scan signé, événement d'audit) ajoutées. Tests : `test_print_attestation_requiert_statut_valide`, `test_deliver_attestation_refuse_sans_scan_signe`, `test_deliver_attestation_accepte_avec_scan_signe`.
2. ✅ Vérifier le refus par défaut des permissions : test `test_foncier_policy_rejects_unapproved_authenticated_roles` (403 pour rôle non autorisé), contrôle serveur par action/objet/village effectif.
3. ⬜ Documenter la procédure de sauvegarde/restauration et le déploiement/retour arrière (en attente).
4. ✅ Maintenir les 501 avec messages explicites (pas de faux succès) : 7 routes 501 maintenues.

## Travaux restants (bloqués par dépendance métier)

- Documenter sauvegarde/restauration et déploiement/retour arrière (dépend de l'infrastructure cible).
- Génération PDF officielle (BLOCKED : modèle officiel et autorité émettrice non fournis).
- Import/export CSV, export audit, résolution de sync (HOLD : contrats non définis).
- Route de remplacement d'attestation (ÉCART : règle de remplacement non définie).
