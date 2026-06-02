#!/usr/bin/env bash
set -e
TENANT_ID=$1
TENANT_SLUG=$2
if [ -z "$TENANT_ID" ]; then echo "Usage: $0 TENANT_ID TENANT_SLUG"; exit 1; fi
PAYLOAD_FILE=/tmp/content_payload.json
cat > $PAYLOAD_FILE <<EOF
{"title":"Smoke Test Article","body":"<p>This is a smoke test body with some words to measure read time.</p>","tags":["test"]}
EOF

# create
RESP=$(curl -s -X POST http://localhost:4100/contents -H "Content-Type: application/json" -H "x-tenant-id: $TENANT_ID" -d @$PAYLOAD_FILE)
echo "create response: $RESP"
ID=$(echo $RESP | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "created id: $ID"

# submit
curl -s -X POST http://localhost:4100/contents/$ID/submit -H "x-tenant-id: $TENANT_ID" -o /tmp/submit.json
echo "submitted"

# approve via direct DB (prisma)
node -e "const {PrismaClient}=require('@prisma/client');(async()=>{const p=new PrismaClient();await p.content.update({where:{id:'$ID'},data:{status:'APPROVED'}});console.log('approved');process.exit(0)})()"

# publish via controller
curl -s -X POST http://localhost:4100/contents/$ID/publish -H "x-tenant-id: $TENANT_ID" -o /tmp/publish.json
echo "published response: $(cat /tmp/publish.json)"

# check public
curl -s http://localhost:4100/public/$TENANT_SLUG/contents -o /tmp/public.json
echo "public list: $(cat /tmp/public.json)"
