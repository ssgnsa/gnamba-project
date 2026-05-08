# Build stage
# Pinned by digest for reproducible builds (update with: docker inspect --format='{{index .RepoDigests 0}}' node:20-alpine)
FROM node:20-alpine@sha256:42d1d5b07c84257b55d409f4e6e3be3b55d42867afce975a5648a3f231bf7e81 AS builder

WORKDIR /app

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
# If unset, Vite can still read values from .env files in the project.
# Supports both cloud and local Supabase configurations
ARG VITE_SUPABASE_MODE
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_LOCAL_URL
ARG VITE_SUPABASE_LOCAL_ANON_KEY

# Build the application
RUN set -eux; \
    case "${VITE_SUPABASE_MODE:-auto}" in \
      local|cloud|auto) ;; \
      *) echo "VITE_SUPABASE_MODE must be one of: local, cloud, auto"; exit 1 ;; \
    esac; \
    if [ -n "${VITE_SUPABASE_URL:-}" ] && [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then \
      echo "VITE_SUPABASE_ANON_KEY is required when VITE_SUPABASE_URL is provided"; \
      exit 1; \
    fi; \
    if [ -n "${VITE_SUPABASE_ANON_KEY:-}" ] && [ -z "${VITE_SUPABASE_URL:-}" ]; then \
      echo "VITE_SUPABASE_URL is required when VITE_SUPABASE_ANON_KEY is provided"; \
      exit 1; \
    fi; \
    if [ -n "${VITE_SUPABASE_LOCAL_URL:-}" ] && [ -z "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ]; then \
      echo "VITE_SUPABASE_LOCAL_ANON_KEY is required when VITE_SUPABASE_LOCAL_URL is provided"; \
      exit 1; \
    fi; \
    if [ -n "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ] && [ -z "${VITE_SUPABASE_LOCAL_URL:-}" ]; then \
      echo "VITE_SUPABASE_LOCAL_URL is required when VITE_SUPABASE_LOCAL_ANON_KEY is provided"; \
      exit 1; \
    fi; \
    if [ -n "${VITE_SUPABASE_URL:-}" ]; then export VITE_SUPABASE_URL; fi; \
    if [ -n "${VITE_SUPABASE_ANON_KEY:-}" ]; then export VITE_SUPABASE_ANON_KEY; fi; \
    if [ -n "${VITE_SUPABASE_LOCAL_URL:-}" ]; then export VITE_SUPABASE_LOCAL_URL; fi; \
    if [ -n "${VITE_SUPABASE_LOCAL_ANON_KEY:-}" ]; then export VITE_SUPABASE_LOCAL_ANON_KEY; fi; \
    if [ -n "${VITE_SUPABASE_MODE:-}" ]; then export VITE_SUPABASE_MODE; fi; \
    npm run build

# Production stage
# Pinned by digest for reproducible builds (update with: docker inspect --format='{{index .RepoDigests 0}}' nginx:alpine)
FROM nginx:alpine@sha256:e7257f1ef28ba17cf7c248cb8ccf6f0c6e0228ab9c315c152f9c203cd34cf6d1

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
