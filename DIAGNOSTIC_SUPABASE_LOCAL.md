# DIAGNOSTIC SUPABASE LOCAL
**Date**: 2026-05-14  
**Problème**: Supabase Local ne démarre pas (timeout TLS handshake)

---

## 🔍 RÉSULTATS DE L'INVESTIGATION

### 1. Version CLI
- **Actuelle**: v2.75.0
- **Dernière disponible**: v2.98.2
- **Écart**: 23 versions (significatif)

### 2. État des Conteneurs
```
Aucun conteneur Supabase n'existe
Port 54321: Non accessible (000)
```

### 3. Tentatives Effectuées
- ✅ Arrêt/reset complet (`supabase stop --no-backup`)
- ✅ Nettoyage images Studio obsolètes
- ✅ Suppression dossiers `.temp` et `.branches`
- ✅ Réinitialisation configuration PostgreSQL 15
- ❌ Démarrage échoue systématiquement

### 4. Logs d'Erreur
```
failed to inspect container health: 
Error response from daemon: No such container: supabase_db_gnamba-project
```

**Interprétation**: Le conteneur PostgreSQL n'est jamais créé. Le processus de démarrage échoue avant la création des conteneurs.

---

## 🎯 CAUSES PROBABLES

### Cause 1: Bug CLI v2.75.0 (PROBABLE)
La version 2.75.0 a des problèmes connus avec:
- Pull d'images sur certains réseaux
- Création de conteneurs avec Docker récent
- Gestion des timeouts TLS

### Cause 2: Réseau Docker (POSSIBLE)
- DNS interne Docker non fonctionnel
- Configuration réseau bridgée problématique
- Conflit avec firewall local

### Cause 3: Ressources Système (PEU PROBABLE)
- Espace disque suffisant
- Mémoire disponible
- Docker fonctionne pour autres conteneurs

---

## ✅ SOLUTIONS RECOMMANDÉES

### Solution 1: Mise à jour CLI Supabase (REcommandée)

```bash
# Méthode A: Via npm
cd /home/soma/gnamba-project
npm install -g supabase@latest

# Vérification
supabase --version
# Attendu: v2.98.2 ou supérieur

# Test après mise à jour
supabase start
```

### Solution 2: Réinstallation Complète

```bash
# 1. Désinstaller CLI actuelle
npm uninstall -g supabase

# 2. Nettoyer cache
rm -rf ~/.supabase
rm -rf /home/soma/gnamba-project/supabase/.temp
rm -rf /home/soma/gnamba-project/supabase/.branches

# 3. Réinstaller
npm install -g supabase@latest

# 4. Réinitialiser
supabase init
supabase start
```

### Solution 3: Contournement - Mode Cloud

Si Supabase Local ne fonctionne pas, utiliser le **mode cloud** pour le développement:

**Avantages**:
- ✅ Base de données identique à production
- ✅ Pas de maintenance locale
- ✅ Synchronisation automatique
- ✅ Pas de problèmes de version

**Inconvénients**:
- ⚠️ Nécessite connexion internet
- ⚠️ Latence réseau
- ⚠️ Limites API (rate limiting)

**Configuration**:
```bash
# Modifier .env
VITE_SUPABASE_MODE=cloud
VITE_SUPABASE_URL=https://thykrnoqgylrbfupophs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Solution 4: PostgreSQL Docker Manuel

```bash
# Démarrer PostgreSQL 15 manuellement
docker run -d \
  --name egs-postgres-local \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 54322:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  --network host \
  postgres:15-alpine

# Configurer EGS pour utiliser ce PostgreSQL
# Modifier .env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 📋 PROCÉDURE DE TEST

### Étape 1: Mise à jour CLI
```bash
npm install -g supabase@latest
supabase --version  # Vérifier v2.98.2+
```

### Étape 2: Test Démarrage
```bash
cd /home/soma/gnamba-project
supabase stop --no-backup 2>/dev/null
rm -rf supabase/.temp supabase/.branches
supabase start
```

### Étape 3: Vérification
```bash
supabase status
curl http://localhost:54321/health
```

### Étape 4: Si Échec
Basculer vers **Solution 3 (Mode Cloud)** ou **Solution 4 (PostgreSQL Docker)**

---

## 🎯 RECOMMANDATION FINALE

**Priorité immédiate**: Essayer la **Solution 1** (mise à jour CLI).

Si échec après 3 tentatives → Adopter **Solution 3** (Mode Cloud) pour le développement.

**Justification**:
- Le mode cloud est déjà fonctionnel et testé
- Pas de divergence entre dev et prod
- Moins de maintenance
- Le serveur local (`egs-web`) utilise déjà le cloud

---

## 📊 STATUT ACTUEL

| Composant | État | Action |
|-----------|------|--------|
| Supabase CLI v2.75.0 | ⚠️ Bug connu | Mettre à jour |
| Conteneurs Supabase | ❌ Aucun | Créer après maj |
| PostgreSQL Local | ❌ Indisponible | Alternative: cloud |
| Mode Cloud | ✅ Fonctionnel | Utiliser pour dev |
| EGS Frontend | ✅ Running | Pas d'impact |

---

**Document créé**: 2026-05-14  
**Prochaine revue**: Après mise à jour CLI ou basculement vers mode cloud
