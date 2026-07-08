# 🔄 Workflow de Synchronisation EGS

## Vue d'ensemble

Ce workflow assure une **synchronisation parfaite** entre les environnements EGS :

- **Développement Local** : `http://localhost:8080/login`
  -- **Serveur Local** : `http://REDACTED_LEGACY_HOST/login`
- **Production Cloud** : `https://gnambaservices.ci/`

**Principe** : Toujours travailler en **local first**, puis synchroniser vers les autres environnements.

## 🛠️ Outils du Workflow

### Scripts Principaux

| Script                     | Description                          | Usage                               |
| -------------------------- | ------------------------------------ | ----------------------------------- |
| `scripts/sync-workflow.sh` | Synchronisation entre environnements | `./scripts/sync-workflow.sh status` |
| `scripts/deploy.sh`        | Déploiement automatisé               | `./scripts/deploy.sh local-dev`     |
| `scripts/monitor.sh`       | Monitoring et surveillance           | `./scripts/monitor.sh status`       |

### Commandes Rapides

```bash
# État global
./scripts/sync-workflow.sh status

# Synchronisation dev → serveur local
./scripts/sync-workflow.sh sync local-dev local-server

# Déploiement en développement
./scripts/deploy.sh local-dev

# Monitoring continu
./scripts/monitor.sh watch
```

## 🚀 Démarrage Rapide

### 1. Configuration Initiale

```bash
# Vérifier la configuration
./scripts/sync-workflow.sh status

# Tester tous les environnements
./scripts/monitor.sh health
```

### 2. Workflow de Développement

```bash
# 1. Démarrer l'environnement de développement
./scripts/deploy.sh local-dev

# 2. Travailler sur le code...
# (modifications dans src/)

# 3. Tester les changements
npm test

# 4. Synchroniser vers le serveur local
./scripts/sync-workflow.sh sync local-dev local-server

# 5. Vérifier que tout fonctionne
./scripts/monitor.sh health --env local-server
```

### 3. Déploiement en Production

```bash
# Synchroniser dev → production
./scripts/sync-workflow.sh sync local-dev cloud-prod

# Ou déployer directement
./scripts/deploy.sh cloud-prod --backup
```

## 📋 Commandes Détaillées

### Synchronisation (`sync-workflow.sh`)

```bash
# État de tous les environnements
./scripts/sync-workflow.sh status

# Synchronisations possibles
./scripts/sync-workflow.sh sync local-dev local-server    # Dev → Serveur local
./scripts/sync-workflow.sh sync local-dev cloud-prod      # Dev → Production
./scripts/sync-workflow.sh sync local-server cloud-prod   # Serveur → Production

# Backup d'un environnement
./scripts/sync-workflow.sh backup local-dev
./scripts/sync-workflow.sh backup cloud-prod

# Vérification de cohérence
./scripts/sync-workflow.sh verify
```

### Déploiement (`deploy.sh`)

```bash
# Déploiements par environnement
./scripts/deploy.sh local-dev           # Développement local
./scripts/deploy.sh local-server        # Serveur local (REDACTED_LEGACY_HOST)
./scripts/deploy.sh cloud-prod          # Production cloud

# Options
./scripts/deploy.sh local-dev --dry-run     # Simulation
./scripts/deploy.sh cloud-prod --backup     # Avec backup
./scripts/deploy.sh cloud-prod --force      # Forcer sans vérifications
```

### Monitoring (`monitor.sh`)

```bash
# État actuel
./scripts/monitor.sh status

# Surveillance continue
./scripts/monitor.sh watch                           # Tous les environnements
./scripts/monitor.sh watch --env cloud-prod          # Production uniquement
./scripts/monitor.sh watch --interval 60             # Toutes les minutes

# Tests de santé détaillés
./scripts/monitor.sh health                          # Tous les environnements
./scripts/monitor.sh health --env local-server       # Serveur local uniquement

# Rapports
./scripts/monitor.sh report                          # Générer un rapport
```

## ⚙️ Configuration

### Fichiers de Configuration

- `.sync-config` : Configuration générale du workflow
- `.env` : Variables d'environnement développement
- `.env.server` : Variables d'environnement serveur/production
- `.env.local.example` : Exemple pour développement local

### Variables d'Environnement Critiques

```bash
# Supabase (nécessaires pour tous les environnements)
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Modes de connexion
VITE_SUPABASE_MODE=local|cloud

# Serveur local
WEB_PORT=8080
POSTGRES_PASSWORD=postgres
```

