#!/usr/bin/env bash
set -e
echo "🔎 Verifying current repo state …"

echo "1. Searching for offending /patch in flush queue"
grep -n "/patch" client/src/hooks/useFlushQueue.ts || echo "✅ No /patch URL left"

echo "2. Checking WebSocket hook presence"
grep -q "function useEnhancementSocket" client/src/hooks/useEnhancementSocket.ts \
  && echo "✅ Socket hook exists" || echo "❌ Socket hook missing"

echo "3. Checking Activity‑Feed polling interval"
grep -n "refetchInterval:" client/src/components/activity-feed.tsx

echo "4. TypeScript error count"
npx tsc --noEmit --project . 2>&1 | grep -c "error TS" || true
echo "✅ Verification snapshot complete"
