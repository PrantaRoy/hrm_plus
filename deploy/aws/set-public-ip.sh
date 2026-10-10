#!/bin/bash
# Patches a root .env in place with a given public IP (or domain), so the browser-facing URLs
# match wherever the box is actually reachable. Run from the repo root, after `cp .env.example .env`.
#
# Usage: deploy/aws/set-public-ip.sh 3.25.111.22
#        deploy/aws/set-public-ip.sh my-demo.example.com   # also works with a real domain
set -euo pipefail

HOST="${1:?Usage: $0 <public-ip-or-domain>}"
ENV_FILE="${2:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found — run \`cp .env.example .env\` first" >&2
  exit 1
fi

sed -i.bak \
  -e "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=http://${HOST}:4000/api|" \
  -e "s|^VITE_SAAS_API_BASE_URL=.*|VITE_SAAS_API_BASE_URL=http://${HOST}:4000|" \
  -e "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://${HOST}:5173,http://${HOST}:5174|" \
  -e "s|^FRONTEND_BASE_URL=.*|FRONTEND_BASE_URL=http://${HOST}:5173|" \
  "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

echo "Updated $ENV_FILE for host: $HOST"
echo "PUBLIC_TENANT_BASE_DOMAIN / VITE_PUBLIC_TENANT_BASE_DOMAIN left untouched — no subdomains are used for a bare-IP/no-domain demo."
echo "Next: docker compose up -d --build"