## 🔄 Stratégies de Synchronisation

### Types de Synchronisation

1. **Schema-only** : Migrations SQL uniquement
2. **Data-only** : Données uniquement (pas de schéma)
3. **Full** : Schema + données complètes
4. **Incremental** : Changements incrémentiels uniquement

### Ordre Recommandé

```
Développement Local → Serveur Local → Production Cloud
     ↓                    ↓              ↓
   Tests unitaires    Tests intégration  Validation finale
```

## 🛡️ Sécurité et Sauvegarde

### Backups Automatiques

- **Fréquence** : Quotidienne
- **Rétention** : 30 jours
- **Chiffrement** : Activé
- **Stockage** : `backups/` par environnement

### Récupération d'Urgence

```bash
# Restaurer depuis un backup
./scripts/sync-workflow.sh restore local-dev backup_20241201_143000.sql

# Rollback d'un déploiement
./scripts/deploy.sh local-server --rollback
```

## 📊 Monitoring et Alertes

### Métriques Surveillées

- ✅ Accessibilité HTTP des URLs
- ✅ Connectivité base de données
- ✅ Temps de réponse
- ✅ Statut des services Supabase
- ✅ Uptime des environnements

### Alertes

- ⚠️ Environnement hors ligne
- ⚠️ Temps de réponse > 3 secondes
- ⚠️ Échec de connexion DB
- ⚠️ Erreur de build/déploiement

### Rapports

Générés automatiquement dans `reports/` :

- État des environnements
- Historique des synchronisations
- Logs d'erreurs
- Métriques de performance

## 🐛 Dépannage

### Problèmes Courants

#### "Environnement inaccessible"

```bash
# Vérifier la connectivité
./scripts/monitor.sh health --env <environment>

# Redémarrer l'environnement
./scripts/deploy.sh <environment>
```

#### "Synchronisation échoue"

```bash
# Vérifier les permissions
ls -la .env*

# Tester la connexion DB
./scripts/monitor.sh status
```

#### "Build échoue"

```bash
# Nettoyer et rebuild
npm run dev:clean
npm run build
```

### Logs et Debug

```bash
# Logs de synchronisation
tail -f logs/sync-workflow.log

# Logs de déploiement
tail -f logs/deploy.log

# Logs de monitoring
tail -f logs/monitor.log
```

## 🔧 Maintenance

### Tâches Quotidiennes

```bash
# Vérifier l'état général
./scripts/sync-workflow.sh status

# Nettoyer les anciens backups
find backups/ -name "*.sql" -mtime +30 -delete

# Générer un rapport
./scripts/monitor.sh report
```

### Tâches Hebdomadaires

```bash
# Audit complet des environnements
./scripts/sync-workflow.sh verify

# Synchronisation complète dev → prod
./scripts/sync-workflow.sh sync local-dev cloud-prod

# Vérification des backups
ls -la backups/*/ | tail -10
```

## 📚 Référence des Commandes

### Scripts Existants (compatibilité)

```bash
# Gestion des stacks (hérité)
npm run ops:egs:local:start     # → ./scripts/deploy.sh local-dev
npm run ops:egs:mode:local      # → Configuration manuelle dans .env

# Backups (hérité)
npm run backup:run             # → ./scripts/sync-workflow.sh backup cloud-prod
```

### Migration depuis l'ancien système

1. **Évaluer l'état actuel**

   ```bash
   ./scripts/sync-workflow.sh status
   ```

2. **Migrer progressivement**

   ```bash
   # Commencer par le développement
   ./scripts/deploy.sh local-dev

   # Puis le serveur local
   ./scripts/deploy.sh local-server
   ```

3. **Validation finale**
   ```bash
   ./scripts/sync-workflow.sh verify
   ```

---

## 🎯 Checklist Déploiement

- [ ] Code testé localement (`npm test`)
- [ ] Build réussi (`npm run build`)
- [ ] Backup créé avant déploiement
- [ ] Environnements cibles accessibles
- [ ] Variables d'environnement configurées
- [ ] Monitoring activé
- [ ] Plan de rollback prêt

**Rappel** : Toujours tester en `local-dev` avant de déployer sur `local-server`, puis sur `cloud-prod`.
<parameter name="filePath">/home/soma/gnamba-project/SYNC_WORKFLOW_README.md
