# Production stage only - uses pre-built assets from host
# No builder stage needed as we copy pre-built dist from local build
# (npm install inside Docker is too slow due to network latency)

FROM nginx:alpine@sha256:e7257f1ef28ba17cf7c248cb8ccf6f0c6e0228ab9c315c152f9c203cd34cf6d1

# Copy pre-built files from host build output
COPY dist /var/www/egs/current

# Copy nginx configuration (no template substitution needed - no env vars in template)
COPY nginx/nginx-release.conf /etc/nginx/conf.d/default.conf

# Include the runtime entrypoint that performs placeholder substitution.
# The script expects placeholders like __VITE_LOCAL_API_URL__ in JS bundles.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Expose port 80
EXPOSE 80

# Health check - check local nginx health endpoint instead of external API
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]