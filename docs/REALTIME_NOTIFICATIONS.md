# Notifications en temps réel - Paiements de loyers

## Aperçu

Ce système de notifications en temps réel a été ajouté au module immobilier pour avertir automatiquement les utilisateurs lorsqu'un paiement de loyer est effectué. Le système envoie principalement des notifications **WhatsApp** avec un fallback vers les notifications toast dans l'interface.

## Architecture

### Composants

1. **WhatsApp Service** (`src/lib/whatsappService.ts`)
   - Service d'envoi de messages WhatsApp
   - Supporte plusieurs fournisseurs : Twilio, MessageBird, WhatsApp Business API, CallMeBot
   - Gestion des numéros de téléphone et formatage automatique
   - Fallback automatique vers notifications toast en cas d'échec

2. **Toast Component** (`src/components/ui/Toast.tsx`)
   - Composant d'affichage des notifications avec animation (fallback)
   - Supporte différents types : success, error, info, payment
   - Auto-dismiss avec barre de progression

3. **NotificationContext** (`src/context/NotificationContext.tsx`)
   - Contexte React pour gérer les notifications globalement
   - Fonction `showPaymentNotification()` spécialisée pour les paiements
   - Gestion automatique de la durée d'affichage

4. **useRealtimePayments Hook** (`src/hooks/useRealtimePayments.ts`)
   - Hook personnalisé pour écouter les changements sur la table `rent_payments`
   - Utilise Supabase Realtime pour les notifications en temps réel
   - Envoie des notifications WhatsApp pour les paiements avec statut "paye"
   - Fallback vers notifications toast si WhatsApp échoue

5. **Edge Function OneSignal** (`supabase/functions/send-payment-notification/index.ts`)
   - Reçoit l'événement depuis le frontend via `supabase.functions.invoke()`
   - Lit la propriété et le `onesignal_player_id` côté Supabase avec le `service_role`
   - Envoie la notification push OneSignal sans embarquer de code serveur dans le bundle client

6. **Intégration dans Immobilier** (`src/pages/Immobilier.tsx`)
   - Activation de l'écoute Realtime dans le module immobilier
   - Intégration transparente avec le code existant

## Configuration

### 1. Configuration Supabase Realtime

Pour que les notifications en temps réel fonctionnent, vous devez activer Realtime sur les tables concernées dans votre dashboard Supabase :

