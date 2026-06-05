# EGS_ANALYSE_COMPLETE

## 1. Résumé exécutif

Ce document présente une analyse complète du projet EGS dans le dépôt `gnamba-project`. Il couvre l’état actuel, les acteurs clés, les processus métier, les documents critiques, les flux financiers et décisionnels, les risques, et les recommandations pour stabiliser l’architecture et déployer une plateforme ERP fiable, sécurisée et maintenable.

## 2. Contexte métier

### Objectif métier
EGS est un ERP complet dédié à Gnamba Services (Côte d’Ivoire) pour gérer :
- CRM et prospection
- Foncier et immobilier
- Projets BTP
- Finances et comptabilité
- RH et paie
- Gestion documentaire (GED)
- Campagnes marketing

### Contraintes terrain
- Conformité aux exigences ivoiriennes de conservation documentaire
- Gestion d’actifs fonciers et d’attestations officielles
- Besoin de disponibilité sur mono-serveur avec possibilité d’extension
- Utilisateurs francophones et workflow administratif formalisé

## 3. Acteurs et responsabilités

### Acteurs internes
1. Directeur Général
2. Responsable Foncière
3. Responsable Immobilier
4. Responsable BTP / Chantier
5. Comptable / Trésorier
6. Responsable RH
7. Administrateur Système / DevOps

### Acteurs externes
- Client / Locataire
- Fournisseur / Sous-traitant
- Autorité administrative / Mairie
- Auditeur / Commissaire aux comptes
- Banque / Institution financière

## 4. Processus métier clés

### 4.1 Prospection et CRM
- Entrée : contact, lead, visite terrain
- Étapes : qualification, proposition, rendez-vous, contrat
- Sortie : lead qualifié, dossier client, opportunité commerciale
- Fréquence : quotidienne

### 4.2 Gestion foncière
- Entrée : dossier terrain, plan cadastral, contrat de vente
- Étapes : validation administrative, création du lot, génération attestation
- Sortie : lot foncier, attestation, registre foncier
- Fréquence : hebdomadaire / projet

### 4.3 Immobilier et location
- Entrée : bien immobilier, bail, locataire
- Étapes : création bien, contrat de bail, émission quittance, encaissement
- Sortie : contrat de bail, quittance, état des loyers
- Fréquence : mensuelle

### 4.4 Projets BTP
- Entrée : client, plan de chantier, devis
- Étapes : chiffrage, planification, achat, exécution, réceptions
- Sortie : ordre de service, factures, réception provisoire, clôture
- Fréquence : projet par projet

### 4.5 Finances et trésorerie
- Entrée : ventes, achats, encaissements, décaissements
- Étapes : enregistrement, validation, rapprochement bancaire
- Sortie : bilan, flux de trésorerie, rapport financier
- Fréquence : quotidien / mensuel

### 4.6 Ressources humaines
- Entrée : candidature, contrat, salaire
- Étapes : recrutement, embauche, calcul paie, émission fiche de paie
- Sortie : dossier employé, bulletin de paie, tableau de carrière
- Fréquence : mensuelle

### 4.7 Gestion documentaire (GED)
- Entrée : factures, contrats, rapports, plans
- Étapes : indexation, versioning, archivage, accès sécurisé
- Sortie : document référencé, version historique, lien FileBrowser
- Fréquence : continue

## 5. Documents produits et consommés

### Documents produits
1. Quittance de paiement
2. Reçu de vente
3. Attestation de cession foncière
4. Facture client
5. Bon de commande
6. Contrat de bail
7. Bulletin de paie
8. Rapport d’avancement BTP

### Documents consommés
- Devis fournisseurs
- Plans architecturaux
- Pièces d’identité clients
- Relevés bancaires
- Courriers administratifs

## 6. Flux financiers

### 6.1 Périmètre
- Recettes : loyers, ventes foncières, prestations BTP, services immobiliers
- Dépenses : achats matériaux, salaires, frais administratifs, sous-traitance
- Trésorerie : encaissements, décaissements, provision

