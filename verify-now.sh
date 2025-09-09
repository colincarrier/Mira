#!/usr/bin/env bash
set -euo pipefail

echo "=== SERVER ROUTES (save) ==="
grep -n "app\.post *( *['\"]/api/notes/:id" server/routes.ts || echo "no POST"
grep -n "app\.patch *( *['\"]/api/notes/:id" server/routes.ts || echo "no PATCH"
grep -n "saveNoteHandler" server/routes.ts || true

echo ""
echo "=== STORAGE: updateNote occurrences ==="
grep -n "async updateNote" server/storage.ts || echo "no updateNote"
echo ">>> Show updateNote body (200 lines around):"
ln=$(grep -n "async updateNote" server/storage.ts | head -1 | cut -d: -f1 || echo 0)
[ "$ln" != "0" ] && nl -ba server/storage.ts | sed -n "$((ln-20)),$((ln+180))p"

echo ""
echo "=== CLIENT: save paths (note-detail) ==="
grep -n "useMutation" client/src/pages/note-detail.tsx | head -10 || true
grep -n "commitFromEditor" client/src/pages/note-detail.tsx || true
grep -n "onBlur=" client/src/pages/note-detail.tsx || true
grep -n "fetch *( *\`/api/notes/\$\{id\}" client/src/pages/note-detail.tsx || true

echo ""
echo "=== CLIENT: cache behaviors ==="
echo "[ActivityFeed]"
nl -ba client/src/components/activity-feed.tsx | sed -n '1,240p' | \
grep -E "removeQueries|invalidateQueries|staleTime|gcTime|refetchOnMount" || true
echo "[note-detail mount]"
nl -ba client/src/pages/note-detail.tsx | sed -n '1,260p' | \
grep -E "removeQueries|invalidateQueries|refetch" || true

echo ""
echo "=== REAL-TIME ==="
grep -n -E "EventSource|/events|/realtime" client/src/hooks/use-realtime-updates.ts || true
grep -n -E "app\.get *\( *['\"]/api/notes/.*/events" server/routes.ts || true

echo ""
echo "=== UI signals ==="
echo "[note-card processing]"
grep -n "isProcessing" client/src/components/note-card.tsx || true
echo "[white-space CSS]"
grep -RIn "white-space" client/src --include="*.css" --include="*.tsx" || true

echo ""
echo "=== ENV ==="
echo "[.replit]"
grep -n -E 'run|PORT|ports|localPort|externalPort' .replit || true
echo ""
echo "[vite.config.ts server block]"
sed -n '1,200p' vite.config.ts | sed -n '/server:\s*{/,/}/p' || true

echo ""
echo "=== SAMPLE API SMOKE ==="
curl -sS http://localhost:5000/api/notes | head -200 >/dev/null && echo "API /notes OK"