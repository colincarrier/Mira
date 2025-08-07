#!/usr/bin/env bash
set -e

noteId=${1:-642}

echo "🔁  PATCH test"
curl -s -X PATCH http://localhost:5000/api/notes/$noteId \
  -H "Content-Type: application/json" \
  -d '{"content":"smoke‑test‑'$(date +%s)'"}' | jq '.id,.content' || exit 1

echo "📬  POST test"
curl -s -X POST http://localhost:5000/api/notes/$noteId \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.id' || exit 1

echo "🔎  cache sanity (should be JSON, not HTML)"
resp=$(curl -s http://localhost:5000/api/notes/$noteId | head -1)
[[ $resp == \<* ]] && { echo "❌  Got HTML – still broken"; exit 1; } || echo "✅  JSON OK"

echo "🟢  All verification checks passed"
