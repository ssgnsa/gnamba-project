# Master Plan EGS: Transformation d'EGS ERP en plateforme foncière de référence

## 1. Vision stratégique

### Mission d'EGS
Simplifier et moderniser la gestion foncière villageoise en Afrique de l'Ouest, en fournissant une plateforme intégrée qui sécurise les droits fonciers, optimise la gestion des territoires et favorise le développement durable des communautés.

### Vision à 5 et 10 ans
- **5 ans** : Devenir la référence régionale pour la gestion foncière villageoise, avec déploiement dans 50+ villages en Côte d'Ivoire et expansion dans les pays voisins.
- **10 ans** : Établir un écosystème EGS complet (ERP, CRM, IA, mobile, portail client, API publique) servant de plateforme pour la gouvernance foncière nationale et régionale, intégrée aux systèmes nationaux de cadastres.

### Objectifs métier
1. Sécuriser 10 000 parcelles foncières villageoises d'ici 5 ans via des attestations coutumières infalsifiables.
2. Réduire les conflits fonciers de 70% dans les zones d'intervention grâce à la traçabilité et à la validation comité.
3. Augmenter de 40% l'accès au financement agricole pour les petits producteurs grâce à des titres fonciers clairement établis.
4. Intégrer l'IA pour automatiser 60% des tâches administratives (génération de contrats, analyse de plans, recherche documentaire).
5. Développer un SIG intégré permettant la cartographie participative et la mise à jour en temps réel des limites foncières.

### Problématiques du foncier villageois
- Prédominance des transactions informelles basées sur la parole et les témoignages.
- Conflits fréquents liés à l'imprécision des limites parcellaire et aux successions non documentées.
- Manque de traçabilité historique des transactions foncières.
- Difficulté d'accès au crédit foncier due à l'absence de titres reconnus par les institutions financières.
- Pression démographique et foncière accrue entraînant des conflits d'usage entre agriculture, habitation et espaces communs.

### Valeur ajoutée d'EGS
- **Sécurisation juridique** : Attestations coutumières avec signature RSA, hash SHA-256 et QR code vérifiable.
- **Traçabilité complète** : Historique immuable des transactions, successions et litiges.
- **Approche participative** : Validation par le chef de village et le comité foncier intégrée dans le workflow.
- **Résilience hors ligne** : Fonctionnalité complète en mode dégradé avec synchronisation automatique.
- **Intégration SIG** : Localisation précise par GPS et gestion des limites parcellaire.
- **Adaptabilité culturelle** : Prise en compte des coutumes locales (héritage, mariage, conflits) dans les règles métier.

### Positionnement par rapport aux solutions existantes
| Solution | Foncier villageois | SIG intégré | IA | Hors ligne | Coût | Adaptation locale |
|----------|-------------------|-------------|----|------------|------|-------------------|
| **EGS (cible)** | ✅ Spécialisé | ✅ Intégré | ✅ Intégré | ✅ Complet | Open source | ✅ Forte |
| Dolibarr | ❌ Générique | ❌ Plugin | ❌ | ⚠️ Limité | Open source | ❌ Faible |
| ERPNext | ⚠️ Module basique | ⚠️ Tierce partie | ⚠️ Experimental | ❌ | Open source | ❌ Faible |
| Aureus ERP | ❌ Non spécifique | ❌ | ❌ | ❌ | Propriétaire | ❌ |
| LandSphere (open source) | ✅ Foncier national | ✅ | ❌ | ⚠️ | Open source | ⚠️ National, pas villageois |
| Rwanda LMS | ✅ National | ✅ | ❌ | ❌ | Public | ❌ Centralisé |

## 2. Audit complet de l'ERP actuel

### Architecture actuelle
- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Storage) via API REST
- **IA** : Ollama (local) intégré pour résumés financiers et aide contextuelle
- **Offline** : IndexedDB pour le module foncier avec synchronisation exponentielle backoff
- **Architecture** : Monolithique avec séparation préoccupations via composants React et repositories TypeScript
- **État actuel** : Fonctionnel mais avec dettes techniques importantes (@ts-nocheck, logique métier dispersée, tests insuffisants)

### Modules existants
Basé sur `AUDIT_MODULES_ERP_2026-07-14.md`:
- **AVANCÉ** : Clients, Fournisseurs, Locataires, Prospects, Foncier (patterns robustes + tests partiels)
- **MOYEN** : Projets, Employés, Tâches (patterns standards, tests basiques)
- **BASIQUE** : Documents, Finance, Médias, CMS, Bot, Utilisateurs, Sociaux, Produits, Lots publics, Mise en page, Tableau de bord, Tableau de bord employé (QueryResult simple, sans ApiResult)
- **UTILITAIRE** : GenericTable (générique, non typé)

### Schéma de base de données
Analyse partielle via fichiers migrations et rapports :
- **Foncier** : Tables `foncier_lots` (44 colonnes), `foncier_attestations` (52 colonnes), `foncier_attestation_temoins` (9 colonnes) avec indexes optimisés
- **CRM** : Tables `clients`, `fournisseurs`, `employes`, `projets`, `taches`
- **Immobilier** : Tables `proprieties`, `locataires`, `contrats`, `paiements`
- **Finance** : Table `transactions`
- **Documents** : Table `documents` avec stockage Supabase
- **Audit** : Tables `foncier_audit` pour traçabilité
- **Problèmes** : Incohérence des patterns (certaines tables utilisent des schémas génériques), manque de contraintes d'intégrité référentielle dans certains modules

### API
- **Type** : REST via Supabase avec fonctions RPC personnalisées
- **Points forts** : 
  - Fonctions RPC pour hiérarchie foncière (`ensure_foncier_hierarchy`)
  - Génération de références uniques
  - Gestion des attestations avec signature RSA
- **Faiblesses** :
  - Incohérence d'utilisation : certaines pages utilisent Supabase directement (ex: Fournisseurs.tsx) au lieu du repository
  - Manque de documentation centralisée des endpoints
  - Gestion des erreurs non uniformisée

### Sécurité
- **Authentification** : Supabase Auth (email/password, OAuth, téléphone) avec rôle et niveau d'accès
- **Autorisation** : RBAC 4 niveaux (admin, gestionnaire, gerant, secretaire) + niveaux d'accès fins (7 niveaux via `resolveAccessLevel()`)
- **Protection des données** : 
  - RLS policies par table (ex: foncier_lots, foncier_attestations)
  - Hash SHA-256 + signature RSA pour les attestations
  - Nonce anti-replay dans les payloads signés
  - DOMPurify pour assainissement des entrées utilisateur
