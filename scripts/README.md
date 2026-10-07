# EGS Scripts - Documentation

Structure normalisée des scripts EGS.

## Dossiers

- `backup/` - Gestion backups (2 scripts)
- `_archive/` - Scripts obsolètes (12 archivés)
- `deploy/` - Déploiement (à créer)
- `sync/` - Synchronisation (à créer)

## Commandes NPM

```bash
  npm run backup           # Backup distant
npm run backup:local     # Backup local
npm run backup:restore   # Restaurer
npm run backup:list      # Lister backups
```

## Scripts Backup

### backup-manager.sh
Usage: `./backup/backup-manager.sh [backup|restore|verify|list|cleanup]`

### backup-scheduler.sh
Usage: `./backup/backup-scheduler.sh [install|remove|status]`
