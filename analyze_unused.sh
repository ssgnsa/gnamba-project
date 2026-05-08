#!/bin/bash

echo "=== ANALYSE DES FICHIERS D'ATTESTATION ==="
echo ""

# Liste des fichiers à analyser
FILES="
./template-attestation-preview.html
./test-attestation-debug.html
./test-attestation-debug.ts
./test-real-attestation.html
./test-real-attestation.ts
./templates/attestation_villageoise_premium.html
"

for file in $FILES; do
    if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        echo "Fichier: $file"
        
        # Chercher si ce fichier est importé/référencé ailleurs
        found=$(grep -r "$basename_file" --include="*.js" --include="*.ts" --include="*.vue" --include="*.html" --include="*.json" \
                --exclude-dir="dist" --exclude-dir="dist-local" --exclude-dir="dist_old" --exclude-dir="node_modules" \
                . 2>/dev/null | grep -v "$file" | head -3)
        
        if [ -z "$found" ]; then
            echo "  ❌ NON UTILISÉ - Aucune référence trouvée"
        else
            echo "  ✅ UTILISÉ - Références trouvées:"
            echo "$found" | sed 's/^/    /'
        fi
        echo ""
    fi
done

# Chercher les fichiers du module foncier dans le code source
echo "=== FICHIERS SOURCES DU MODULE FONCIER ==="
find . -type f -not -path "*/dist*" -not -path "*/node_modules*" -not -path "*/dist_old*" \( -name "*.ts" -o -name "*.js" -o -name "*.vue" \) | while read src_file; do
    if grep -q -i "foncier\|attestation" "$src_file" 2>/dev/null; then
        echo "📄 $src_file"
    fi
done