#### Via le Dashboard
1. Allez dans le dashboard Supabase : https://app.supabase.com
2. Sélectionnez votre projet
3. Naviguez vers **Database** > **Replication**
4. Cliquez sur le menu **Select tables** en haut à droite
5. Activez la replication pour les tables :
   - `rent_payments`
   - `locataires` (ou `tenants`)
   - `properties`
   - `lease_contracts`
   - `whatsapp_notifications` (optionnel, pour l'historique)

#### Via SQL

Exécutez la migration fournie dans le SQL Editor de Supabase :

```sql
-- Activer Realtime pour les tables concernées
alter publication supabase_realtime add table rent_payments;
alter publication supabase_realtime add table locataires;
alter publication supabase_realtime add table properties;
alter publication supabase_realtime add table lease_contracts;
alter publication supabase_realtime add table whatsapp_notifications;
```

### 2. Configuration WhatsApp

Le système supporte plusieurs fournisseurs WhatsApp. Choisissez celui qui convient le mieux à vos besoins :

#### Option A: CallMeBot (Gratuit - pour tests)

Le plus simple pour commencer, mais limité à 10 messages par jour.

1. Allez sur https://www.callmebot.com
2. Créez un compte gratuit
3. Suivez les instructions pour activer WhatsApp sur votre numéro
4. Copiez votre API key

Variables d'environnement (`.env`) :
```bash
VITE_WHATSAPP_PROVIDER=callmebot
VITE_WHATSAPP_DEFAULT_RECIPIENT=+2250102030405  # Votre numéro WhatsApp
```

#### Option B: Twilio WhatsApp (Recommandé pour production)

Solution professionnelle et fiable.

1. Créez un compte sur https://www.twilio.com
2. Activez WhatsApp dans votre console Twilio
3. Obtenez vos credentials

Variables d'environnement serveur (fonction Edge ou worker, jamais dans un bundle Vite) :
```bash
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+14155238886  # Numéro Twilio WhatsApp
WHATSAPP_DEFAULT_RECIPIENT=+2250102030405
```

#### Option C: WhatsApp Business API (Meta)

Pour les entreprises avec un compte WhatsApp Business vérifié.

1. Créez une app Meta Business
2. Configurez WhatsApp Business API
3. Obtenez votre access token et numéro

Variables d'environnement serveur (fonction Edge ou worker, jamais dans un bundle Vite) :
```bash
WHATSAPP_PROVIDER=whatsapp_business_api
WHATSAPP_ACCESS_TOKEN=votre_access_token
WHATSAPP_BUSINESS_NUMBER=votre_numero_whatsapp_business
WHATSAPP_DEFAULT_RECIPIENT=+2250102030405
```

#### Option D: MessageBird

Alternative professionnelle à Twilio.

Variables d'environnement serveur (fonction Edge ou worker, jamais dans un bundle Vite) :
```bash
WHATSAPP_PROVIDER=messagebird
MESSAGEBIRD_API_KEY=votre_api_key
WHATSAPP_PHONE_NUMBER=+14155238886  # Numéro MessageBird WhatsApp
WHATSAPP_DEFAULT_RECIPIENT=+2250102030405
```

### 3. Configuration des numéros de téléphone

#### Pour les notifications globales
Utilisez `VITE_WHATSAPP_DEFAULT_RECIPIENT` pour recevoir toutes les notifications sur un numéro unique.

#### Pour les notifications par locataire
Après avoir appliqué la migration `20260604161000_add_whatsapp_notifications.sql`, vous pouvez ajouter des numéros WhatsApp individuels pour chaque locataire :

```sql
-- Mettre à jour un locataire avec son numéro WhatsApp
UPDATE locataires 
SET whatsapp_number = '+2250102030405',
    whatsapp_notifications_enabled = true
WHERE id = 'uuid_du_locataire';
```

Le système utilisera automatiquement le numéro WhatsApp du locataire s'il est disponible, sinon il utilisera le numéro par défaut.

### 4. Configuration OneSignal pour les paiements

Les notifications push OneSignal liées aux paiements sont envoyées par l'Edge Function `send-payment-notification`.

Variables runtime Supabase requises :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_API_KEY`

Le workflow GitHub Actions `deploy-supabase-functions.yml` synchronise ces secrets avant de déployer la fonction sur le projet Supabase.

## Utilisation

### Notification automatique

Les notifications sont automatiquement déclenchées lorsqu'un paiement est effectué :

- **INSERT** : Un nouveau paiement est créé avec statut "paye"
- **UPDATE** : Le statut d'un paiement passe à "paye"

### Format des notifications

#### Notification WhatsApp
```
💰 NOUVEAU PAIEMENT REÇU

👤 Locataire: Kouassi Jean
💵 Montant: 150 000 FCFA
🏠 Propriété: Villa Cocody, Rue 12

📅 Date: 04/06/2026

Gnamba Services - EGS
```

#### Notification Toast (fallback)
- **Type** : `payment` (avec icône 💰)
- **Titre** : "Nouveau paiement reçu"
- **Message** : "[Nom locataire] a payé [Montant] pour [Adresse propriété]"
- **Durée** : 8 secondes

### Comportement du système

1. **Priorité WhatsApp** : Le système essaie d'abord d'envoyer une notification WhatsApp
2. **Fallback automatique** : Si WhatsApp échoue, une notification toast s'affiche dans l'interface
3. **Log détaillé** : Les succès et échecs sont loggués dans la console du navigateur
4. **Historique** : Si la table `whatsapp_notifications` est créée, tous les envois sont enregistrés

## Test

### Tester les notifications

1. Assurez-vous que Realtime est activé sur `rent_payments`
2. Ouvrez l'application EGS dans le module Immobilier
3. Dans un autre navigateur ou onglet, créez ou modifiez un paiement avec statut "paye"
4. Vous devriez voir apparaître une notification toast dans le coin supérieur droit

### Vérifier la connexion Realtime

Ouvrez la console du navigateur (F12) et recherchez les logs :
- `"Realtime subscription status: SUBSCRIBED"` indique une connexion réussie
- `"Realtime subscription status: CLOSED"` indique un problème de connexion

## Dépannage

### Les notifications WhatsApp ne s'envoient pas

1. **Vérifiez la configuration** : Assurez-vous que les variables d'environnement sont correctes
2. **Vérifiez le fournisseur** : Testez d'abord avec CallMeBot (gratuit) pour vérifier que le système fonctionne
3. **Vérifiez les logs** : Regardez dans la console du navigateur (F12) pour les erreurs
4. **Vérifiez le format du numéro** : Les numéros doivent être au format international (+225XXXXXXXXX)
5. **Vérifiez les credits** : Certains fournisseurs (Twilio, MessageBird) nécessitent des crédits

### Les notifications apparaissent mais pas sur WhatsApp

1. **Vérifiez le fallback** : Le système utilise les notifications toast si WhatsApp échoue
2. **Consultez les logs** : Messages comme "Échec de l'envoi WhatsApp, fallback vers notification toast"
3. **Vérifiez les credentials API** : Pour Twilio et autres, vérifiez que les clés sont valides

### Erreur de connexion Realtime

1. Vérifiez vos credentials Supabase dans `.env`
2. Assurez-vous que votre projet Supabase est actif
3. Vérifiez que vous n'avez pas dépassé les limites de votre plan Supabase
4. Vérifiez que Realtime est activé sur les tables concernées

### Limite CallMeBot dépassée

Si vous utilisez CallMeBot, vous êtes limité à 10 messages par jour. Pour une utilisation en production :
- Passez à Twilio ou WhatsApp Business API
- Ou configurez plusieurs comptes CallMeBot

## Extensions futures

### Améliorations possibles

1. **Templates de messages** : Personnaliser les messages WhatsApp selon le contexte
2. **Notifications groupées** : Regrouper plusieurs paiements dans un seul message
3. **Notifications pour retards** : Alerte automatique pour les paiements en retard
4. **Messages interactifs** : Boutons de réponse dans WhatsApp (confirmer, annuler, etc.)
5. **Messages multimédias** : Envoyer des quittances en PDF via WhatsApp
6. **Notifications multi-destinataires** : Envoyer à plusieurs personnes (propriétaire, gestionnaire, etc.)
7. **Programmation** : Envoyer des rappels avant les échéances
8. **Analytics** : Suivi des taux de livraison et lecture des messages
9. **Webhooks** : Réponses des locataires via WhatsApp intégrées dans le système
10. **Notifications SMS fallback** : Si WhatsApp échoue, tenter SMS

### Personnalisation des messages

Le système peut être étendu pour supporter des messages personnalisés :

```typescript
// Exemple de personnalisation
const customMessage = `
💰 *PAIEMENT REÇU* - ${companyName}

👤 ${tenantName}
💵 ${formattedAmount}
🏠 ${propertyAddress}

📅 ${date}
⏰ ${time}

Merci pour votre paiement !
`;
```

### Table de notifications (déjà incluse)

La table `whatsapp_notifications` est déjà créée par la migration pour l'historique :
- Suivi des messages envoyés
- Statut de livraison
- Erreurs et retries
- Analytics des notifications

## Support

Pour toute question ou problème concernant les notifications en temps réel, consultez :

- Documentation Supabase Realtime : https://supabase.com/docs/guides/realtime
- Documentation React Context : https://react.dev/reference/react/useContext
