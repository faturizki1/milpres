#!/usr/bin/env bash
set -euo pipefail

# Usage: set environment variables then run
# Required env vars: RAILWAY_DATABASE_URL, VPS_DATABASE_URL, RAILWAY_MINIO_ALIAS, RAILWAY_MINIO_ENDPOINT,
# RAILWAY_MINIO_ACCESS_KEY, RAILWAY_MINIO_SECRET_KEY, VPS_MINIO_ALIAS, VPS_MINIO_ENDPOINT, VPS_MINIO_ACCESS_KEY, VPS_MINIO_SECRET_KEY

if [ -z "${RAILWAY_DATABASE_URL:-}" ] || [ -z "${VPS_DATABASE_URL:-}" ]; then
  echo "Please set RAILWAY_DATABASE_URL and VPS_DATABASE_URL"
  exit 1
fi

echo "Dumping Railway Postgres database..."
pg_dump --format=custom --no-owner --no-acl "$RAILWAY_DATABASE_URL" -f /tmp/railway.dump

echo "Restoring to VPS Postgres..."
pg_restore --no-owner --no-acl --clean --exit-on-error -d "$VPS_DATABASE_URL" /tmp/railway.dump

echo "Mirroring MinIO data from Railway -> VPS using mc"
if ! command -v mc >/dev/null 2>&1; then
  echo "mc (MinIO client) is required. Install: https://docs.min.io/docs/minio-client-quickstart-guide.html"
  exit 1
fi

mc alias set src "$RAILWAY_MINIO_ENDPOINT" "$RAILWAY_MINIO_ACCESS_KEY" "$RAILWAY_MINIO_SECRET_KEY"
mc alias set dst "$VPS_MINIO_ENDPOINT" "$VPS_MINIO_ACCESS_KEY" "$VPS_MINIO_SECRET_KEY"
mc mirror --overwrite src dst

echo "Update DNS records at Cloudflare (manual step). Example API call below — replace placeholders and run as needed:"
cat <<'EOF'
curl -X PUT "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records/<RECORD_ID>" \
  -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"example.com","content":"<VPS_PUBLIC_IP>","ttl":1,"proxied":false}'
EOF

echo "Migration steps completed. Verify services on VPS and update envs as needed."