### 6.2 Cycle mensuel
- Semaine 1 : saisie factures, emprunts, coûts chantier
- Semaine 2 : validation paiements, rapprochement bancaire
- Semaine 3 : génération quittances, émission bulletins de paie
- Semaine 4 : production rapports financiers et KPI

### 6.3 Points de contrôle
- Validation N+1 pour dépenses > seuil
- Approbation signature pour vente foncière
- Calcul marge BTP par chantier
- Respect des échéances de paiement des loyers

## 7. État actuel de l’infrastructure

### 7.1 Architecture logicielle
- Frontend React / Vite
- Supabase Cloud pour la production
- Mode local Supabase prévu mais souvent inactif
- Docker Compose fragmenté en plusieurs fichiers
- FileBrowser utilisé pour la GED

### 7.2 Situation opérationnelle
- Environnements EGS / SomAgro co-existants dans le même workspace
- Problèmes de configuration `.env` et `.env.server`
- Stack full-stack `docker-compose.prod.yml` mal alignée
- Absence de monitoring unifié et de routines de sauvegarde prouvées

### 7.3 Catégorisation des risques
- Sécurité : secrets non centralisés, config `.env` exposée
- Disponibilité : Supabase local inopérant
- Maintenabilité : dette technique élevée, migrations désynchronisées
- Gouvernance : documentation fragmentée, procédures incomplètes

## 8. Analyse des écarts majeurs

### 8.1 Architecture cible vs existant
- CIBLE : stack intégré mono-serveur avec Nginx, PostgreSQL, Redis, MinIO, FileBrowser, n8n, Ollama, monitoring
- ACTUEL : frontend seul + FileBrowser + Supabase Cloud partiellement utilisé

### 8.2 Données et documents
- CIBLE : GED centralisée, versioning, archivage structuré
- ACTUEL : documents dispersés, manque de convention de nommage logique

### 8.3 Sécurité et gouvernance
- CIBLE : secrets hors repo, RLS, ACL, HTTPS, headers sécurisés
- ACTUEL : variables sensibles dans `.env`, TLS non validé, CSP incertain

### 8.4 Sauvegarde et DR
- CIBLE : 3-2-1 backup, tests de restauration, procédures documentées
- ACTUEL : script backup présent mais sans validation ni plan cron formalisé

## 9. Recommandations stratégiques

### 9.1 Court terme
- Séparer EGS / SomAgro en workflows distincts
- Corriger la configuration `.env` et valider `supabase start`
- Stabiliser `docker-compose.prod.yml`
- Créer un fichier `docs/PRA.md` et `docs/Runbook.md`

### 9.2 Moyen terme
- Déployer un stack minimal : Nginx, Frontend, PostgreSQL, FileBrowser, MinIO
- Ajouter monitoring (Prometheus/Grafana/Loki/Uptime Kuma)
- Mettre en place backup automatique avec dry-run
- Documenter les responsabilités des rôles métiers

### 9.3 Long terme
- Intégrer un service IA local (Ollama + Open WebUI)
- Implémenter un WOPI Gateway pour édition DOCX/XLSX
- Ajouter Samba pour partage interne et audit de fichiers
- Industrialiser la gouvernance Git (main/develop/feature)

## 10. Priorités de refonte

1. Critique : rendre le système local fonctionnel et propre
2. Élevé : corriger la sécurité des secrets et la gestion des environnements
3. Élevé : stabiliser les backups et les procédures de restauration
4. Moyen : unifier la documentation et l’observabilité
5. Bas : actif IA / Collabora / Samba

## 11. Annexes utiles

### 11.1 Commandes de validation immédiate
```bash
docker compose -f docker-compose.prod.yml config
supabase status
bash scripts/workspace-stack.sh status
bash scripts/validate-env.sh .env
bash scripts/backup.sh full
```

### 11.2 Mots clés d’audit
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_MODE`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

### 11.3 Emplacements critiques
- `/home/soma/gnamba-project/.env`
- `/home/soma/gnamba-project/.env.server`
- `/home/soma/gnamba-project/docker-compose.prod.yml`
- `/home/soma/gnamba-project/supabase/config.toml`
- `/home/soma/gnamba-project/scripts/backup.sh`
- `/home/soma/gnamba-project/nginx/nginx.conf`
