# 🤖 EGS Copilot - Guide d'Intégration Ollama

## 📋 Vue d'ensemble

EGS Copilot est un assistant IA intégré à l'ERP EGS, propulsé par **Ollama** (LLM local). Il permet aux utilisateurs d'interagir avec leur système en langage naturel pour:

- 💬 Poser des questions sur les données (clients, projets, finances)
- 📊 Générer des résumés financiers automatiques
- ⚡ Prioriser intelligemment les tâches
- 🏗️ Obtenir de l'aide sur l'utilisation d'EGS
- 🔍 Rechercher des informations across tous les modules

---

## 🚀 Installation Rapide

### 1. Installer Ollama

#### Windows

```powershell
winget install Ollama.Ollama
# Ou télécharger depuis: https://ollama.com/download
```

#### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### macOS

```bash
brew install ollama
```

### 2. Télécharger le Modèle

```bash
# Modèle recommandé (bon équilibre qualité/performance)
ollama pull llama3.1:8b

# Alternatives:
ollama pull qwen2.5:7b        # Meilleur support français
ollama pull phi3:3.8b         # Plus léger (serveurs limités)
ollama pull llama3.1:70b      # Plus intelligent (si GPU puissant)
```

### 3. Démarrer Ollama

```bash
# Le service démarre automatiquement sur la plupart des systèmes
ollama serve

# Vérifier qu'il fonctionne
curl http://localhost:11434/api/tags
```

### 4. Configurer EGS

Le fichier `.env` est déjà configuré:

```env
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:8b
```

**Si Ollama tourne sur une autre machine:**

```env
VITE_OLLAMA_URL=http://192.168.1.100:11434
```

---

## 🎯 Utilisation

### Accéder au Copilot

1. Ouvrez EGS dans votre navigateur
2. Cliquez sur l'**icône flottante** 💬 en bas à droite
3. Le panneau Copilot s'ouvre

### Actions Rapides

Le Copilot propose 4 actions rapides prédéfinies:

| Action                  | Description                   | Exemple de réponse                                     |
| ----------------------- | ----------------------------- | ------------------------------------------------------ |
| 💰 **Résumé financier** | Analyse des recettes/dépenses | "Les recettes ont augmenté de 15% ce mois..."          |
| ⚡ **Tâches urgentes**  | Identification des priorités  | "Vous avez 3 tâches en retard..."                      |
| 🏗️ **Projets en cours** | État des projets BTP          | "Le projet Construction Bouaké est à 75%..."           |
| ❓ **Aide EGS**         | Guide d'utilisation           | "Pour générer une quittance, allez dans Immobilier..." |

### Poser des Questions

Exemples de questions en langage naturel:

```
💬 "Combien avons-nous dépensé pour le projet Bouaké?"
💬 "Quels sont les clients avec des projets actifs?"
💬 "Génère un rapport des dépenses du mois dernier"
💬 "Quels terrains sont disponibles dans le foncier?"
💬 "Comment créer une nouvelle tâche?"
💬 "Liste les employés du service BTP"
```

---

## 🔧 Configuration Avancée

### Changer de Modèle

```bash
# Voir les modèles installés
ollama list

# Installer un autre modèle
ollama pull qwen2.5:14b

# Dans EGS (.env)
VITE_OLLAMA_MODEL=qwen2.5:14b
```

### Modèles Recommandés

| Modèle         | Taille | RAM requise | Usage                |
| -------------- | ------ | ----------- | -------------------- |
| `phi3:3.8b`    | 2.1 GB | 4 GB        | Serveurs limités     |
| `llama3.1:8b`  | 4.7 GB | 8 GB        | **Recommandé**       |
| `qwen2.5:7b`   | 4.4 GB | 8 GB        | Meilleur français    |
| `qwen2.5:14b`  | 8.9 GB | 16 GB       | Meilleure qualité    |
| `llama3.1:70b` | 39 GB  | 64 GB       | Maximum intelligence |

### Optimiser les Réponses

Dans `src/lib/ollama.ts`, ajustez les paramètres:

```typescript
ollama.chat(messages, undefined, {
  temperature: 0.7, // Créativité (0-1)
  maxTokens: 1000, // Longueur max
});
```

- **temperature: 0.3-0.5** → Réponses plus précises/conservatrices
- **temperature: 0.7-0.9** → Réponses plus créatives/varées

---

## 🔒 Sécurité

### CSP Headers

Le fichier `public/_headers` inclut déjà:

```
connect-src 'self' http://localhost:11434;
```

### Production

Pour la production avec Ollama sur serveur distant:

1. **Ne JAMAIS exposer Ollama directement sur Internet**
2. Utiliser un proxy (Supabase Edge Function ou Node.js)
3. Ajouter l'authentification

**Architecture recommandée:**

```
Browser → Supabase Edge Function → http://localhost:11434 (sur serveur)
```

---

## 🐛 Dépannage

### Le Copilot montre "IA indisponible"

**Vérifier qu'Ollama tourne:**

```bash
curl http://localhost:11434/api/tags
```

**Si erreur:**

```bash
ollama serve
```

### Le modèle n'est pas installé

```bash
# Voir les modèles installés
ollama list

# Installer le modèle manquant
ollama pull llama3.1:8b
```

### Réponses lentes

**Options:**

1. Utiliser un modèle plus petit (`phi3:3.8b`)
2. Augmenter la température pour des réponses plus courtes
3. Vérifier les ressources système:
   ```bash
   # RAM utilisée par Ollama
   ps aux | grep ollama
   ```

