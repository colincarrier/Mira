#!/usr/bin/env bash
set -e

echo "🔎  grep before‑state"
/bin/grep -n "updateNote called with no valid fields" server/storage.ts || true

echo "🔎  POST route check"
grep -Rn "app.post('/api/notes/:id'" server/routes.ts || true

echo "🔎  client PATCH/POST check"
grep -n "method:" client/src/hooks/useFlushQueue.ts | head -3
grep -Rn "/patch" client/src/pages/note-detail.tsx || true
