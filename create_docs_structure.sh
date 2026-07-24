#!/bin/bash

# Définir le chemin de base
BASE_DIR="/home/soma/gnamba-project/docs/project"

# Créer les répertoires
mkdir -p "$BASE_DIR"
mkdir -p "$BASE_DIR/CHECKLISTS"
mkdir -p "$BASE_DIR/MODULES"

# Créer les fichiers principaux avec en-têtes
cat > "$BASE_DIR/PROJECT.md" << 'EOF'
# Vision et Objectifs du Projet

## Vision
[Décrire la vision globale du projet]

## Objectifs
- [Objectif 1]
- [Objectif 2]
- [Objectif 3]

## Périmètre
[Définir le périmètre du projet]
EOF

cat > "$BASE_DIR/ARCHITECTURE.md" << 'EOF'
# Architecture Officielle

## Vue d'ensemble
[Description de l'architecture]

## Composants principaux
- [Composant 1]
- [Composant 2]

## Diagrammes
[Liens vers les diagrammes d'architecture]
EOF

cat > "$BASE_DIR/SOURCE_OF_TRUTH.md" << 'EOF'
# Référentiel Unique

## Sources de vérité
[Liste des sources officielles pour chaque type d'information]

## Règles de mise à jour
[Comment et quand mettre à jour ce référentiel]
EOF

cat > "$BASE_DIR/CURRENT_TASK.md" << 'EOF'
# Mission en Cours

## Tâche actuelle
- **Description** : 
- **Responsable** : 
- **Date de début** : 
- **Deadline** : 
- **Statut** : 

## Contexte
[Contexte de la tâche en cours]

## Critères de succès
- [ ] Critère 1
- [ ] Critère 2
EOF

cat > "$BASE_DIR/SESSION_STATE.md" << 'EOF'
# Dernier État avant Arrêt

## Date et heure
[Dernière mise à jour]

## État actuel
[Description de l'état du projet]

## Prochaines étapes
1. [Étape 1]
2. [Étape 2]

## Blocages éventuels
[Liste des blocages]
EOF

cat > "$BASE_DIR/TODO.md" << 'EOF'
# Tâches Priorisées

## Haute priorité
- [ ] [Tâche 1]
- [ ] [Tâche 2]

## Moyenne priorité
- [ ] [Tâche 3]
- [ ] [Tâche 4]

## Basse priorité
- [ ] [Tâche 5]
- [ ] [Tâche 6]
EOF

cat > "$BASE_DIR/ROADMAP.md" << 'EOF'
# Lots de Développement

## Phase 1 - [Nom]
- [ ] [Tâche 1.1]
- [ ] [Tâche 1.2]

## Phase 2 - [Nom]
- [ ] [Tâche 2.1]
- [ ] [Tâche 2.2]

## Phase 3 - [Nom]
- [ ] [Tâche 3.1]
- [ ] [Tâche 3.2]
EOF

cat > "$BASE_DIR/KNOWN_BUGS.md" << 'EOF'
# Bugs Connus

## Bugs critiques
### Bug #1
- **Description** : 
- **Impact** : 
- **Statut** : 
- **Workaround** : 

## Bugs majeurs
### Bug #2
- **Description** : 
- **Impact** : 
- **Statut** : 
EOF

cat > "$BASE_DIR/DECISIONS.md" << 'EOF'
# Architecture Decision Records (ADR)

## ADR-001 : [Titre de la décision]
- **Date** : 
- **Statut** : Accepté / Rejeté / Déprécié
- **Contexte** : 
- **Décision** : 
- **Conséquences** : 

## ADR-002 : [Titre de la décision]
- **Date** : 
- **Statut** : 
- **Contexte** : 
- **Décision** : 
- **Conséquences** : 
EOF

cat > "$BASE_DIR/CHANGELOG.md" << 'EOF'
# Changelog

## [Version] - YYYY-MM-DD
### Ajouté
- [Nouvelle fonctionnalité]

### Modifié
- [Changement]

### Corrigé
- [Bug fix]

### Supprimé
- [Fonctionnalité retirée]
EOF

cat > "$BASE_DIR/CERTIFICATION.md" << 'EOF'
# GO / NO GO des Modules

## Statut des modules

| Module | Statut | Date | Validé par |
|--------|--------|------|------------|
| Dashboard | [GO/NO GO] | [Date] | [Nom] |
| Foncier | [GO/NO GO] | [Date] | [Nom] |
| Immobilier | [GO/NO GO] | [Date] | [Nom] |
| Comptabilité | [GO/NO GO] | [Date] | [Nom] |
| RH | [GO/NO GO] | [Date] | [Nom] |
| CRM | [GO/NO GO] | [Date] | [Nom] |
| IA | [GO/NO GO] | [Date] | [Nom] |
EOF

cat > "$BASE_DIR/OPERATING_RULES.md" << 'EOF'
# Règles de Travail

## Conventions de nommage
[Règles de nommage des fichiers, variables, etc.]

## Processus de validation
[Comment les décisions sont prises et validées]

## Communication
[Canaux et fréquence de communication]

## Gestion des versions
[Stratégie de versioning]
EOF

# Créer les fichiers modules
cat > "$BASE_DIR/MODULES/Dashboard.md" << 'EOF'
# Module Dashboard

## Description
[Description du module Dashboard]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/Foncier.md" << 'EOF'
# Module Foncier

## Description
[Description du module Foncier]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/Immobilier.md" << 'EOF'
# Module Immobilier

## Description
[Description du module Immobilier]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/Comptabilite.md" << 'EOF'
# Module Comptabilité

## Description
[Description du module Comptabilité]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/RH.md" << 'EOF'
# Module RH

## Description
[Description du module RH]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/CRM.md" << 'EOF'
# Module CRM

## Description
[Description du module CRM]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

cat > "$BASE_DIR/MODULES/IA.md" << 'EOF'
# Module IA

## Description
[Description du module IA]

## Fonctionnalités
- [Fonctionnalité 1]
- [Fonctionnalité 2]

## Dépendances
[Liste des dépendances]

## Statut
- **Développement** : [En cours / Terminé]
- **Tests** : [En cours / Terminé]
- **Documentation** : [En cours / Terminé]
EOF

echo "Structure de documentation créée avec succès dans $BASE_DIR"
