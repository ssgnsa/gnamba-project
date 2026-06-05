# 🔍 Système de Monitoring Gnamba Server

**Date**: 13 mai 2026
**Version**: 1.0
**Statut**: ✅ Opérationnel

## Vue d'ensemble

Le système de monitoring automatique surveille en continu l'état de santé du serveur Gnamba et alerte en cas de problème. Il vérifie tous les services critiques et génère des rapports quotidiens.

## Services surveillés

### ✅ Services critiques
- **Conteneurs Docker** (egs-web, somagro-web, filebrowser)
- **Supabase local** (API, Studio, base de données)
- **Tables de base de données** (attestation_sequences, foncier_lots, etc.)
- **Sauvegardes** (intégrité et fraîcheur)
- **Espace disque** (seuil critique: 90%)

### 📊 Métriques collectées
- **État des services** (up/down)
- **Âge des sauvegardes** (en heures)
- **Utilisation disque** (en pourcentage)
- **Fichiers non commitées** (risque de perte de données)

## Architecture

```
scripts/
├── gnamba-monitor.sh      # Script principal de monitoring
├── monitor-config.env     # Configuration des seuils et alertes
├── install-monitoring.sh  # Installation du cron job
└── uninstall-monitoring.sh # Désinstallation

logs/
├── gnamba-monitor-YYYYMMDD.log  # Logs détaillés
├── alerts-YYYYMMDD.log          # Alertes uniquement
└── daily-report-YYYYMMDD.md     # Rapports quotidiens
```

## Installation

### Installation automatique
```bash
cd /home/soma/gnamba-project
chmod +x scripts/install-monitoring.sh
./scripts/install-monitoring.sh
```

### Installation manuelle
```bash
# 1. Rendre exécutable
chmod +x scripts/gnamba-monitor.sh

# 2. Ajouter au cron (toutes les 30 minutes)
crontab -e
# Ajouter la ligne:
*/30 * * * * cd /home/soma/gnamba-project && ./scripts/gnamba-monitor.sh --cron
```

## Configuration

Éditer `scripts/monitor-config.env`:

```bash
# Alertes email
EMAIL_RECIPIENT=admin@gnamba-services.com

# Alertes Slack (optionnel)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK

# Alertes Telegram (optionnel)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Seuils
DISK_THRESHOLD=90        # % disque critique
BACKUP_MAX_AGE=24        # heures max sans backup
```

## Utilisation

### Exécution manuelle
```bash
# Test complet
./scripts/gnamba-monitor.sh

# Mode cron (logs uniquement)
./scripts/gnamba-monitor.sh --cron
```

### Vérification des logs
```bash
# Logs du jour
tail -f logs/gnamba-monitor-$(date +%Y%m%d).log

# Alertes du jour
cat logs/alerts-$(date +%Y%m%d).log

# Rapport quotidien
cat logs/daily-report-$(date +%Y%m%d).md
```

## Alertes

### Types d'alertes
- 🚨 **Critique**: Service down, backup corrompu, disque plein
- ⚠️ **Warning**: Backup vieux, fichiers non commitées
- ℹ️ **Info**: Rapports quotidiens, changements d'état

### Canaux d'alerte
- **Email**: Via `mail` (nécessite mailutils)
- **Slack**: Webhook configuré
- **Telegram**: Bot API configuré
- **Logs**: Toujours actif

## Désinstallation

```bash
./scripts/uninstall-monitoring.sh
```

## Dépannage

### Problèmes courants

**"Command not found: mail"**
```bash
sudo apt install mailutils
```

**"curl: command not found"**
```bash
sudo apt install curl
```

**Permissions insuffisantes**
```bash
chmod +x scripts/gnamba-monitor.sh
```

**Cron ne s'exécute pas**
```bash
# Vérifier la syntaxe
crontab -l
# Tester manuellement
./scripts/gnamba-monitor.sh --cron
```

### Debug

```bash
# Mode verbose
bash -x scripts/gnamba-monitor.sh

# Vérifier les variables
source scripts/monitor-config.env
echo "EMAIL_RECIPIENT: $EMAIL_RECIPIENT"
```

## Métriques et KPIs

### Disponibilité
- **Objectif**: 99.9% uptime
- **Mesuré**: % de checks réussis

### Sauvegardes
- **Fréquence**: Quotidienne
- **Rétention**: 30 jours
- **Vérification**: Intégrité automatique

### Alertes
- **Temps de réponse**: < 5 minutes
- **Précision**: 100% (pas de faux positifs)

## Évolution

### Améliorations futures
- [ ] Dashboard web (Grafana/Prometheus)
- [ ] Métriques temps réel
- [ ] Auto-remédiation (redémarrage automatique)
- [ ] Intégration PagerDuty/OpsGenie
- [ ] Alertes SMS (Twilio)

### Maintenance
- **Revue mensuelle**: Seuils et configuration
- **Test annuel**: Scénarios de panne
- **Mise à jour**: Avec les nouvelles versions

---

**Documentation générée automatiquement**
*Dernière mise à jour: 13 mai 2026*