# Monitoring EGS

## 📊 Vue d'ensemble

Ce document décrit la configuration de monitoring pour les services EGS (Enterprise Gnamba System).

---

## 🔍 UptimeRobot

### Compte

- **Service** : [UptimeRobot](https://uptimerobot.com/)
- **Plan** : Gratuit (50 monitors, vérification toutes les 5 minutes)
- **API Key** : `u3420520-838c2bef5244027d46c464fb`
- **Dashboard** : https://dashboard.uptimerobot.com/

### Moniteurs configurés

#### 1. Site Principal EGS

- **Type** : HTTP(S)
- **URL** : `https://gnambaservices.ci`
- **Nom du moniteur** : EGS - Site Principal
- **Période de vérification** : 5 minutes
- **Alertes** : Email activé
- **Statut** : ✅ Actif

#### 2. FileBrowser

- **Type** : HTTP(S)
- **URL** : `https://fichiers.gnambaservices.ci`
- **Nom du moniteur** : EGS - FileBrowser
- **Période de vérification** : 5 minutes
- **Alertes** : Email activé
- **Statut** : ✅ Actif

### Statut public

- **Page de statut** : https://stats.uptimerobot.com/... _(à configurer)_

### Configuration des alertes

1. Aller dans **My Settings** → **Alert Contacts**
2. Ajouter un contact email : `[votre-email@exemple.com]`
3. Pour chaque moniteur :
   - Cliquer sur **Edit Monitor**
   - Section **Alert Contacts** → cocher l'email
   - Sauvegarder

### Configuration via API (optionnel)

```bash
# Créer un moniteur HTTP(S)
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "u3420520-838c2bef5244027d46c464fb",
    "format": "json",
    "type": 1,
    "friendly_name": "EGS - Site Principal",
    "url": "https://gnambaservices.ci",
    "interval": 300
  }'

# Liste des moniteurs
curl -X POST https://api.uptimerobot.com/v2/getMonitors \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "u3420520-838c2bef5244027d46c464fb",
    "format": "json"
  }'
```

---

## 🐛 Sentry - Surveillance d'erreurs

### Dashboard

- **URL** : https://sentry.io/organizations/souleymane-gnabia/projects/egs/
- **Projet** : EGS
- **Organisation** : souleymane-gnabia

### Configuration

- **Seuil critique** : > 10 erreurs/heure
- **Alertes** : Configurer dans **Alerts** → **Create Alert Rule**
  - Trigger: `When issues are first created`
  - Filter: `Project: EGS`
  - Action: `Send a notification via email`

### Intégration dans le code

```typescript
// src/lib/supabase.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/your-project-id",
  environment: import.meta.env.VITE_ENV || "production",
  tracesSampleRate: 0.1,
});

// Exemple de capture d'erreur
try {
  const { data, error } = await supabase.from("projects").select("*");
  if (error) {
    Sentry.captureException(error, {
      tags: { module: "projects" },
      level: "error",
    });
  }
} catch (err) {
  Sentry.captureException(err);
}
```

### Seuils d'alerte recommandés

- **Critique** : > 10 erreurs/heure
- **Avertissement** : > 50 erreurs/jour
- **Taux d'erreur** : > 1% des requêtes

---

## 📝 Logs

### Docker Logs

```bash
# Logs du frontend EGS
docker logs egs-frontend --tail 100

# Logs en temps réel
docker logs egs-frontend -f

# Logs des 24 dernières heures
docker logs egs-frontend --since 24h

# Logs avec détails complets
docker logs egs-frontend --tail 100 --details
```

### FileBrowser Logs

```bash
# Si FileBrowser est dans un container Docker
docker logs filebrowser --tail 100

# Logs en temps réel
docker logs filebrowser -f
```

### Supabase Logs

1. Aller dans le **Dashboard Supabase** : https://app.supabase.com/
2. Sélectionner le projet : `thykrnoqgylrbfupophs`
3. Naviguer vers **Settings** → **Logs**
4. Types de logs disponibles :
   - **Edge Functions** : Logs des fonctions serverless
   - **Postgres** : Logs de la base de données
   - **Auth** : Logs d'authentification
   - **API** : Logs des requêtes API

### Commandes utiles

```bash
# Vérifier l'état des containers
docker ps

# Redémarrer le frontend
docker restart egs-frontend

# Voir l'utilisation des ressources
docker stats egs-frontend

# Inspecter un container
docker inspect egs-frontend
```

---

## 🚨 Procédures d'urgence

### Site principal inaccessible

1. Vérifier les logs Docker : `docker logs egs-frontend --tail 200`
2. Vérifier le statut du container : `docker ps | grep egs-frontend`
3. Redémarrer si nécessaire : `docker restart egs-frontend`
4. Vérifier UptimeRobot pour confirmer la résolution

### FileBrowser inaccessible

1. Vérifier le container FileBrowser : `docker ps | grep filebrowser`
2. Logs : `docker logs filebrowser --tail 100`
3. Redémarrer : `docker restart filebrowser`

### Erreurs Supabase

1. Vérifier le dashboard Supabase pour les incidents
2. Logs Edge Functions : Dashboard > Logs > Edge Functions
3. Vérifier les limites du plan gratuit

---

## 📈 Métriques à surveiller

| Métrique         | Seuil  | Action                                 |
| ---------------- | ------ | -------------------------------------- |
| Uptime           | < 99%  | Investiguer immédiatement              |
| Temps de réponse | > 2s   | Optimiser ou vérifier la charge        |
| Erreurs Sentry   | > 10/h | Examiner les nouvelles erreurs         |
| Espace disque    | > 80%  | Nettoyer les logs/anciens builds       |
| Mémoire Docker   | > 1GB  | Redémarrer ou augmenter les ressources |

---

## 🔐 Sécurité des clés API

⚠️ **IMPORTANT** : La clé API UptimeRobot (`u3420520-838c2bef5244027d46c464fb`) est sensible.

- ❌ Ne jamais commiter dans le code source
- ❌ Ne pas exposer publiquement
- ✅ Stocker dans `.env` si utilisé dans l'application
- ✅ Rotation régulière via le dashboard UptimeRobot

---

## 📅 Maintenance

### Tâches régulières

- [ ] Vérifier les alertes UptimeRobot quotidiennement
- [ ] Examiner les erreurs Sentry hebdomadairement
- [ ] Nettoyer les anciens logs Docker mensuellement
- [ ] Tester les procédures d'urgence trimestriellement

### Checklist pré-déploiement

- [ ] Vérifier que tous les moniteurs UptimeRobot sont actifs
- [ ] Confirmer que Sentry reçoit les erreurs
- [ ] Tester l'accès aux logs Docker et Supabase

---

**Dernière mise à jour** : 2026-04-07  
**Responsable** : Souleymane Gnabia  
**Statut** : ✅ Configuration active
