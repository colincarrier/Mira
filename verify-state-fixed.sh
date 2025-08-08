#!/usr/bin/env bash
set -euo pipefail

echo "=== SERVER ROUTES (POST/PATCH) ==="
echo "Count of handlers for /api/notes/:id"
echo -n "POST: "; grep -n "app\.post *( *[\"']\/api\/notes\/:id" server/routes.ts 2>/dev/null | grep -v "v3-process" | grep -v "evolve" | grep -v "patch" || echo "none"
echo -n "PATCH: "; grep -n "app\.patch *( *[\"']\/api\/notes\/:id" server/routes.ts 2>/dev/null || echo "none"

echo
echo "=== STORAGE: updateNote implementations ==="
grep -n "async updateNote" server/storage.ts 2>/dev/null || echo "none found"

echo
echo "=== CLIENT: ActivityFeed cache behaviors ==="
echo "[checking for removeQueries in activity-feed.tsx]"
grep -n "removeQueries" client/src/components/activity-feed.tsx 2>/dev/null || echo "✅ No removeQueries"
echo
echo "[checking gcTime and refetchInterval]"
grep -n -E "gcTime|refetchInterval" client/src/components/activity-feed.tsx 2>/dev/null || echo "none"

echo
echo "=== CLIENT: note-detail save paths ==="
echo "[checking saveMutation]"
sed -n '240,250p' client/src/pages/note-detail.tsx 2>/dev/null
echo
echo "[checking for updateMutation]"
grep -n "updateMutation" client/src/pages/note-detail.tsx 2>/dev/null || echo "✅ No updateMutation"

echo
echo "=== REAL-TIME: checking invalidateQueries in use-realtime-updates ==="
sed -n '42,46p' client/src/hooks/use-realtime-updates.ts 2>/dev/null

echo
echo "=== Looking for duplicate POST/PATCH handlers ==="
echo "All POST handlers for /api/notes/:id:"
grep "app\.post.*\/api\/notes\/:id" server/routes.ts | head -5
echo
echo "All PATCH handlers for /api/notes/:id:"
grep "app\.patch.*\/api\/notes\/:id" server/routes.ts | head -5

echo
echo "=== Looking for HTML responses in server ==="
echo "[checking for res.send with HTML]"
grep -n "res\.send.*<" server/routes.ts 2>/dev/null | head -3 || echo "none found"

echo
echo "=== DONE ==="
