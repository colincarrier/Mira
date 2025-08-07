#!/usr/bin/env bash
set -e

echo "🛠  Patching client…"

#──────── 3‑a  BACKUP
cp client/src/pages/note-detail.tsx              client/src/pages/note-detail.tsx.bak
cp client/src/hooks/useFlushQueue.ts             client/src/hooks/useFlushQueue.ts.bak

#──────── 3‑b  ensure useFlushQueue is PATCH
perl -pi -e "s/method:\\s*'POST'/method: 'PATCH'/" client/src/hooks/useFlushQueue.ts

#──────── 3‑c  clear‑corruption helper (invalidate+refetch instead of remove)
perl -0777 -i -pe '
  s{
    queryClient\.removeQueries\(\{\s*queryKey:\s*\["/api/notes",\s*id\]\s*\}\);
  }{
    queryClient.invalidateQueries({ queryKey: ["/api/notes", id] });
    queryClient.refetchQueries   ({ queryKey: ["/api/notes", id] });
  }' client/src/pages/note-detail.tsx

#──────── 3‑d  import & mount socket hook only if not present
grep -q "useEnhancementSocket" client/src/pages/note-detail.tsx || {
  sed -i '/^import .*react/a import { useEnhancementSocket } from "@/hooks/useEnhancementSocket";' \
    client/src/pages/note-detail.tsx
  sed -i '/const .*useQuery.*note.*=/a   useEnhancementSocket(id);'     \
    client/src/pages/note-detail.tsx
}

#──────── 3‑e  optional: ensure isProcessing boolean
perl -pi -e 's/(\.isProcessing)([^a-zA-Z0-9_])/!!$1$2/' client/src/pages/note-detail.tsx

echo "✅  client patches applied"
