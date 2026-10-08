# Provisionnement Docker contrôlé — nouvel hôte

Cette procédure initialise une pile EGS isolée sur un nouvel hôte Linux doté de
Docker Compose, derrière le reverse proxy/TLS existant. Elle ne déploie pas sur
le serveur actuel et ne contacte pas son PostgreSQL.

## Avant le démarrage

1. Choisir un commit `main` ou `master` dont les contrôles du workflow
   `Build and Deploy` sont tous réussis : build, lint, typecheck, tests
   frontend et backend, migrations PostgreSQL temporaires et validation des
   deux configurations Compose.
2. Sur le nouvel hôte, extraire ce commit dans un checkout propre du dépôt
   `ssgnsa/gnamba-project`. Le déploiement refuse les changements non committés.
3. Faire inscrire le nom court réel du nouvel hôte dans une allowlist après
   vérification indépendante de l'identité de la machine. Le nom attendu doit
   être fourni et confirmé par l'administrateur du nouvel hôte; ne pas utiliser
   `gnamba-server`. Sur le nouvel hôte seulement, le script lit
   `/etc/egs/new-host-hostnames`, exige un fichier régulier root-owned en mode
   `0600` ou `0640`, et interdit explicitement `gnamba-server` :

   ```bash
   sudo groupadd --system egs-deploy
   sudo usermod -aG egs-deploy <utilisateur-de-deploiement>
   sudo install -d -o root -g egs-deploy -m 0750 /etc/egs
   printf '%s\n' '<NOUVEL_HOTE_CONFIRME>' |
     sudo install -o root -g egs-deploy -m 0640 /dev/stdin /etc/egs/new-host-hostnames
   ```

   Cette installation est à effectuer après connexion administrative au nouvel
   hôte, jamais sur `gnamba-server`. Le script exige le contexte Docker
   `default`, l'un des sockets locaux `/var/run/docker.sock` ou
   `/run/docker.sock`, et un nom de daemon Docker égal au hostname local. Les
   variables `DOCKER_HOST`, `DOCKER_CONTEXT` et TLS de sélection distante sont
   ignorées.
4. Copier `ops/deploy/new-host.env.example` vers `.env.new-host` et
   `ops/deploy/new-host-api.env.example` vers `.env.new-host-api`. Générer des
   secrets distincts avec `openssl rand -hex 32`; ne pas réutiliser les secrets
   de la production actuelle. Garder `EGS_API_ENV_FILE=.env.new-host-api` et
   protéger les deux fichiers avec `chmod 600`.
5. Remplir `EGS_EXPECTED_HOSTNAME` avec le nom court retourné par `hostname -s`.
   Construire `DATABASE_URL` sous la forme
   `postgresql://egs_app:<EGS_DB_APP_PASSWORD>@egs-postgres:5432/egs_local`.
   La procédure vérifie cette cible avant le moindre accès DB; les variables
   héritées du shell ne peuvent pas remplacer les valeurs validées dans Compose.
6. Configurer les URL HTTPS publiques de l’application, de l’API et du
   stockage/Filebrowser. Renseigner `VITE_STORAGE_BASE_URL` avec l’URL HTTPS
   publique incluant le préfixe de stockage (par exemple
   `https://files.gnambaservices.ci/egs`) et inclure son origine, sans chemin,
   dans `CORS_ORIGINS`. Router les hôtes web et Filebrowser vers
   `http://127.0.0.1:18080` et le domaine API directement vers
   `http://127.0.0.1:18000`. Modifier `API_PORT` ou `WEB_PORT` uniquement si le
   proxy est reconfiguré en conséquence. Le proxy doit transmettre
   `X-Forwarded-Proto: https` à l'API.
7. Fournir `INITIAL_ADMIN_PASSWORD` pour le premier démarrage (12 à 72 octets)
   et définir les variables SMTP si la réinitialisation par courriel est
   nécessaire. Ne placer dans `.env.new-host-api` que les secrets d'intégration
   API optionnels; les secrets d'administration DB/Filebrowser y sont refusés.

## Validation et déploiement initial

La validation ne démarre ni ne modifie les conteneurs :

```bash
python3 scripts/deploy_new_host.py validate --env-file .env.new-host
python3 scripts/deploy_new_host.py preflight \
  --env-file .env.new-host \
  --confirm-host "$(hostname -s)"
```

Après avoir vérifié manuellement que le workflow CI est vert pour le SHA visé,
lancer la commande d'initialisation avec ce SHA exact :

```bash
SHA="$(git rev-parse HEAD)"
python3 scripts/deploy_new_host.py deploy-initial \
  --env-file .env.new-host \
  --confirm-host "$(hostname -s)" \
  --approved-sha "$SHA" \
  --approve-migrations
```

