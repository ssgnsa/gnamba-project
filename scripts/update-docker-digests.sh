#!/bin/bash
# ============================================
# EGS — Update Docker Image Digests
# ============================================
# Purpose: Fetch latest digests for node:20-alpine and nginx:alpine
#          and update the Dockerfile for reproducible builds
# Usage: bash scripts/update-docker-digests.sh
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKERFILE="${PROJECT_DIR}/Dockerfile"

echo "🔍 Fetching latest Docker image digests..."

# Fetch node:20-alpine digest
NODE_DIGEST=$(docker manifest inspect node:20-alpine 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['manifests'][0]['digest'])" 2>/dev/null || {
    docker pull node:20-alpine --quiet >/dev/null 2>&1
    docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine 2>/dev/null | sed 's/.*@//'
})

# Fetch nginx:alpine digest
NGINX_DIGEST=$(docker manifest inspect nginx:alpine 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['manifests'][0]['digest'])" 2>/dev/null || {
    docker pull nginx:alpine --quiet >/dev/null 2>&1
    docker inspect --format='{{index .RepoDigests 0}}' nginx:alpine 2>/dev/null | sed 's/.*@//'
})

if [ -z "$NODE_DIGEST" ] || [ -z "$NGINX_DIGEST" ]; then
    echo "❌ Failed to fetch digests. Check Docker connectivity."
    exit 1
fi

echo "   node:20-alpine  → ${NODE_DIGEST}"
echo "   nginx:alpine    → ${NGINX_DIGEST}"

# Update Dockerfile (preserve existing non-digest references first)
sed -i "s|FROM node:20-alpine@sha256:[a-f0-9]\{64\}|FROM node:20-alpine@${NODE_DIGEST}|g" "$DOCKERFILE"
sed -i "s|FROM nginx:alpine@sha256:[a-f0-9]\{64\}|FROM nginx:alpine@${NGINX_DIGEST}|g" "$DOCKERFILE"

echo "✅ Dockerfile updated with pinned digests"
echo "   Commit this change to maintain reproducibility"
