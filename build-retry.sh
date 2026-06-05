#!/bin/bash
# Build avec retry en cas de timeout réseau

set -e

MAX_RETRIES=5
RETRY_COUNT=0

echo "🔧 Build Docker avec retry (max $MAX_RETRIES tentatives)..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo ""
    echo "Tentative $((RETRY_COUNT + 1))/$MAX_RETRIES..."
    
    if docker build -t egs-web:nofb -f Dockerfile.nofb . 2>&1; then
        echo "✅ Build réussi !"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Échec, nouvelle tentative dans 10 secondes..."
            sleep 10
        fi
    fi
done

echo "❌ Build échoué après $MAX_RETRIES tentatives"
exit 1
