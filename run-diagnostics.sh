#!/usr/bin/env bash
set -euo pipefail

OUT=diagnostics.out
: > "$OUT"

echo "===== GIT HEAD & status =====" | tee -a "$OUT"
git rev-parse --short HEAD | tee -a "$OUT"
git status -s | tee -a "$OUT"
echo >> "$OUT"

echo "===== .replit =====" | tee -a "$OUT"
{ echo "--- .replit"; cat .replit 2>/dev/null || echo "(missing)"; } | tee -a "$OUT"
echo >> "$OUT"

echo "===== vite.config.* =====" | tee -a "$OUT"
for f in vite.config.ts vite.config.js server/vite.ts; do
  if [ -f "$f" ]; then
    echo "--- $f" | tee -a "$OUT"
    nl -ba "$f" | sed -n '1,200p' | tee -a "$OUT"
  fi
done
echo >> "$OUT"

echo "===== server routes (notes endpoints) =====" | tee -a "$OUT"
grep -RIn "app\.\(get\|post\|patch\|put\|delete\).*\/api\/notes" server || true | tee -a "$OUT"
echo >> "$OUT"

echo ">> PATCH handler body (context)" | tee -a "$OUT"
awk 'f; /app\.patch\([^\n]*\/api\/notes\/:id/{f=1; c=0} f && c++<120 {print NR": "$0}' server/routes.ts 2>/dev/null | tee -a "$OUT"
echo >> "$OUT"

echo ">> POST /api/notes/:id handler (context)" | tee -a "$OUT"
awk 'f; /app\.post\([^\n]*\/api\/notes\/:id/{f=1; c=0} f && c++<120 {print NR": "$0}' server/routes.ts 2>/dev/null | tee -a "$OUT"
echo >> "$OUT"

echo "===== storage.updateNote definitions =====" | tee -a "$OUT"
grep -n "updateNote" server/storage.ts | tee -a "$OUT" || true
echo ">> surrounding bodies" | tee -a "$OUT"
nl -ba server/storage.ts | sed -n '1,220p' | tee -a "$OUT"
echo >> "$OUT"

echo "===== other storage methods that routes.ts might call =====" | tee -a "$OUT"
grep -nE "updateTodo|deleteTodo|deleteNote" server/storage.ts || true | tee -a "$OUT"
echo >> "$OUT"

echo "===== client calls to /patch or POST /api/notes/:id =====" | tee -a "$OUT"
grep -RIn "\/api\/notes\/.*\/patch" client || true | tee -a "$OUT"
grep -RIn "fetch\(.*/api/notes/\$\{id\}.*method:\s*'POST'" client || true | tee -a "$OUT"
echo >> "$OUT"

echo "===== save paths (note-detail, queue, editor) =====" | tee -a "$OUT"
grep -RIn "saveMutation|updateMutation|commitFromEditor|flushQueue" client/src/pages client/src/hooks || true | tee -a "$OUT"
echo >> "$OUT"

echo "===== query keys and invalidation =====" | tee -a "$OUT"
if [ -f client/src/utils/queryKeys.ts ]; then
  echo "--- client/src/utils/queryKeys.ts" | tee -a "$OUT"
  nl -ba client/src/utils/queryKeys.ts | sed -n '1,160p' | tee -a "$OUT"
fi
grep -RIn "queryClient\.\(setQueryData\|invalidateQueries\|removeQueries\|refetchQueries\)" client/src | tee -a "$OUT" || true
echo >> "$OUT"

echo "===== Activity feed polling & caching =====" | tee -a "$OUT"
grep -RIn "refetchInterval\|staleTime\|gcTime" client/src/components | tee -a "$OUT" || true
echo >> "$OUT"

echo "===== SSE/WebSocket endpoints (server) =====" | tee -a "$OUT"
grep -RIn "realtime\|events\|EventSource\|WebSocket" server | tee -a "$OUT" || true
echo >> "$OUT"

echo "===== real-time hooks (client) =====" | tee -a "$OUT"
grep -RIn "useEnhancementSocket\|use-realtime" client/src | tee -a "$OUT" || true
if [ -f client/src/hooks/useEnhancementSocket.ts ]; then
  echo "--- client/src/hooks/useEnhancementSocket.ts" | tee -a "$OUT"
  nl -ba client/src/hooks/useEnhancementSocket.ts | sed -n '1,160p' | tee -a "$OUT"
fi
echo >> "$OUT"

echo "===== object render guards (safeText) =====" | tee -a "$OUT"
grep -RIn "safeText" client/src || true | tee -a "$OUT"
grep -RIn "{step}" client/src/pages/note-detail.tsx || true | tee -a "$OUT"
grep -RIn "todo\.title" client/src || true | tee -a "$OUT"
echo >> "$OUT"

echo "===== TypeScript errors (no emit) =====" | tee -a "$OUT"
npx tsc --noEmit 2>&1 | sed -n '1,120p' | tee -a "$OUT" || true
echo "…(truncated if long)…" | tee -a "$OUT"
echo >> "$OUT"

echo "===== runtime ports & preview reality =====" | tee -a "$OUT"
echo "netstat (listening):" | tee -a "$OUT"
( command -v ss >/dev/null && ss -ltnp || netstat -tlnp ) 2>/dev/null | grep -E "5000|5173" | tee -a "$OUT" || true
echo >> "$OUT"

echo "===== API smoke (read-only) =====" | tee -a "$OUT"
echo "GET /api/notes (first 1KB)" | tee -a "$OUT"
curl -sS http://localhost:5000/api/notes | head -c 1024 | tee -a "$OUT"; echo | tee -a "$OUT"
FIRST_ID=$(curl -sS http://localhost:5000/api/notes | sed -n 's/.*"id":[[:space:]]*\([0-9]\+\).*/\1/p' | head -1)
if [ -n "$FIRST_ID" ]; then
  echo "GET /api/notes/$FIRST_ID (first 1KB)" | tee -a "$OUT"
  curl -sS "http://localhost:5000/api/notes/$FIRST_ID" | head -c 1024 | tee -a "$OUT"; echo | tee -a "$OUT"
fi
echo >> "$OUT"

echo "Wrote $OUT"