- **Audit** : Table `foncier_audit` journalisant création/modification/suppression
- **Vulnérabilités connues** : 
  - Aucun CVE critique actif (selon MISSION_CODEX_v6.3.md)
  - Risques liés au `@ts-nocheck` dans Foncier.tsx pouvant masquer des failles de type

### Performances
- **Points forts** :
  - Pagination efficace (PageSize 20) dans foncier
  - Backoff exponentiel pour synchronisation hors ligne
  - Indexes optimisés sur colonnes fréquemment requêtées (référence, village, statut)
- **Faiblesses** :
  - Chargement complet sans pagination dans plusieurs modules (Documents, Médias, Employés)
  - Absence de cache HTTP côté client
  - Requêtes non optimisées dans certains rapports (ex: Statistiques.tsx)

### Dette technique
- **Critique** :
  - `@ts-nocheck` sur 3687 lignes dans Foncier.tsx (masque erreurs TypeScript potentielles)
  - Fonction `handleGenerateAttestation` de 525+ lignes (complexité cyclomatique ~45)
  - 71 variables d'état dans un seul composant Foncier.tsx
  - 0 tests unitaires pour le module foncier
- **Élevée** :
  - Incohérence de patrón : ApiResult vs QueryResult (8 vs 12 modules)
  - Répositories importés mais non utilisés (Fournisseurs.tsx utilise Supabase direct)
  - Couverture de tests extrêmement faible (8/22 modules testés, moyenne 10%)
  - Logique métier dispersée (FoncierContainer, onglets Immobilier fragmentés)
- **Moyenne** :
  - Quelques duplications de code (helpers de validation, formatage)
  - Documentation inline insuffisante (30% dans foncier)
  - Certains hooks non personnalisés pouvant être extraits

### Interfaces utilisateur
- **Points forts** :
  - Excellent support responsive (mobile-first avec safe areas)
  - Thème personnalisable avec validation WCAG
  - Page Builder pour site vitrine avec drag-and-drop
  - Composants UI réutilisables (Toast, Modal, Badge, etc.)
