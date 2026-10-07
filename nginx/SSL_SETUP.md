# ============================================

# EGS - Guide de Configuration SSL

# ============================================

## Option 1: Let's Encrypt (Recommandé - Gratuit)

### 1. Installer Certbot

```bash
sudo apt update
sudo apt install certbot
```

### 2. Obtenir le certificat

```bash
sudo certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com
```

### 3. Copier les certificats

```bash
sudo cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/fullchain.pem
sudo chmod 600 ./nginx/ssl/privkey.pem
```

### 4. Renouvellement automatique

```bash
# Ajouter à crontab (sudo crontab -e)
0 3 * * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx-proxy
```

---

## Option 2: Certificat Auto-signé (Développement/Test)

```bash
cd nginx/ssl

# Générer un certificat auto-signé
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=CI/ST=Abidjan/L=Abidjan/O=Gnamba Services/CN=votre-domaine.com"

# Définir les permissions
chmod 644 fullchain.pem
chmod 600 privkey.pem
```

---

## Option 3: Certificat Commercial (DigiCert, GlobalSign, etc.)

1. Acheter un certificat SSL
2. Télécharger les fichiers fournis:
   - Certificat principal
   - Certificat intermédiaire (CA Bundle)
3. Concaténer:

```bash
cat votre-certificat.crt intermediate-ca.crt > fullchain.pem
cp votre-cle-privee.key privkey.pem
```

---

## Vérification

```bash
# Tester la configuration nginx
docker-compose -f docker-compose.prod.yml config

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker logs egs-nginx-proxy

# Tester HTTPS
curl -k https://localhost/health
```

---

## Structure des fichiers

```
nginx/
├── ssl/
│   ├── fullchain.pem    (certificat public + CA)
│   └── privkey.pem      (clé privée - CHMOD 600)
├── logs/                (logs nginx)
└── nginx.conf           (configuration)
```
