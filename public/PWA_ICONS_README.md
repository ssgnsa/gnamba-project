# PWA Icons - Instructions

## Icônes générées

Les fichiers suivants sont des espaces réservés (placeholders):

- `icon-192.png`
- `icon-512.png`

## Comment générer les icônes

### Option 1: Utiliser un générateur en ligne (Recommandé)

1. Allez sur [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Téléchargez votre logo (512x512 px minimum)
3. Générez les icônes
4. Copiez `icon-192.png` et `icon-512.png` dans `/public`

### Option 2: Utiliser le script Node.js

```bash
# Installer la dépendance
npm install canvas

# Exécuter le script
node scripts/generate-icons.js
```

### Option 3: Utiliser Figma/Canva

1. Créez un design 512x512 px
2. Exportez en PNG
3. Redimensionnez pour 192x192 px
4. Placez dans `/public`

### Option 4: Utiliser ImageMagick (Linux/Mac)

```bash
# Installer ImageMagick
sudo apt install imagemagick  # Linux
brew install imagemagick      # Mac

# Générer les icônes
convert -size 512x512 xc:'#1e40af' -fill white -gravity center \
  -pointsize 200 -annotate 0 'EGS' public/icon-512.png

convert public/icon-512.png -resize 192x192 public/icon-192.png
```

## Structure recommandée

```
public/
├── manifest.json
├── default-logo.svg      # Icône SVG par défaut
├── icon-192.png          # Pour Android (192x192)
├── icon-512.png          # Pour PWA (512x512)
└── og-image.png          # Pour réseaux sociaux (1200x630)
```

## Vérification

Après avoir ajouté les icônes, testez avec:

- Chrome DevTools > Application > Manifest
- [Web App Manifest Validator](https://manifest-validator.appspot.com/)
