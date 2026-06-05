# EGS_MATRICE_REFERENCE

## 1. Matrice Rôles × Modules

| Module | Directeur | Foncière | Immobilier | BTP | Finances | RH | IT/DevOps |
|--------|----------|----------|------------|-----|----------|----|-----------|
| CRM | C | R | I | I | I | I | S |
| Foncier | I | R | C | I | I | I | S |
| Immobilier | I | C | R | I | I | I | S |
| BTP | I | I | I | R | C | I | S |
| Finances | I | I | I | I | R | C | S |
| RH | I | I | I | I | I | R | S |
| GED | C | R | R | R | R | R | S |
| Paie | I | I | I | I | C | R | S |
| Achats | I | I | I | R | C | I | S |
| Reporting | C | C | C | C | R | C | S |
| Monitoring | I | I | I | I | I | I | R |
| Backup | I | I | I | I | I | I | R |
| IA / Ollama | I | I | I | I | I | I | R |

Légende : R = Responsable / C = Consulté / I = Informé / S = Support

## 2. Modules et flux de données

| Module | Entrée | Sortie | Tables clés | Documents | Fréquence |
|--------|--------|--------|-------------|-----------|-----------|
| CRM | leads, contacts | opportunités, clients | clients, leads | propositions | quotidien |
| Foncier | parcelles, contrats | attestations, lots | lots, attestations | attestation foncière | hebdo/projet |
| Immobilier | biens, contrats | loyers, quittances | biens, contrats, loyers | quittance | mensuel |
| BTP | chantiers, devis | factures, réceptions | projets, achats | rapport chantier | projet |
| Finances | ventes, achats | bilan, trésorerie | ecritures, comptes | facture, rapport | mensuel |
| RH | employés, salaires | paie, carrière | employes, paies | bulletin paie | mensuel |
| GED | fichiers, versions | accès, archivage | documents, media | contrats, plans | continu |
| IA | documents, requêtes | réponses, résumés | embeddings? | aide décision | à la demande |

## 3. Statuts critiques à suivre

- `En cours` / `À valider` / `Terminé`
- `Bail actif` / `Bail expiré` / `Résilié`
- `Lot disponible` / `Lot réservé` / `Lot cédé`
- `Paiement en attente` / `Paiement reçu` / `Retard`
- `Document en cours` / `Document validé` / `Document archivé`

## 4. Zones d’alerte recommandées

| Alerte | Contexte | Priorité |
|--------|----------|----------|
| Backup échoué | `scripts/backup.sh` | Haute |
| Certificat SSL < 7j | Nginx | Haute |
| Disque > 85% | Serveur | Haute |
| Service down | EGS, Postgres, Nginx | Haute |
| Supabase local offline | Dev local | Moyenne |
| Erreur 500 récurrente | Frontend/API | Moyenne |
| Échec migration DB | Supabase / scripts | Moyenne |
| Fichier orphelin | GED | Basse |

## 5. Liste rapide de commandes utiles

### Vérification de configuration
```bash
bash scripts/validate-env.sh .env
docker compose -f docker-compose.prod.yml config
docker compose ps
supabase status
```

### Sauvegarde / restauration
```bash
bash scripts/backup.sh full
bash scripts/backup.sh list
bash scripts/backup.sh restore --file ./backups/postgres/backup_full_YYYYMMDD_HHMMSS.sql.gz
```

### Nginx / proxy
```bash
docker exec -it egs-nginx-proxy nginx -t
curl -I https://erp.domaine.com
```

### Monitoring
```bash
docker compose -f docker-compose.monitor.yml config
```

## 6. Checks rapides de gouvernance

- [ ] `.env.example` est la source de vérité
- [ ] `.env` n’est pas commité dans Git
- [ ] Secrets sont hors repo (Bitwarden/Vault)
- [ ] `SUPABASE_DB_PASSWORD` ne contient pas d’espace ni de point-virgule
- [ ] `JWT_SECRET` a 32+ caractères
- [ ] `VITE_SUPABASE_MODE` est en cohérence avec l’environnement
- [ ] `VITE_FILEBROWSER_URL` pointe vers le domaine correct
- [ ] `docker-compose.prod.yml` est aligné avec les ports Nginx

## 7. Requêtes SQL de production rapide

```sql
-- Identifier les loyers impayés
SELECT l.*
FROM loyers l
JOIN contrats c ON c.uuid = l.contrat_id
WHERE l.statut = 'En attente';

-- Comptabiliser les lots disponibles
SELECT COUNT(*) FROM lots WHERE statut = 'Disponible';

-- Documents sans référence métier
SELECT d.* FROM documents d
WHERE d.entite_id IS NULL OR d.entite_type IS NULL;
```

## 8. Références de file sharing et GED

- Chemin cible recommandé : `/srv/egs-docs/{module}/{année}/{mois}/{uuid}`
- Convention : `{module}_{type}_{date}_{uuid}_v{n}.{ext}`
- Modules GED prioritaires : Foncier, Immobilier, BTP, Finances, RH
- Stockage objet : MinIO ou FS local avec FileBrowser

## 9. Glossaire rapide

- ERP : Enterprise Resource Planning
- GED : Gestion Électronique des Documents
- RLS : Row Level Security
- PRA : Plan de Reprise d’Activité
- RTO : Recovery Time Objective
- RPO : Recovery Point Objective
- WOPI : Web Application Open Platform Interface
- IA : Intelligence Artificielle
