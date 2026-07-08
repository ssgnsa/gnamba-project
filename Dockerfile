# Build stage
# Pinned by digest for reproducible builds (update with: docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine)
FROM node:20-alpine@sha256:42d1d5b07c84257b55d409f4e6e3be3b55d42867afce975a5648a3f231bf7e81 AS builder

WORKDIR /app

# Le build prod n'a pas besoin de télécharger Chromium pour Puppeteer.
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Copy package files
COPY package*.json ./

# Install dependencies (dev deps required for Vite build)
# Harden npm against transient registry timeouts in CI/build environments.
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 120000 \
  && npm config set registry https://registry.npmjs.org/ \
  && npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Optional build-time overrides for Vite env vars.
# Le build est local-only: le frontend lit uniquement l'API FastAPI locale.
# For runtime substitution we default the build args to placeholders so the
# final JS bundles contain markers that `docker-entrypoint.sh` can replace.
ARG VITE_API_MODE=local
# Use placeholder tokens when no real value is provided at build time.
ARG VITE_LOCAL_API_URL="__VITE_LOCAL_API_URL__"

# Build the application
RUN set -eux; \
  build_mode="${VITE_API_MODE:-local}"; \
  if [ "$build_mode" != "local" ]; then \
  echo "VITE_API_MODE must be local for this workspace"; \
  exit 1; \
  fi; \
  if [ -z "${VITE_LOCAL_API_URL:-}" ]; then \
  echo "VITE_LOCAL_API_URL is required"; \
  exit 1; \
  fi; \
  export VITE_API_MODE=local \
  VITE_LOCAL_API_URL="${VITE_LOCAL_API_URL}"; \
  if [ -n "${VITE_FILEBROWSER_URL:-}" ]; then export VITE_FILEBROWSER_URL; fi; \
  if [ -n "${VITE_FILEBROWSER_API_URL:-}" ]; then export VITE_FILEBROWSER_API_URL; fi; \
  # Export the values (placeholders or real) so Vite embeds them into the build.
  export VITE_API_MODE=local \
  VITE_LOCAL_API_URL="${VITE_LOCAL_API_URL}"; \
  rm -rf dist dist-local; \
  npm run build; \
  test -f dist/index.html; \
  npm run release:check

# Production stage
# Pinned by digest for reproducible builds (update with: docker inspect --format='{{index .RepoDigests 0}}' nginx:alpine)
FROM nginx:alpine@sha256:e7257f1ef28ba17cf7c248cb8ccf6f0c6e0228ab9c315c152f9c203cd34cf6d1

# Copy built files to the same publication path used by bare-metal release.
COPY --from=builder /app/dist /var/www/egs/current

# Copy nginx configuration template and install gettext for envsubst
RUN apk add --no-cache gettext
COPY nginx/nginx-release.conf /etc/nginx/conf.d/default.conf.template
RUN cp /etc/nginx/conf.d/default.conf.template /etc/nginx/conf.d/default.conf

# Include the runtime entrypoint that performs placeholder substitution.
# The script expects placeholders like __VITE_LOCAL_API_URL__ in JS bundles.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider https://api.gnambaservices.ci/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
