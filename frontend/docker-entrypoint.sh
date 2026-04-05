#!/bin/sh
# ── Runtime config injection ──────────────────────────────────────────────────
# Writes /usr/share/nginx/html/config.js with the actual API_URL env var so
# the SPA can discover the backend without a rebuild.
#
# Default: /api  (works when nginx proxies /api → backend on same origin)
# Override: set API_URL=https://api.your-domain.com/api

API_URL="${API_URL:-/api}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  apiUrl: '${API_URL}',
};
EOF

echo "[entrypoint] config.js written — apiUrl=${API_URL}"

exec nginx -g "daemon off;"
