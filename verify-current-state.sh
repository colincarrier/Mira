#!/usr/bin/env bash
set -euo pipefail

echo "== ACTIVITY FEED =="
if [ -f client/src/components/activity-feed.tsx ]; then
  nl -ba client/src/components/activity-feed.tsx | sed -n '1,200p' | grep -n "queryClient\.\(removeQueries\|invalidateQueries\)"
else
  echo "missing: client/src/components/activity-feed.tsx"
fi
echo

echo "== ROUTES: POST/PATCH /api/notes/:id (count & context) =="
if [ -f server/routes.ts ]; then
  grep -n "app\.post(.*'/api/notes/:id" server/routes.ts || true
  grep -n "app\.patch(.*'/api/notes/:id" server/routes.ts || true
  echo "Handler function:"
  grep -n "saveNoteHandler" server/routes.ts | head -5 || true
else
  echo "missing: server/routes.ts"
fi
echo

echo "== NOTE DETAIL save paths (mutations, onBlur, editor commit) =="
if [ -f client/src/pages/note-detail.tsx ]; then
  echo "useMutation hooks:"
  grep -n "useMutation" client/src/pages/note-detail.tsx | head -3 || true
  echo "onBlur handlers:"
  grep -n "onBlur=" client/src/pages/note-detail.tsx | head -2 || true
  echo "commitFromEditor:"
  grep -n "commitFromEditor" client/src/pages/note-detail.tsx | head -2 || true
else
  echo "missing: client/src/pages/note-detail.tsx"
fi
echo

echo "== Vite/preview config =="
[ -f .replit ] && grep "PORT\|5000" .replit || echo "missing: .replit"
echo
echo "Verifier completed."