### Erreurs CORS

**Si Ollama est sur un autre serveur:**

Configurer Ollama pour accepter les requêtes cross-origin:

```bash
# Linux/macOS
OLLAMA_ORIGINS=* ollama serve

# Windows (PowerShell)
$env:OLLAMA_ORIGINS="*"
ollama serve
```

### Le Copilot ne répond pas

**Vérifier la console du navigateur (F12):**

1. Erreur réseau → Ollama n'est pas accessible
2. Erreur CSP → Headers à mettre à jour
3. Erreur modèle → Modèle mal installé

---

## 📊 Architecture Technique

### Composants Créés

| Fichier                        | Rôle                   |
| ------------------------------ | ---------------------- |
| `src/lib/ollama.ts`            | Client API Ollama      |
| `src/components/AICopilot.tsx` | Interface chat         |
| `src/components/Layout.tsx`    | Intégration du Copilot |
| `.env`                         | Configuration          |
| `public/_headers`              | CSP pour Ollama        |

### Flux de Données

```
Utilisateur → Tape question
    ↓
AICopilot.tsx → Formatte le message
    ↓
ollama.ts → Appel API POST /api/chat
    ↓
Ollama (localhost:11434) → Génère réponse
    ↓
ollama.ts → Reçoit réponse stream
    ↓
AICopilot.tsx → Affiche réponse
```

### API Ollama Utilisées

| Endpoint             | Usage                  |
| -------------------- | ---------------------- |
| `GET /api/tags`      | Vérifier disponibilité |
| `POST /api/chat`     | Conversation           |
| `POST /api/generate` | Génération simple      |
| `POST /api/embed`    | Embeddings (futur)     |

---

## 🚀 Fonctionnalités Futures

### Planifiées

- [ ] **Résumé financier automatique** dans Dashboard
- [ ] **Priorisation intelligente des tâches** dans Taches
- [ ] **Recherche sémantique** across tous les modules
- [ ] **Génération de documents** (baux, attestations)
- [ ] **Suggestions contextuelles** basées sur les données

### Idées

- 🎯 **Mode hors ligne**: Responses cachées pour questions fréquentes
- 📱 **Notifications push**: Alertes IA proactives
- 🔄 **Auto-apprentissage**: Mémorise les questions fréquentes
- 🌍 **Multi-langue**: Français, Dioula, Anglais

---

## 📝 Exemples d'Utilisation

### Exemple 1: Résumé Financier

```
User: "Fais-moi un résumé financier du mois"

Copilot: "📊 Résumé Financier - Mars 2026

Recettes totales: 15.2M FCFA (+12% vs février)
- Loyers: 8.5M FCFA (56%)
- Projets BTP: 5.2M FCFA (34%)
- Fournitures: 1.5M FCFA (10%)

Dépenses: 9.8M FCFA (+8%)
- Matériaux: 4.2M FCFA
- Salaires: 3.8M FCFA
- Équipements: 1.8M FCFA

Bénéfice net: 5.4M FCFA

⚠️ Point d'attention: Les dépenses en matériaux ont augmenté
de 22%, principalement sur le projet Bouaké."
```

### Exemple 2: Gestion Tâches

```
User: "Quelles sont mes priorités cette semaine?"

Copilot: "⚡ Tâches Prioritaires

🔴 URGENT (à faire aujourd'hui):
1. Réviser contrat location Apt 3B - Échéance demain
2. Paiement fournisseur BetonCI - Dans 2 jours

🟠 HAUTE PRIORITÉ:
3. Inspection chantier Bouaké - Cette semaine
4. Rapport mensuel finances - Vendredi

💡 Recommendation: Commencez par le contrat 3B,
le locataire attend depuis 2 semaines."
```

### Exemple 3: Aide Navigation

```
User: "Comment générer une quittance de loyer?"

Copilot: "📝 Générer une Quittance de Loyer:

1. Allez dans **Immobilier** (menu lateral)
2. Cliquez sur l'onglet **Paiements**
3. Trouvez le paiement concerné
4. Cliquez sur l'icône 🖨️ **Imprimer**
5. Sélectionnez **Quittance de Loyer**

La quittance sera générée avec:
✓ Nom du locataire
✓ Période couverte
✓ Montant payé
✓ Reference de transaction

Besoin d'aide pour autre chose?"
```

---

## 🎓 Pour les Développeurs

### Ajouter une Nouvelle Capacité IA

```typescript
// 1. Créer un prompt dans ollama.ts
createCustomPrompt(data: MyData): string {
  return `Instruction claire en français...

Données: ${JSON.stringify(data)}

Format de réponse attendu...`;
}

// 2. Utiliser dans un composant
import { ollama } from '../lib/ollama';

const response = await ollama.chat([
  { role: 'user', content: ollama.createCustomPrompt(myData) }
]);
```

### Intégrer dans un Nouveau Module

```typescript
// Exemple: Ajouter IA dans Clients.tsx
import { ollama } from "../lib/ollama";

const analyzeClient = async (clientId: string) => {
  const clientData = await getClientData(clientId);
  const prompt = ollama.createClientAnalysisPrompt(clientData);
  const analysis = await ollama.chat([{ role: "user", content: prompt }]);
  return analysis;
};
```

---

## 📞 Support

- **Documentation Ollama**: https://ollama.com/docs
- **API Reference**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **Modèles disponibles**: https://ollama.com/library

---

**Dernière mise à jour**: 2026-04-05  
**Version**: 1.0.0  
**Statut**: ✅ Production-ready (local)
