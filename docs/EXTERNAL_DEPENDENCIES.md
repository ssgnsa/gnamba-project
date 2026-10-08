# EGS — Dépendances externes

**État d'inventaire :** 2026-10-07, Session 1; secrets et contenus de
configuration volontairement non lus. Les états `à confirmer` ne signifient
pas qu'un fournisseur est configuré.

| Dépendance | Criticité | Usage observé / déclaré | Fonctionnement hors Internet | État / validation requise |
| --- | --- | --- | --- | --- |
| Cloudflare DNS + Tunnel | Critique | Tunnel `cloudflared` actif; exposition de l'application publique et de l'API | Le LAN peut garder l'accès par origine si la politique réseau le permet; accès Internet public indisponible | Confirmer les zones, ingress et statut de rotation du token depuis le compte administrateur |
| Domaine / DNS public | Important | Site principal, variantes `www`/`portal`, API | Application locale fonctionne par adresse directe seulement | DNS/TLS testés; inventaire des propriétaires/renouvellements à compléter |
| GitHub (`origin`) | Important pour développement | Source Git et workflows CI | Runtime existant peut continuer avec images présentes | Aucun accès GitHub requis pour servir l'image déployée; branches/remote non modifiés |
| PostgreSQL local | Critique | Source de données et schéma Alembic | Oui, si le serveur reste en marche | Cinq bases dans un cluster; rôle app superuser à remplacer |
| Container image registry / Internet | Important pour build | Images déjà en cache; Compose utilise des tags mutables dont `latest` | Runtime courant fonctionne sans pull tant que les images persistent | Build/recréation peuvent nécessiter Internet; versions/digests et provenance à épingler |
| SMTP | Important pour récupération de compte | Code FastAPI supporte SMTP; variables SMTP absentes/non configurées dans l'environnement inspecté | Oui pour fonctions ERP hors mail; reset mail ne peut pas aboutir | Tester un mail contrôlé et définir le fournisseur si requis |
| Cloudflare Turnstile | Optionnel | Clé de site et option dans le frontend | Non pour CAPTCHA si activé; dépend d'un service externe | Configuration effective et politique d'accès à confirmer |
| Sentry | Optionnel | Intégration frontend par `VITE_SENTRY_DSN` | Application peut tourner si désactivé | Vérifier s'il est activé et quelles données de diagnostic quittent le serveur |
| OneSignal | Optionnel | Push via `VITE_ONESIGNAL_APP_ID` | Pas de push si hors ligne | Usage/configuration effective inconnus; documenter données transmises |
| WhatsApp/notifications | Optionnel, potentiellement important | Code prévoit CallMeBot, Twilio, MessageBird et WhatsApp Business API | Non pour envoi externe | Aucun fournisseur runtime confirmé; choix/configuration/secrets restent à confirmer |
| Ollama | Optionnel | Client IA frontend configure par défaut `ollama.local:11434` | Potentiellement local, si modèle et service sont installés | Pas de conteneur Ollama dans l'inventaire Docker; service hôte et résolution locale à confirmer. Le navigateur s'y connecte directement, pas via un gateway ERP unique. |
| Filebrowser | Important pour la GED existante | Conteneur local actif, partage hôte `/home/soma/partage` | Oui, si serveur et partage restent disponibles | Port publié sur toutes les interfaces; confirmer nécessité, auth et périmètre du partage |
| n8n | À confirmer | Image disponible et SQLite suivie avec données de clés; aucun conteneur actif | Les automatisations ne tournent pas actuellement dans Docker | Identifier propriétaire/backup et révoquer les clés après revue; ne pas supprimer le fichier |
| MinIO / Qdrant / Collabora / Nextcloud | Futur / inconnu | Cités dans certains documents de trajectoire; aucun conteneur actif détecté | Non applicable au runtime inventorié | Ne pas considérer comme dépendance installée ou comme architecture cible approuvée |
| Réseaux locaux / SMB | Important pour administration | Ports SMB 139/445 à l'écoute; partage Filebrowser local | Services LAN locaux possibles | Portée d'exposition et règles firewall à vérifier en root |

## Ce qui empêche le fonctionnement hors connexion

- Les connexions publiques via DNS/Cloudflare Tunnel et certificats gérés en
  ligne cessent de fonctionner si Internet est indisponible; les routes locales
  peuvent rester accessibles.
- Les intégrations externes SMTP, Turnstile, Sentry, OneSignal et WhatsApp
  nécessitent le réseau/fournisseur correspondant si activées.
- Pull d'images Docker, installation de dépendances et mises à jour Git
  nécessitent généralement Internet. Les images courantes sont en cache.
- Le parcours ERP principal vers PostgreSQL est auto-hébergé et peut fonctionner
  localement, sous réserve des tests de démarrage et de cohérence de version.

## Inconnues

Le statut de rotation Cloudflare, les règles DNS et pare-feu, le fournisseur
SMTP, les variables runtime exactes des intégrations optionnelles, les licences
et les propriétaires de compte ne peuvent être établis sans accès
administrateur. Aucune valeur de secret n'est reproduite dans ce document.
