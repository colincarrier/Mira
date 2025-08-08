#!/usr/bin/env bash
set -euo pipefail

echo "=== VITE / PREVIEW CONFIG ==="
if [ -f vite.config.ts ]; then
  echo "[vite.config.ts] server block (if any):"
  nl -ba vite.config.ts | sed -n '1,200p' | sed -n '/server: *{/,/}/p' || true
else
  echo "vite.config.ts not found"
fi
echo
if [ -f .replit ]; then
  echo "[.replit] ports and run:"
  nl -ba .replit | sed -n '1,200p' | grep -n -E 'run|PORT|ports|localPort|externalPort|5000|5173' || true
fi

echo
echo "=== SERVER ROUTES (POST/PATCH) ==="
if [ -f server/routes.ts ]; then
  echo "Count of handlers for /api/notes/:id"
  echo -n "POST: "; grep -n "app\.post *( *[\"']\/api\/notes\/:id" server/routes.ts || true
  echo -n "PATCH: "; grep -n "app\.patch *( *[\"']\/api\/notes\/:id" server/routes.ts || true
  echo
  echo "[Context around handlers]"
  for ln in $(grep -n "app\.\(post\|patch\) *( *[\"']\/api\/notes\/:id" server/routes.ts | cut -d: -f1); do
    echo "--- server/routes.ts lines $((ln-8))..$((ln+25)) ---"
    nl -ba server/routes.ts | sed -n "$((ln-8)),$((ln+25))p"
  done
else
  echo "server/routes.ts not found"
fi

echo
echo "=== STORAGE: updateNote(s) present ==="
if [ -f server/storage.ts ]; then
  grep -n "updateNote" server/storage.ts || true
  echo
  echo "[updateNote bodies (first 120 lines around each)]"
  for ln in $(grep -n "updateNote" server/storage.ts | cut -d: -f1); do
    echo "--- server/storage.ts lines $((ln-20))..$((ln+120)) ---"
    nl -ba server/storage.ts | sed -n "$((ln-20)),$((ln+120))p"
  done
else
  echo "server/storage.ts not found"
fi

echo
echo "=== CLIENT: useFlushQueue.ts (/patch lingering?) ==="
if [ -f client/src/hooks/useFlushQueue.ts ]; then
  grep -n "/patch" client/src/hooks/useFlushQueue.ts || echo "✅ No /patch in useFlushQueue.ts"
  echo
  nl -ba client/src/hooks/useFlushQueue.ts | sed -n '1,160p' | sed -n '/fetch *(`\/api\/notes\/\$\{/,/};/p' || true
fi

echo
echo "=== CLIENT: note-detail.tsx save paths ==="
if [ -f client/src/pages/note-detail.tsx ]; then
  echo "[saveMutation definitions]"
  grep -n "useMutation" client/src/pages/note-detail.tsx | head -20 || true
  echo
  echo "[editor commit function]"
  grep -n "commitFromEditor" client/src/pages/note-detail.tsx || true
  echo
  echo "[onBlur handlers saving content]"
  grep -n "onBlur=" client/src/pages/note-detail.tsx || true
  echo
  echo "[all fetch('/api/notes/${id}' calls with method/body snippets]"
  nl -ba client/src/pages/note-detail.tsx | sed -n '1,999p' | \
    sed -n '/fetch *(`\/api\/notes\/\$\{.*\}/,/^\s*}\)?\s*;$/p' || true
fi

echo
echo "=== CLIENT: cache behaviors (ActivityFeed & note-detail) ==="
if [ -f client/src/components/activity-feed.tsx ]; then
  echo "[removeQueries/invalidateQueries/refetchInterval/staleTime/gcTime]"
  nl -ba client/src/components/activity-feed.tsx | sed -n '1,260p' | \
    grep -n -E "removeQueries|invalidateQueries|refetchInterval|staleTime|gcTime" || true
fi
if [ -f client/src/pages/note-detail.tsx ]; then
  echo
  echo "[note-detail invalidation/remove on mount]"
  nl -ba client/src/pages/note-detail.tsx | sed -n '1,260p' | \
    grep -n -E "removeQueries|invalidateQueries|refetch" || true
fi

echo
echo "=== REAL-TIME (SSE/WS) ==="
if [ -f client/src/hooks/useEnhancementSocket.ts ]; then
  echo "[client hook uses]:"
  nl -ba client/src/hooks/useEnhancementSocket.ts | sed -n '1,200p' | \
    grep -n -E "EventSource|WebSocket|/events|/realtime" || true
fi
if [ -f server/routes.ts ]; then
  echo
  echo "[server SSE endpoints]"
  grep -n -E "app\.get *\( *[\"']\/api\/realtime|\/events" server/routes.ts || true
fi
if [ -f server/sse/connectionManager.ts ]; then
  echo
  echo "[server/sse/connectionManager.ts broadcast loops]"
  nl -ba server/sse/connectionManager.ts | sed -n '1,200p' | grep -n -E "for *\(|forEach|clients" || true
fi

echo
echo "=== NEW NOTE FLOW (create + optimistic cache) ==="
if [ -f client/src/components/activity-feed.tsx ]; then
  nl -ba client/src/components/activity-feed.tsx | sed -n '1,260p' | \
    sed -n '/create.*Note.*mutation/,/});/p' | sed -n '1,200p' || true
fi

echo
echo "=== SEARCH for bad patterns across client ==="
grep -RIn "/api/notes/.*/patch" client/src || echo "✅ No /patch URLs in client"
grep -RIn "removeQueries" client/src || true
grep -RIn "EventSource|WebSocket" client/src || true

echo
echo "=== DONE ==="
