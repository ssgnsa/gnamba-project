**Cloudflare — guide rapide d'utilisation et uniformisation**

But: fournir une méthode cohérente pour configurer le tunnel Cloudflare, DNS et l'intégration dans le dépôt sans committer de secrets.

1) Exporter le token fourni (ne pas committer dans le repo) :

```bash
# Exemple (remplacez par votre token secret; ne pas committer)
export CLOUDFLARE_API_TOKEN="a76a1e98811712e150ad3aefdc165d00"
```

2) Créer le tunnel (sur la machine qui hébergera `cloudflared`):

```bash
# installer cloudflared si besoin
cloudflared tunnel create gnamba-tunnel
# notez l'ID renvoyé (TUNNEL_ID) et copiez le fichier credentials JSON dans /etc/cloudflared/
```

3) Préparer la config (adapter `cloudflared/config.yml.example` puis copier):

```bash
cp cloudflared/config.yml.example /etc/cloudflared/config.yml
# remplacez <TUNNEL_ID> et le chemin credentials-file
```

4) Mettre à jour DNS via le script du dépôt (utilise `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_TUNNEL_TARGET`):

```bash
# définissez la cible retournée par `cloudflared tunnel create`
export CLOUDFLARE_TUNNEL_TARGET="<TUNNEL_ID>.cfargotunnel.com"
./setup-cloudflare-dns.sh
```

5) Déployer `cloudflared` (systemd ou docker). Exemple docker-compose disponible: `docker/cloudflared-compose.yml`.

Option systemd: copiez `cloudflared/cloudflared.service.example` → `/etc/systemd/system/cloudflared.service`, adaptez `ExecStart` et `User` puis activez le service.

Option debug: utilisez `cloudflared/run-cloudflared.sh --tunnel-id <TUNNEL_ID> --credentials /etc/cloudflared/<TUNNEL_ID>.json` pour exécuter foreground et consulter les logs.

6) Vérifications:
- `cloudflared tunnel list`
- `dig +short gnambaservices.ci` (doit renvoyer le CNAME vers `cfargotunnel.com`)
- `curl -I https://gnambaservices.ci/` (vérifier 200 et TLS)

Remarques sécurité:
- N'ajoutez jamais de secrets (tokens) dans le dépôt git. Stockez-les dans un vault ou variables d'environnement côté serveur.
- Le script `setup-cloudflare-dns.sh` charge désormais `.env` si présent pour simplifier les déploiements automatisés.