- **Faiblesses** :
  - Incohérence de conception entre modules (certains utilisent des modales, d'autres des pages entières)
  - Manque de pagination dans plusieurs listes (Clients, Médias, Employés)
  - Quelques bugs d'interface (icône Copy manquante dans Documents, classes Tailwind dynamiques non résolues)
  - Largeur fixe dans certains composants (AICopilot)

### Droits utilisateurs
- **Implémentation** : 
  - RBAC centralisé via `resolveAccessLevel()`
  - Niveaux d'accès fins : Admin (tout), Gestionnaire (CRUD foncier/immobilier), Gérant (lecture seule), Secrétaire (saisie assistée)
  - Protection des routes frontend basée sur les rôles
- **Écarts** :
  - Pas de gestion des permissions au niveau champ (ex: masquer le salaire pour certains rôles)
  - Journalisation des accès limitée aux actions CRUD (pas lecture détaillée)
  - Absence de revue d'accès périodique automatisée

### Workflows
- **Foncier** :
  - Création lot → validation doublon local → appel RPC hiérarchie → insertion/supabase ou queue hors ligne → audit log
  - Génération attestation → remplissage 8 onglets → validation Zod → numéro contrôle → hash SHA-256 → QR code → appel Edge Function signature RSA → statut selon succès → sauvegarde → génération HTML impression → audit log
  - Synchronisation hors ligne : détection événement 'online' → traitement queue IndexedDB → resolución conflits (version serveur prioritaire) → backoff exponentiel
- **Immobilier** :
  - Création propriété → validation → insertion → association locataire/contrat
  - Création contrat → génération référence → calcul paiements mensuels → validation dates chevauchement (manquante actuellement)
- **CRM** :
  - Création client → validation → déduplication email/téléphone → insertion → cache local sync
- **Finance** :
  - Créationtransaction → validation → insertion → mise à jour solde
  - Manque de filtres par date et d'export
- **Projets** :
  - Création projet → validation → insertion → lien client
  - Manque de suivi budget réel et lien vers tâches

## 3. Cartographie fonctionnelle

### Foncier
- **L'existant** : Module complet mais monolithique (3662 lignes) avec :
  - CRUD lots avec gestion hors ligne, synchronisation, déduplication
  - Génération d'attestations coutumières avec signature RSA, QR code, hash SHA-256
  - Workflow de validation (agent → chef)
  - Gestion GPS (point avec limites cardinaux
  - Gestion témoins avec empreintes
  - Archivage et références historiques
- **Lacunes** :
  - Absence de tests unitaires et d'intégration
  - Logique métier complexe non testée et difficile à maintenir
  - Pas de gestion avancée des successions et partages
  - Limites dans la gestion des servitudes et droits de passage
  - Intégration SIG basique (points cardinaux) sans couches superposables
- **Améliorations** :
  - → Refactorisation en composants atomiques (LotsTable, AttestationManager, GpsMapper, SuccessionManager)
  - → Ajout de 80+ tests unitaires et d'intégration
  - → Implémentation de la gestion des successions avec règles coutumières
  - → Ajout du support servitudes et droit de passage
  - → Extension du SIG avec couches superposables (zonage, risques, équipements)
  - → Intégration de données drone/imagerie aérienne pour vérification limites
  - → Mise en place d'un moteur de règles métier pour validations automatisées

### Immobilier
- **L'existant** : 
  - 5 onglets bien structurés (Propriétés, Locataires, Paiements, Contrats, Rapports)
  - CRUD complet pour chaque entité
  - Génération de quittances et reçus
  - Statistiques de paiement en attente
- **Lacunes** :
  - Fragmentation de la logique (pas de repository dédié par onglet)
  - Pas de détection de chevauchement de contrats
  - Statut propriété non mis à jour automatiquement à 'loué' lors de création contrat
  - Export CSV omettant adresse propriétaire et propriété
  - Pas de gestion des dépôts de garantie par échelonnement
  - Absence de portail locataire pour consultation solde et demandes
- **Améliorations** :
  - → Création de repositories dédiés par entité (ProprietesRepository, LocatairesRepository, etc.)
  - → Implémentation de la détection de chevauchement de contrats avec overlay calendrier
  - → Mise à jour automatique du statut propriété lors d'activation contrat
  - → Enrichissement export CSV avec adresses complètes
  - → Ajout de scénarios de dépôt de garantie (versement mensuel, garantie bancaire)
  - → Développement d'un portail locataire self-service

### BTP (Projets)
- **L'existant** :
  - CRUD projets avec statut (Devis, Validé, En cours, Terminé, Facturé)
  - Budget prévisionnel (champ unique)
  - Lien vers clients
  - Image de couverture via MediaPicker
  - Filtrage par statut
- **Lacunes** :
  - Pas de suivi des dépenses réelles vs budget
  - Pas de lien vers les tâches du projet
  - Pas de gestion des sous-traitants et factures fournisseurs
  - Absence de planning détaillé ( diagramme de Gantt)
  - Pas de gestion des bons de commande et bons de livraison
  - Aucun module de gestion d'équipes et de pointage
- **Améliorations** :
  - → Implémentation du suivi budgétaire réel avec intégration module finance
  - → Création du lien projet↔tâches avec affichage dans les deux modules
  - → Ajout du module sous-traitants avec gestion contrats et facturation
  - → Intégration d'un planning interactif (diagramme de Gantt) avec dépendances
  - → Gestion complète du cycle achat (bon de commande → bon de livraison → facture)
  - → Module de gestion d'équipes avec pointage, congés et compétences

### Clients (CRM)
- **L'existant** :
  - Modèle de référence avec excellentes pratiques :
    - Normalisation (`normalizeClientRow`)
    - Déduplication (`isClientDuplicateCandidate`)
    - Cache local avec synchronisation (`manualSyncStore`)
    - Tests unitaires corrects (4 tests)
    - CRUD complet avec validation
- **Lacunes** :
  - Pas de lien vers les projets associés (navigation bidirectionnelle manquante)
  - Validation email/téléphone basique
  - Absence de pagination pour gros volumes
  - Pas de scoring client ou d'historique d'interactions détaillé
  - Manque de segmentation avancée (au-delà des 4 types de base)
- **Améliorations** :
  - → Ajout de la navigation bidirectionnelle client↔projets
  - → Renforcement de la validation email/téléphone (regex international, vérification MX)
  - → Implémentation de la pagination côté serveur
  - → Ajout d'un moteur de scoring basé sur historique de paiement et engagement
  - → Création d'un historique complet d'interactions (emails, appels, réunions)
  - → Refinement de la segmentation avec critères supplémentaires (secteur, taille, potentiel)

### Finances
- **L'existant** :
  - CRUD transactions avec type (recette/dépense) et categorie statique
  - Recherche par catégorie, description, référence
  - Statistiques de base (total recettes, dépenses, solde)
  - Impression de reçus
- **Lacunes** :
  - Absence criante de filtre par date (critique pour module financier)
  - Pas d'export CSV/PDF/Excel
  - Aucun graphique de tendance ou de répartition
  - Nom du projet lié stocké mais non affiché
  - Catégories non personnalisables par l'utilisateur
  - Aucune prévision budgétaire ou tableau de flux de trésorerie
- **Améliorations** :
  - → Implémentation du filtre par date avec sélecteur de plage
  - → Ajout des exports multiples (CSV, Excel, PDF) avec mises en page professionnelles
  - → Intégration de graphiques de tendance (courbes, histogrammes) et de répartition (camemberts)
  - → Affichage du nom du projet lié dans les listes et détails
  - → Création d'un gestionnaire de catégories personnalisables
  - → Développement d'un module de prévision budgétaire et de flux de trésorerie

### Documents
- **L'existant** :
  - CRUD documents avec 6 types (contrat, devis, facture, photo chantier, dossier foncier, autre)
  - Upload fichiers vers Supabase Storage (limite 10MB)
  - Liens vers clients et projets
  - Recherche par nom, description
  - Partage via email, WhatsApp, QR code
  - Impression HTML et aperçu avant impression
- **Lacunes** :
  - Bug critique : icône `Copy` non importée provoquant un crash runtime
  - Titre modal statique ("Ajouter") même en édition
  - Pas de filtrage par client/projet ou par date
  - Absence de gestion de versions au-delà du remplacement simple
  - Pas de reconnaissance optique de caractères (OCR) pour recherche plein texte dans PDF/images
  - Aucun workflow de validation ou d'approbation
- **Améliorations** :
  - → Correction urgente de l'import de l'icône `Copy`
  - → Rendement dynamique du titre modal selon l'action (Ajouter/Modifier)
  - → Ajout de filtres avancés (client, projet, date, type de contenu)
  - → Implémentation d'un véritable système de gestion de versions avec branchement
  - → Intégration d'OCR (via Tesseract ou service cloud) pour indexation du contenu
  - → Création de workflows d'approbation personnalisables par type de document
  - → Ajout de fonctionnalités de signature électronique intégrée

### RH (Employés)
- **L'existant** :
  - CRUD employés avec photo, salaire, poste, date embauche, notes
  - Statuts (Actif, Inactif, Congé)
  - Recherche par nom, prénom, poste
  - Gestion de photos via MediaPicker
- **Lacunes** :
  - Absence de champ département
  - Pas d'historique des salaires ou fiches de paie
  - Aucun filtrage par statut
  - Pas d'export CSV/PDF
  - Date d'embauche non affichée dans les listes
  - Absence de gestion des compétences et formations
  - Pas de module de gestion des congés et absences
- **Améliorations** :
  - → Ajout du champ département avec hiérarchie (service → unité → équipe)
  - → Implémentation d'un historique complet des salaires avec génération de fiches de paie
  - → Ajout du filtrage par statut et autres critères
  - → Développement des exports CSV/PDF avec modèle de fiche de paie
  - → Affichage de la date d'embauche dans toutes les vues pertinentes
  - → Création d'un référentiel de compétences avec suivi des formations
  - → Module de gestion des congés avec solde, demandes et validation hiérarchique

### Fournisseurs
- **L'existant** :
  - CRUD fournisseurs avec nom, téléphone, email, produits fournis (texte libre), statut
  - Recherche par nom, téléphone, email
- **Lacunes** :
  - Utilisation directe de Supabase au lieu du repository (anomalie critique)
  - Pas de gestion de catalogue de produits ni de tarifs
  - Absence d'historique des transactions (factures, paiements)
  - Pas de notation ou d'évaluation de performance fournisseur
  - Aucune gestion de contrats fournisseurs
  - Manque de rapprochement bancaire pour les paiements fournisseurs
- **Améliorations** :
  - → Refactorisation pour utiliser systématiquement le suppliersRepository
  - → Création d'un module catalogue fournisseur avec références produits et tarifs
  - → Implémentation d'un historique complet des transactions fournisseur
  - → Ajout d'un système de notation et d'évaluation (qualité, délais, service)
  - → Intégration de la gestion des contrats fournisseur avec renouvellement automatique
  - → Ajout du rapprochement bancaire automatisé pour les paiements fournisseurs

### IA
- **L'existant** :
  - Intégration Ollama local complète (chat, streaming, génération, embeddings)
  - Assistant IA (Copilot) avec actions rapides (résumé financier, tâches, projets, aide)
  - Intégration dans le tableau de bord pour résumés financiers automatisés
  - Détection automatique de disponibilité d'Ollama
  - CSP configuré pour autoriser localhost:11434
- **Lacunes** :
  - Bug de correspondant de messages streaming (duplication après 50 caractères)
  - Pas d'intégration métier spécifique (ex: génération automatique de contrats fonciers)
  - Absence d'analyse de documents (contrats, plans) via IA
  - Pas de recommandations personnalisées basées sur l'historique utilisateur
  - Modèle linguistique non fine-tuné sur le vocabulaire foncier spécifique
  - Absence de feedback loop pour amélioration continue du modèle
- **Améliorations** :
  - → Correction du algorithme de correspondant de messages streaming
  - → Développement de modules métier IA :
    * Génération intelligente de contrats fonciers et immobiliers
    * Analyse de plans CAD/SIG pour détection automatique des limites
    * Extraction d'informations depuis documents scannés (OCR + NLP)
    * Recommandations contextuelles (ex: prochain entretien propriété, suggérer amélioration)
    * Prédiction de risque de litige foncier basé sur historique
  - → Création d'un pipeline d'entraînement continu avec données foncières anonymisées
  - → Intégration d'un feedback utilisateur pour améliorer les réponses
  - → Développement d'un assistant vocal pour opérations mains libres sur terrain

### CRM/Marketing
- **L'existant** : 
  - Module Prospects (Leads) avec :
    - Normalisation avancée (`normalizeLeadRow`)
    - Gestion des canaux (SMS, WhatsApp, Email, Telegram)
    - Scoring basé sur l'engagement
    - Tests unitaires minimaux (1 test)
  - Module Campagnes basique via le module Leads
- **Lacunes** :
  - Pas de deduplication des leads (comme implémenté pour Clients)
  - Absence de nurturing automatisé (séquences d'emails/SMS)
  - Pas de suivi du ROI des campagnes marketing
  - Intégration limitée avec les ventes (pas de conversion lead→client automatisée)
  - Tableau de bord marketing rudimentaire
  - Absence de segmentation avancée basée sur comportement
- **Améliorations** :
  - → Implémentation de la deduplication des leads basée sur email/téléphone normalisés
  - → Création de workflows de nurturing multicanal avec déclencheurs comportementaux
  - → Ajout de suivi détaillé du ROI par campagne et par canal
  - → Développement de l'automatisation lead→client avec scoring seuil dynamique
  - → Enrichissement du tableau de bord marketing avec métabolites avancés (CAC, LTV, taux de conversion)
  - → Implémentation de la segmentation comportementale (RFM, intérêt produit, étape du parcours)

## 4. Réingénierie métier

### Création d'un domaine
- **Règles métier** :
  1. Un domaine doit avoir un nom unique dans le territoire national
  2. Un domaine doit être associé à au moins un village reconnu par l'administration
  3. La création nécessite la validation du chef de village et du chef de canton
  4. Un domaine peut être subdivisé en plusieurs villages ou fractionné entre villages voisins
  5. Historique complet : création, divisions, fusions, changement de nom, affectation spéciale
- **Intégration système** :
  - Nouvelle entité `domaines` avec champ `geometry` pour limites approximatives
  - Processus de validation en 2 étapes (village puis canton) avec workflow dédiée
  - Table d'historique `domaines_historique` journalisant toutes les modifications
  - API REST pour consultation publique des limites de domaine (niveau 1 de précision)

### Création d'une parcelle
- **Règles métier** :
  1. Une parcelle doit appartenir à exactement un village et un domaine
  2. Chaque parcelle doit avoir un numéro unique au sein de son village
  3. La superficie minimale est de 10m² (pour éviter les parcelles fictives)
  4. Les limites doivent être définies par au moins 3 points géographiques non alignés
  5. Toute création/transmission nécessite une enquête parcellaire contradictoire
- **Intégration système** :
  - Extension de `foncier_lots` avec références vers `domaines` et `villages`
  - Validation de l'unicité du numéro de parcelle par village
  - Contrainte de vérification sur la superficie minimale
  - Validation géométrique (non-colinéarité des points) via PostGIS
  - Workflow d'enquête parcellaire avec génération automatique de procès-verbal

### Découpage en lots
- **Règles métier** :
  1. Un lot est une subdivision d'une parcelle destinée à une transaction spécifique
  2. Chaque lot doit avoir une référence unique alphanumérique
  3. Le découpage doit respecter les règles d'urbanisme local (lotissement, densité)
  4. Un procès-verbal de bornage doit accompagner toute création de lot
  5. Les lots résultants doivent couvrir exactement la parcelle d'origine (pas de chevauchement ni de lacunes)
- **Intégration système** :
  - Entité `lots_foncier` détaillée (voir section 5)
  - Génération automatique de référence basée sur schéma village/parcelle/seq
  - Vérification des règles d'urbanisme via micro-service dédié (à intégrer)
  - Génération de PV de bornage avec schémas et coordonnées
  - Validation topologique de couverture et de non-chevauchement via PostGIS
  - Workflow de validation en 3 étapes : géomètre → chef de village → comité foncier

### Réservation
- **Règles métier** :
  1. Une réserve réserve un lot pendant une période déterminée (max 90 jours)
  2. Un dépôt de garantie est requis (10-30% du prix estimé)
  3. La résiliation avant terme entraîne perte partielle du dépôt selon barème
  4. Le réservataire bénéficie d'une priorité d'achat pendant la période de réserve
  5. Aucune autre transaction ne peut être effectuée sur le lot réservé
- **Intégration système** :
  - Nouvelle entité `reservations` avec dates début/fin, montant dépôt, conditions
  - Statut de lot étendu avec valeur `reservee`
  - Calcul automatique des pénalités de résiliation anticipée
  - Notification automatique au réservataire à J-7 et J-1 avant expiration
  - Blocage automatique de toute transaction liée au lot pendant la période de réserve

### Vente
- **Règles métier** :
  1. La vente acte le transfert de propriété définitif contre paiement
  2. Le paiement intégral doit être vérifié avant remise des documents
  3. L'attestation coutumière doit être régénérée avec nouveau propriétaire
  4. Les droits réels servitudes et charges sont transmis avec la propriété
  5. À défaut de paiement complet, la vente peut être résolue unilatéralement par le vendeur
- **Intégration système** :
  - Extension de l'état `statut` dans `foncier_lots` avec valeur `reservee` puis `vendu`
  - Génération automatique de nouvelle attestation avec mise à jour du propriétaire
  - Transmission automatique des servitudes depuis la parcelle mère
  - Création d'enregistrement de transaction dans table `transactions_foncieres`
  - Workflow de résolution de vente non payée avec notification et délai de grâce

### Annulation
- **Règles métier** :
  1. L'annulation peut être à l'initiative de l'acheteur (rétractation) ou du vendeur (résolution)
  2. Délai de rétractation standard : 14 jours après signature
  3. En cas de rétractation acheteur : retour du dépôt moins frais de dossier (10%)
  4. En cas de résolution vendeur pour défaut de paiement : conservation du dépôt après mise en demeure
  5. Le lot retourne à son état précédent (disponible ou réservé selon le cas)
- **Intégration système** :
  - Événements d'annulation créant enregistrements dans table `annulations_ventes`
  - Gestion du retour de dépôt selon scénario (barème prédéfini)
  - Remise à jour du statut du lot et suppression de la réservation associée
  - Régénération éventuelle de l'attestation si propriétaire modifié
  - Journalisation détaillée dans `foncier_audit` avec motif et responsabilité

### Succession
- **Règles métier** :
  1. La succession s'ouvre au décès du propriétaire déclaré
  2. Les héritiers sont déterminés selon règles coutumières locales ou testament
  3. La part de chacun est calculée selon degré de parenté et règles de partage (équitable, lineal, etc.)
  4. Toute indivision nécessite la nomination d'un gérant commun
  5. La vente d'une partie indivise requiert l'accord de tous les indivisaires
  6. Les dettes du défunt sont prélevés sur la succession avant répartition
- **Intégration système** :
  - Nouveaux entités `successions`, `heritiers`, `biens_succession`
  - Moteur de règles coutumières paramétrable par région/ethnie
  - Calcul automatique des parts selon algorithme de succession
  - Gestion de l'indivision avec désignation de gérant et règles de décision
  - Workflow de validation en comité des héritiers
  - Intégration avec module dette pour prélèvement des créances

### Litige
- **Règles métier** :
  1. Un litige naît d'une contestation sur droits, limites, ou obligations liées à un foncier
  2. Toute partie intéressée peut déclarer un litige (propriétaire, voisin, héritier, État)
  3. Le délai de réaction est fixé à 30 jours après notification
  4. La résolution privilégie la conciliation amiable avant recours aux autorités
  5. Toute décision de justice doit être enregistrée et exécutée dans les 90 jours
  6. Le statut du bien passe en `litige` bloquant toute transaction jusqu'à résolution
- **Intégration système** :
  - Nouvelle entité `litiges_fonciers` avec parties, objet, demandes, preuves
  - Workflow de déclaration, instruction, conciliation, jugement
  - Blocage automatique des transactions sur bien en litige
  -Notification des parties à chaque étape avec accusé de réception
  - Exécution automatique des décisions (saisie, expulsion, etc.) via workflow
  - Archivage définitif avec classement par juridiction et numéro de rôle

### Fusion
- **Règles métier** :
  1. La fusion combine deux ou more parcelles contigües en une seule entité
  2. Requiert l'accord unanime de tous les propriétaires concernés
  3. La nouvelle parcelle hérite de l'ensemble des servitudes et charges des parcelles fusées
  4. Le numéro de la nouvelle parcelle suit une séquence spéciale (prefixe FUS)
  5. Une nouvelle enquête parcellaire est obligatoire pour déterminer les nouvelles limites
  6. Les impôts et taxes sont recalculés sur la nouvelle base
- **Intégration système** :
  - Fonction RPC `fusionner_parcelles` avec validation géographique et propriétaire
  - Création nouvelle entrée dans `foncier_lots` avec héritage des charges/servitudes
  - Archivage des anciennes parcelles avec référence vers la nouvelle
  - Génération automatique de nouveau numéro de parcelle FUS-
  - Déclenchement d'enquête parcellaire obligatoire via workflow dédié
  - Recalcul automatique des obligations fiscales via module finance

### Bornage
- **Règles métier** :
  1. Le bornage définit irrévocablement les limites d'une propriété
  2. Doit être effectué par un géomètre-expert agréé en présence des parties intéressées
  3. Les témoins doivent être indépendants et connaître les lieux depuis au moins 10 ans
  4. Le procès-verbal de bornage doit être signé par géomètre, parties et témoins
  5. Toute modification ultérieure nécessite un nouveau bornage contradictoire
  6. Le bornage sert de référence légale en cas de litige frontalier
- **Intégration système** :
  - Nouveaux champs dans `foncier_lots` pour PV de bornage (numero, date, geometre)
  - Stockage du plan de bornage en tant que document associé (type Document)
  - Validation de présence des témoins via signature dans l'attestation
  - Blocage de toute modification des limites GPS après enregistrement du PV
  - Recherche et affichage de tous les bornages liés à une parcelle dans son historique
  - Génération automatique de rapports de conformité aux règles d'urbanisme

### Validation du comité
- **Règles métier** :
  1. Le comité foncier villageois valide les opérations sensibles (ventes > certain seuil, changements d'affectation)
  2. Composition : chef de village, représentants des clans, sages, secrétaire
  3. Décision prise à la majorité simple avec droit de veto du chef pour questions coutumières
  4. Les délibérations sont publiques et font l'objet d'un procès-verbal signé
  5. Le opposition doit être motivée et peut faire l'objet d'un appel au chef de canton
  6. Toutes les décisions sont applicables immédiatement après signature du PV
- **Intégration système** :
  - Module de gestion des comités avec calendrier et convocations
  - Workflow de soumission au comité avec dossier complet (plans, titres, avis techniques)
  - Système de vote électronique avec traçabilité et option de vote présentiel
  - Génération automatique de procès-verbal de séance avec espace pour signatures
  - Gestion des recours et délais d'appel selon réglementation locale
  - Archivage des délibérations avec indexation par date, sujet et numéro de registre

### Historique complet
- **Règles métier** :
  1. Toute modification sur un foncier doit être traçable à l'infinitésimal
  2. L'historique doit contenir : qui, quoi, quand, pourquoi, comment
  3. Les documents associés (plans, attestations, procès-verbaux) doivent être liés et accessibles
  4. L'accès à l'historique est gradué selon les rôles (consultation complète pour admin/juge)
  5. La conservation minimale est de 30 ans après última transaction
  6. L'historique doit être exportable en format standard (CSV, JSON, XML) pour archivage externe
- **Intégration système** :
  - Table `foncier_audit` étendue avec champs contexte et détails JSON
  - Système de liens entre événements et documents stockés
  - Niveaux d'accès configurables par type d'information (public, restreint, confidentiel)
  - Politique de rétention automatisée avec archivage vers stockage froid
  - Module d'export historique avec filtrage avancé et formats multiples
  - Vérification d'intégrité périodique via hash de chaîne (blockchain légère)

## 5. Nouveau modèle de données

### Village
- **Description** : Entité territoriale de base regroupant plusieurs ménages autour d'un chef reconnu
- **Attributs** :
  - `id` (UUID, PK)
  - `nom` (string, unique)
  - `region` (string)
  - `departement` (string)
  - `commune` (string)
  - `chef_nom` (string)
  - `chef_prenom` (string)
  - `date_creation` (timestamp)
  - `statut` (enum: actif, inactif, litige)
  - `population_estimee` (integer)
  - `superficie_totale` (numeric)
  - `geolocalisation` (point, WGS84)
  - `limites_approximatives` (polygon, WGS84)
  - `historique` (jsonb: successifs chefs, événements marquants)
- **Relations** :
  - 1:N domaines (un village peut contenir plusieurs domaines)
  - 1:N parcelles (une parcelle appartient à un village)
  - 1:N comités (un village possède un comité foncier)
  - N:N limites_voisins (relations avec villages limitrophes)
- **Contraintes** :
  - Nom unique au niveau national
  - Géolocalisation dans les limites administratives déclarées
  - Population cohérente avec superficie (densité min/max raisonnable)
- **Index** :
  - `idx_villages_nom` (unique)
  - `idx_villages_geolocalisation` (GIST pour recherches géospatiales)
  - `idx_villages_region_departement` (pour filtrage administratif)
- **Règles métier** :
  - Création nécessite validation autorités préfectorales
  - Modification du nom nécessite procédure officielle de changement de toponymie
  - Suppression interdite (marquage comme inactif uniquement)
  - Héritage automatique des limites administratives départementales

### Domaine
- **Description** : Ensemble foncier géré sous une même autorité coutumière ou administrative
- **Attributs** :
  - `id` (UUID, PK)
  - `nom` (string)
  - `village_id` (UUID, FK → villages)
  - `type` (enum: familial, clanique, institutionnel, privé, mixte)
  - `superficie_totale` (numeric)
  - `date_creation` (timestamp)
  - `fondateur_nom` (string)
  - `fondateur_prenom` (string)
  - `mode_acquisition` (string: héritage, achat, concession, don)
  - `historique` (jsonb: successions, divisions, affectations spéciales)
  - `regeime_foncier` (enum: coutumier, moderne, mixte)
  - `references_cadaster` (string: références au cadastre national si existant)
- **Relations** :
  - N:1 villages (un domaine appartient à un village)
  - 1:N parcelles (un domaine contient plusieurs parcelles)
  - 1:N droits_reels (servitudes, usages, hypothèques)
  - 1:N historiques (un domaine possède un historique détaillé)
- **Contraintes** :
  - Superficie cohérente avec somme des parcelles membres
  - Nom unique au sein du village
  - Type cohérent avec historique et mode d'acquisition
- **Index** :
  - `idx_domaines_nom_village` (unique composé)
  - `idx_domaines_type` (pour filtrage par type)
  - `idx_domaines_geolocalisation` (via jonction avec parcelles)
- **Règles métier** :
  - Transmission selon règles du type (héréditaire pour familial,'élection pour clanique)
  - Modification du type nécessite assemblée générale selon statuts internes
  - Intégration possible avec cadastre national via procédure de concordance

### Parcelle
- **Description** : Unité foncière de base pouvant être détenue, transférée ou grevée
- **Attributs** :
  - `id` (UUID, PK)
  - `numero` (string, unique au sein village)
  - `village_id` (UUID, FK → villages)
  - `domaine_id` (UUID, FK → domaines, nullable pour domaines非 définit)
  - `surface` (numeric, mínima 10.00 m²)
  - `usage_principal` (enum: habitation, agriculture, élevage, commerce, equipement, vide)
  - `usage_secondaire` (array d'enum usage_principal)
  - `date_creation` (timestamp)
  - `proprietaire_initial_id` (UUID, fry → personnes, nullable)
  - `mode_initial_acquisition` (string)
  - `references_cadastre` (string)
  - `geolocalisation_centroide` (point, WGS84)
  - `limites_geometriques` (polygon, WGS84, obligatoire)
  - `statut` (enum: disponible, réservé, vendu, litige, réserve, domaine_public)
  - `historique` (jsonb: transmissions, modifications, événements)
- **Relations** :
  - N:1 villages (une parcelle appartient à un village)
  - N:1 domaines (une parcelle peut appartenir à un domaine)
  - N:1 propriétaires successifs (via historique des transactions)
  - N:N servitudes (une parcelle peut grever ou être grevée par des servitudes)
  - N:N proches (relations de voisinage pour gestion des conflits)
  - 1:N bâtiments (une parcelle peut contenir plusieurs construits)
  - 1:N cultures (suivi des activités agricoles)
- **Contraintes** :
  - Numéro unique au sein du village (contrainte d'unicité composée)
  - Surface minimale de 10.00 m²
  - Géométrie valide (fermée, sans auto-intersections)
  - Usage principal et secondaires cohérents avec réglementation locale
- **Index** :
  - `idx_parcelles_numero_village` (unique composé)
  - `idx_parcelles_geolocalisation` (GIST pour recherches par proximité)
  - `idx_parcelles_usage_principal` (pour statistiques d'utilisation)
  - `idx_parcelles_statut` (pour filtrage rapide par disponibilité)
- **Règles métier** :
  - Numérotation séquentielle révisable uniquement en cas de refonte totale du village
  - Changement d'usage nécessite permis selon réglementation d'urbanisme
  - Division/subdivision suit procédure de création de lot
  - Fusion suit procédure spécifique avec validation géographique
  - Tout changement de géométrie nécessite nouveau bornage contradictoire

### Lot
- **Description** : Subdivision d'une parcelle créée pour une transaction spécifique
- **Attributs** :
  - `id` (UUID, PK)
  - `parcelle_id` (UUID, FK → parcelles)
  - `reference` (string, unique globale)
  - `numero_lot` (string)
  - `numero_ilot` (string)
  - `nom_lotissement` (string)
  - `surface` (numeric)
  - `usage_previste` (enum correspondant à usage_principal parcelle)
  - `date_creation` (timestamp)
  - `statut` (enum: disponible, réservé, sous-offre, vendu, annulé, litige)
  - `prix_vente_estime` (numeric)
  - `prix_vente_final` (nullable, numeric)
  - `date_vente` (timestamp, nullable)
  - `geolocalisation_centroide` (point, dérivée de parcelle)
  - `limites_geometriques` (polygon, dérivée de parcelle avec sous-division)
  - `bornage_effectue` (boolean)
  - `date_bornage` (timestamp, nullable)
  - `geometre_id` (UUID, fry → personnes, nullable)
  - `pv_bornage_reference` (string, nullable)
  - `historique` (jsonb: changements de statut, prix, événements)
- **Relations** :
  - N:1 parcelles (un lot appartient à une parcelle)
  - N:1 propriétaires successifs (via historique des transactions)
  - 1:N réservations (un peut avoir zéro, une ou plusieurs réservations dans le temps)
  - 1:N transactions (une vente génère une transaction enregistrée)
  - 1:N attestations (un lot peut avoir plusieurs attestations au fil du temps)
  - N:N rapports_voisinage (relations avec lots adjacents pour servitudes)
- **Contraintes** :
  - Référence unique globale (format: LOT-YYYY-NNNNN)
  - Surface doit être inférieure ou égale à celle de la parcelle parente
  - Géométrie doit être strictement contenue dans celle de la parcelle parente
  - Statut cohérent avec historique (pas de retour en arrière interdit sans motif)
- **Index** :
  - `idx_lots_reference` (unique)
  - `idx_lots_parcelle_id` (pour requêtes par parcelle)
  - `idx_lots_statut` (pour filtrage rapide)
  - `idx_lots_geolocalisation` (GIST pour recherches géospatiales)
  - `idx_lots_date_vente` (pour historiques temporels)
- **Règles métier** :
  - Numérotation suivant schéma : LOT-<AAAA>-<NNNNN> où NNNNN séquentiel par année
  - Création nécessite procédure de découpage avec validation géographique
  - Changement de statut suit workflow défini (réservation → vente → annulation, etc.)
  - Toute modification de géométrie nécessite nouveau bornage et mise à jour attestation
  - La vente effective nécessite paiement vérifié et génération nouvelle attestation

### Propriétaire
- **Description** : Personne physique ou morale ayant des droits sur un foncier
- **Attributs** :
  - `id` (UUID, PK)
  - `type` (enum: physique, morale)
  - `nom` (string)
  - `prenom` (string, nullable pour morales)
  - `date_naissance` (date, nullable pour morales)
  - `lieu_naissance` (string)
  - `genre` (enum: M, F, X, non_binaire)
  - `nationalite` (string, code ISO 3166-1 alpha-2)
  - `piece_identite` (string: type et numéro)
  - `date_delivrance_piece` (date)
  - `lieu_delivrance_piece` (string)
  - `profession` (string)
  - `secteur_activite` (string)
  - `adresse_residence` (string)
  - `adresse_postale` (string)
  - `telephone_principal` (string)
  - `telephone_secondaire` (string, array)
  - `email_principal` (string)
  - `email_secondaire` (string, array)
  - `statut` (enum: actif, inactif, decede, inconnu)
  - `date_deces` (date, nullable)
  - `lieu_deces` (string, nullable)
  - `photo_id_url` (string, nullable)
  - `empreinte_url` (string, nullable)
  - `competences` (array string: compétences professionnelles)
  - `centres_interet` (array string: domaines d'intérêt)
  - `historique` (jsonb: changements d'état, événements de vie)
- **Relations** :
  - 1:N propriétés (un propriétaire peut avoir plusieurs parcelles/lots)
  - 1:N succèsions (en tant que défunt ou héritier)
  - 1:N représentés (pour personnes morales: représentants légaux)
  - N:N liens_familiaux (mariage, parenté, adoption)
  - 1:N créances (en tant que débiteur ou créancier)
  - 1:N dettes (en tant que débiteur ou créancier)
  - N:N partenaires (relations d'affaires)
- **Contraintes** :
  - Pour personnes physiques : présence obligatoire de nom/prenom ou raison sociale
  - Format pièce identité conforme réglementation nationale (CNI, passeport, etc.)
  - Email et téléphone conforme standards internationaux (RFC 5322, E.164)
  - Âge cohérent avec date de naissance et date décès (si applicable)
- **Index** :
  - `idx_propriétaires_nom_prenom` (pour recherches par nom)
  - `idx_propriétaires_piece_identite` (unique pour type CNI)
  - `idx_propriétaires_email_principal` (pour recherches rapides)
  - `idx_propriétaires_telephone_principal` (pour recherches rapides)
  - `idx_propriétaires_date_naissance` (pour analyses démographiques)
- **Règles métier** :
  - Vérification d'identité requise pour toute première propriété enregistrée
  - Mise à jour des coordonnées nécessite justification (facture, attestation de domicile < 3 mois)
  - Transmission des droits soumis à règles de succession ou contrat
  - Personne décédée ne peut plus acquérir de nouveaux droits (transmission uniquement)
  - Conjugue Régime des biens communs selon mariage (comunauté réduite aux acquêts, séparation, etc.)

### Ayant droit
- **Description** : Personne ayant un droit successoral ou connexe sur un foncier sans être propriétaire enregistré
- **Attributs** :
  - `id` (UUID, PK)
  - `personne_id` (UUID, FK → personnes)
  - `bien_id` (UUID, FK → parcelles ou lots)
  - `type_droit` (enum: héritier réservataire, héritier ordinaire, légataire, usufruitier, nu-propriétaire, créancier privilégié)
  - `origine_droit` (enum: succession, donation, jugement, contrat)
  - `quote_part` (numeric: fraction ou montant selon type)
  - `date_acquisition` (timestamp)
  - `date_extinction` (timestamp, nullable: pour droits temporaires comme usufruit)
  - `conditions` (string: conditions particulières d'exercice)
  - `exercicio` (boolean: si le droit est actuellement exercé)
  - `historique` (jsonb: exercices, mainlevées, transmissions)
- **Relations** :
  - N:1 personnes (un ayant droit est associé à une personne)
  - N:1 biens (un ayant droit se rapporte à un bien spécifique)
  - 1:N événements (un ayant droit peut générer plusieurs événements juridiques)
  - N:N conflits (un ayant droit peut être partie à plusieurs litiges)
- **Contraintes** :
  - Quote-part cohérente avec type de droit et règles applicables
  - Date d'extinction postérieure à date d'acquisition pour droits temporaires
  - Un seul usufruitier ou nu-propriétaire actif à la fois pour même bien
- **Index** :
  - `idx_ayants_droits_personne_bien` (unique composé)
  - `idx_ayants_droits_type_droit` (pour statistique par type)
  - `idx_ayants_droits_date_acquisition` (pour historiques temporels)
  - `idx_ayants_droits_bien_id` (pour recherches par bien)
- **Règles métier** :
  - Création automatique lors d'ouverture de succession ou de acte libéral
  - Extinction selon termes du contrat ou jugement (vente, renonciation, décès)
  - Exercice du droit soumis à conditions (ex: résidence principale pour usage habitation)
  - Transmission possible selon nature du droit (certains sont incessibles, d'autres transmissibles)
  - Priorité légale appliquée en cas de concours de créanciers (privilèges, hypothèques)

### Vente
- **Description** : Acte transférant la propriété d'un foncier contre paiement
- **Attributs** :
  - `id` (UUID, PK)
  - `lot_id` (UUID, FK → lots)
  - `vendeur_id` (UUID, FK → personnes)
  - `acheteur_id` (UUID, FK → personnes)
  - `date_vente` (timestamp)
  - `prix_vente` (numeric)
  - `mode_paiement` (enum: espèces, virement, mobile_money, chèque, mixte)
  - `references_paiement` (string: références de transaction bancaire ou mobile)
  - `frais_notaire` (numeric, nullable)
  - `frais_agence` (numeric, nullable)
  - `autres_frais` (numeric, nullable)
  - `net_vendeur` (numeric: prix moins frais)
  - `conditions_speciales` (string: réserves, délais, garanties)
  - `garanties` (array string: garanties offertes)
  - `references_acte` (string: numéro au rang des minutes ou au folio)
  - `statut` (enum: envisagée, conclue, annulée, litige, exécutée)
  - `date_execution` (timestamp, nullable: quand transfert effectif effectué)
  - `historique` (jsonb: négociations, conditions suspensives, paiements échelonnés)
- **Relations** :
  - N:1 lots (une vente concerne un lot spécifique)
  - N:1 personnes (en tant que vendeur)
  - N:1 personnes (en tant qu'acheteur)
  - 1:N paiements (une vente peut générer plusieurs échelonnements de paiement)
  - 1:N documents associés (acte de vente, attestation, reçus)
  - N:N limitrophes_affectés (lots voisins impactés par changement de propriétaire)
- **Contraintes** :
  - Prix de vente positif et cohérent avec estimation préalable
  - Date de vente antérieure ou égale à date d'exécution
  - Références de paiement valides et traçables
  - Un même lot ne peut faire l'objet de deux ventes Effectives simultanées
  - Respect du droit de préemption légal ou conventionnel s'il existe
- **Index** :
  - `idx_ventes_lot_id` (pour recherches par lot)
  - `idx_ventes_date_vente` (pour historiques temporels)
  - `idx_ventes_statut` (pour suivi du pipeline)
  - `idx_ventes_acheteur_vendeur` (pour analyses de réseau)
- **Règles métier** :
  - Vérification de capacité du vendeur à vendre (pas sous tutelle, pas déjà vendu)
  - Vérification de capacité de l'acheteur à acquérir (pas mineur non émancipé, pas interdit)
  - Ablation de toute réserve ou promesse antérieure sur le lot
  - Génération automatique de nouvelle attestation avec mise à jour propriétaire
  - Application des Plus-values immobilières si applicable selon législation fiscale
  - Enregistrement obligatoire auprès des services fonciers dans délai légal

### Paiement
- **Description** : Transfert de fonds dans le cadre d'une transaction foncière ou d'un service
- **Attributs** :
  - `id` (UUID, PK)
  - `transaction_id` (UUID, FK → ventas ou autres transactions)
  - `montant` (numeric)
  - `date_paiement` (timestamp)
  - `mode_paiement` (enum: espèces, virement, mobile_money, chèque, titre, compensation)
  - `references` (string: numéro de chèque, référence de virement, ID de transaction mobile)
  - `destinataire` (string: nom du bénéficiaire selon mode)
  - `compte_origine` (string, nullable: IBAN ou numéro de compte)
  - `compte_destinataire` (string, nullable: IBAN ou numéro de compte porte-monnaie)
  - `motif` (string: achat, loyer, frais de service, pénalité, etc.)
  - `statut` (enum: prévu, reçu, en_cours, échoué, remboursé, litige)
  - `frais_bancaire` (numeric, nullable: frais prélevés par intermédiaires)
  - `taux_change` (numeric, nullable: pour paiements en devises étrangères)
  - `montant_net` (numeric: montant moins frais)
  - `recu_numero` (string, nullable: numéro de reçu généré)
  - `historique` (jsonb: tentatives, notifications, litiges liés au paiement)
- **Relations** :
  - N:1 transactions (un paiement appartient à une transaction spécifique)
  - 1:N tentatives (un paiement peut générer plusieurs tentatives en cas d'échec)
  - 1:N litiges (un paiement peut être sujet à plusieurs réclamations)
  - N:N comptes_bancaires (lien avec comptes utilisés pour émission/réception)
- **Contraintes** :
  - Montant positif et cohérent avec obligation due
  - Références de paiement valides selon mode (format IBAN pour virement, etc.)
  - Date de paiement dans fenêtre raisonnable autour de date d'échéance
  - Un même paiement ne peut être comptabilisé deux fois (prévention doublon)
  - Respect des plafonds et limites selon mode de paiement (ex: plafonds mobile money)
- **Index** :
  - `idx_paiements_transaction_id` (pour recherches par transaction)
  - `idx_paiements_date_paiement` (pour historiques temporels)
  - `idx_paiements_statut` (pour suivi du flux de trésorerie)
  - `idx_paiements_mode_paiement` (pour répartition par moyen)
- **Règles métier** :
  - Encaissement effectif requis avant considération comme paiement reçu
  - Gestion des échecs avec retry selon politique (ex: 3 tentatives avec backoff)
  - Conciliation automatique avec relevés bancaires lorsque disponible (continué partie e error: Agent failed (Function process_single_item_agent was terminated or killed after 20.004418849945068 seconds), API failed (API request returned None after all retries)]