Le script refuse une configuration invalide, un hôte différent, un dépôt
inattendu, un worktree sale, des ports occupés ou un SHA différent. Il exécute
les contrôles frontend, construit les images taguées par SHA, démarre uniquement
PostgreSQL et Redis, vérifie que la base est vide et que `egs_app` n'est pas
superutilisateur, crée un dump privé et le restaure dans une base temporaire de
vérification, puis exige les deux gardes de migration et migre avec `egs_app`.
API, web et Filebrowser ne sont démarrés qu'après succès; la santé API vérifie
aussi la révision Alembic. Le seed d'administrateur est bloquant en cas d'échec.
Après avoir changé le mot de passe initial depuis l'application, supprimer
`INITIAL_ADMIN_PASSWORD` de `.env.new-host`; Compose accepte ensuite sa valeur
vide pour les redémarrages normaux, tandis que le script d'initialisation
continuera à exiger un mot de passe initial renseigné.

La sauvegarde initiale est conservée dans `backups/new-host/` en mode privé.
Elle prouve la capacité de restauration de la base vierge avant migration; elle
ne remplace pas les sauvegardes chiffrées hors hôte et les tests de reprise
requis pour les données réelles.

### Gate 5 et contrat du runner

La décision de sauvegarde/reprise reste celle du contrôle existant :
**Gate 5 = PASS** doit être vérifié dans les preuves opérationnelles avant
d'autoriser une mise en service. Le script nouvel hôte ne remplace pas cette
décision par une valeur saisie par l'opérateur. Pour l'initialisation, il crée
son dump privé, vérifie le retour de `pg_dump`, puis restaure le dump dans une
base temporaire et attend le succès de `pg_restore`. Il transmet ensuite au
runner le contrat strict existant `EGS_BACKUP_VERIFIED=1`, avec
`EGS_MIGRATION_APPROVED=1` uniquement après le drapeau explicite
`--approve-migrations`. L'absence d'une étape, son erreur ou toute valeur
différente de `1` arrête la procédure avant Alembic.

## Contrôles après démarrage

Avant d'ouvrir le DNS ou de déclarer le service en exploitation :

1. Vérifier `https://<API_HOST>/ready` et `https://<WEB_HOST>/health` avec
   `curl --fail --show-error`. `/ready` doit répondre HTTP 200 seulement si la
   base et la révision Alembic sont accessibles.
2. Télécharger `https://<WEB_HOST>/VERSION.json` et confirmer que
   `git_commit` égale exactement le SHA approuvé.
3. Tester une connexion Filebrowser via
   `https://<WEB_HOST>/filebrowser/` avec le mot de passe configuré, puis
   confirmer que le mot de passe par défaut `admin` est refusé.
4. Vérifier dans le reverse proxy que le domaine API transmet
   `X-Forwarded-Proto: https`, puis tester une connexion et une déconnexion
   depuis le navigateur. Confirmer que PostgreSQL et Redis ne sont pas publiés
   et que les ports API/web restent liés à `127.0.0.1`.
5. Examiner `docker compose -p egs-new-host -f docker-compose.new-host.yml ps`
   et les journaux de chaque service; ne pas considérer le déploiement réussi
   si un healthcheck échoue.

## Refus et reprise

- Une base contenant une table applicative ou `alembic_version` n'est pas
  considérée comme neuve. Aucune migration n'est lancée; le volume est conservé.
- Une erreur de build, backup, restauration, migration ou readiness arrête le
  processus sans `docker compose down -v`, suppression ou réinitialisation de
  volume. Examiner les journaux avec
  `docker compose -p egs-new-host -f docker-compose.new-host.yml logs`, puis
  corriger la cause avant toute nouvelle action.
- Pour interrompre une première mise en service défaillante, arrêter seulement
  les services applicatifs et préserver tous les volumes et dumps :

  ```bash
  docker compose -p egs-new-host -f docker-compose.new-host.yml \
    stop egs-web egs-api filebrowser
  ```

  Ne pas rétrograder Alembic et ne pas restaurer automatiquement le dump
  initial; toute restauration DB nécessite une approbation distincte après
  vérification de la cible `egs_local` de ce projet.
- L'action `deploy-initial` n'est pas une procédure de mise à niveau. Après
  l'initialisation, toute migration ultérieure exige un plan distinct, un
  backup vérifié, une approbation explicite et une procédure de restauration.
- Il n'existe pas de rollback automatique du schéma ou des données. Un rollback
  de code n'est autorisé qu'après vérification de la compatibilité de l'image
  antérieure avec la révision Alembic courante; sinon conserver l'application
  arrêtée et confier la restauration à un DBA. Aucune commande de suppression
  de volume n'est prévue.
- La publication des ports reste liée à localhost; ne pas ouvrir directement
  PostgreSQL, Redis, l'API ou Filebrowser sur Internet. Le reverse proxy/TLS et
  DNS doivent être validés séparément avant d'exposer le service.

## Services et persistance

`docker-compose.new-host.yml` publie le web et l'API uniquement sur localhost;
PostgreSQL et Redis sont accessibles uniquement au réseau backend interne.
L'API doit être routée directement par le reverse proxy (pas à travers le
Nginx web) afin de préserver l'indication HTTPS vérifiée pour les parcours
d'authentification. Les fichiers Filebrowser sont accessibles au travers du
Nginx web. Les données PostgreSQL, uploads, fichiers Filebrowser et sa base
SQLite sont persistées dans des volumes du projet `egs-new-host`, distincts
des anciens stacks.
