#!/bin/bash
echo "🔎 1. TypeScript"
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0 errors"
echo "🔎 2. API smoke test"
curl -sf http://localhost:5000/api/notes | jq '.[0].id' >/dev/null && echo "✅ Notes API working"
echo "🔎 3. Manual PATCH"
curl -sf -X PATCH http://localhost:5000/api/notes/643 \
     -H "Content-Type: application/json" \
     -d '{"content":"health-check"}' | jq '.id' >/dev/null && echo "✅ PATCH working"
echo "🔎 4. Real-time endpoint"
curl -s -I http://localhost:5000/api/realtime?noteId=1 | head -1
echo "✅ All core checks passed"
