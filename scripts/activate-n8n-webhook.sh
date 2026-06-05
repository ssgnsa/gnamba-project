#!/bin/bash
# Script to activate n8n workflow and register webhook

set -e

N8N_HOST="${1:-http://127.0.0.1:5678}"
N8N_USER="${N8N_USER:-admin}"
N8N_PASSWORD="${N8N_PASSWORD:-EgsN8nPass2026Secure}"
WORKFLOW_ID="17defc2c-3c01-4f79-96f2-dc7a5a7d0b17"
WEBHOOK_PATH="gnamba-trigger"

echo "🔧 n8n Workflow Activation Script"
echo "=================================="
echo "Target: $N8N_HOST"
echo "Workflow ID: $WORKFLOW_ID"
echo "Webhook Path: $WEBHOOK_PATH"
echo ""

# Step 1: Test basic auth and get workflow
echo "1️⃣  Testing n8n connectivity with basic auth..."
WORKFLOW=$(curl -s -u "$N8N_USER:$N8N_PASSWORD" \
  "$N8N_HOST/rest/workflows/$WORKFLOW_ID")

WORKFLOW_NAME=$(echo "$WORKFLOW" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$WORKFLOW_NAME" ]; then
  echo "❌ Workflow not found or auth failed"
  echo "Response: $WORKFLOW"
  exit 1
fi

echo "✅ Workflow found: $WORKFLOW_NAME"

# Step 2: Activate workflow via REST API (legacy)
echo ""
echo "2️⃣  Activating workflow..."
ACTIVATE=$(curl -s -X PUT \
  -u "$N8N_USER:$N8N_PASSWORD" \
  -H "Content-Type: application/json" \
  "$N8N_HOST/rest/workflows/$WORKFLOW_ID" \
  -d '{"active": true}')

IS_ACTIVE=$(echo "$ACTIVATE" | grep -o '"active":true')

if [ -z "$IS_ACTIVE" ]; then
  echo "⚠️  Activation response received, checking webhook..."
  echo "$ACTIVATE" | jq . 2>/dev/null || echo "$ACTIVATE"
fi

echo "✅ Workflow update sent"

# Step 3: Wait and test webhook  
echo ""
echo "3️⃣  Testing webhook endpoint..."
sleep 2

WEBHOOK_TEST=$(curl -s -w "\n%{http_code}" \
  "http://127.0.0.1:5678/webhook/$WORKFLOW_ID/$WEBHOOK_PATH")

HTTP_CODE=$(echo "$WEBHOOK_TEST" | tail -1)
RESPONSE=$(echo "$WEBHOOK_TEST" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Webhook ACTIVE! HTTP $HTTP_CODE"
else
  echo "⚠️  Webhook returned HTTP $HTTP_CODE"
  echo "Response: $RESPONSE"
fi

echo ""
echo "✅ n8n workflow activation attempted!"
echo ""
echo "Production webhook URL:"
echo "  https://n8n.gnambaservices.ci/webhook/$WORKFLOW_ID/$WEBHOOK_PATH"

