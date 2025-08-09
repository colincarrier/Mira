#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:5000"

echo "=== RUNTIME AUDIT (GET-only, no mutations) ==="
echo "Time: $(date -Is)"
echo

echo "[1] GET /api/notes (first 2 IDs, type, content-type)"
CT=$(curl -sI "$BASE/api/notes" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}')
echo "Content-Type: ${CT:-<none>}"
curl -s "$BASE/api/notes" | jq -c 'if type=="array" then [.[]|.id][0:2] else . end' 2>/dev/null || echo "JSON parse failed"
echo

echo "[2] GET one note: (choose first id)"
ID=$(curl -s "$BASE/api/notes" | jq -r '.[0].id' 2>/dev/null || echo "")
if [[ -n "${ID}" && "${ID}" != "null" ]]; then
  echo "Using note id: $ID"
  curl -s "$BASE/api/notes/$ID" | jq '{id, has_content: (.content|type), has_doc_json: (.doc_json!=null), is_processing: .is_processing, ai_enhanced: .ai_enhanced}' 2>/dev/null || echo "JSON parse fail"
else
  echo "No notes found"
fi
echo

echo "[3] SSE endpoints (HEAD) – check availability"
for ep in "/api/notes/${ID:-1}/events" "/api/realtime" "/api/realtime-updates"; do
  printf "%-28s -> " "$ep"
  curl -sI "$BASE$ep" | head -1 || true
done
echo

echo "=== END RUNTIME AUDIT ==="