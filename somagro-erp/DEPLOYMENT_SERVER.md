# SomAgro ERP - Server Deployment

## 1) Prepare env

Copy and fill:

```bash
cp somagro-erp/.env.server.example somagro-erp/.env.server
```

Remplir avec les valeurs Supabase Cloud (URL + anon key). Le port par defaut est `8082`.
Le mode hybride est controle par `SOMAGRO_SUPABASE_MODE`:

- `cloud`: force Supabase Cloud
- `local`: force Supabase local
- `hybrid`: local pour les acces internes (localhost/192.168.x.x), cloud pour le domaine public

## 2) Build and run

```bash
./deploy-somagro.sh
```

## 3) Cloudflare Tunnel

Ajouter une regle d ingress dans la config cloudflared:

```
- hostname: somagro.gnambaservices.ci
  service: http://localhost:8082
```

Reload the cloudflared service after updating the config.

## 4) Health check

```
curl -I http://localhost:8082/api/health
```

## 5) Supabase auto-heberge (optionnel)

Demarrer une instance locale Supabase pour SomAgro:

```bash
cd somagro-erp
supabase start
```

Les ports locaux par defaut sont:

- API: `55321`
- DB: `55322`
- Studio: `55323`

Mettez a jour `.env.server` si vous voulez basculer l app vers l instance locale.

Dans le workspace partage, la source de verite operatoire est:

```bash
cd /home/soma/gnamba-project
bash scripts/workspace-stack.sh somagro status
bash scripts/workspace-doctor.sh somagro
```
