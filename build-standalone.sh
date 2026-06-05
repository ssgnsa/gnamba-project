#!/bin/bash
# Build script for standalone deployment

set -e

# Source the standalone env
source .env.standalone

echo "🚀 Building egs-frontend:standalone with Supabase Cloud..."
echo "   Mode: $VITE_SUPABASE_MODE"
echo "   URL: ${VITE_SUPABASE_URL:0:30}..."

docker build \
  -f Dockerfile.standalone \
  --build-arg VITE_SUPABASE_MODE="$VITE_SUPABASE_MODE" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t egs-frontend:standalone \
  -t egs-frontend:latest \
  .

echo ""
echo "✅ Build completed!"
echo ""
echo "To run locally:"
echo "  docker-compose -f docker-compose.standalone.yml up"
echo ""
echo "To run with custom port:"
echo "  docker run -p 3000:80 egs-frontend:standalone"
