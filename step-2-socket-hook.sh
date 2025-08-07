#!/usr/bin/env bash
set -e
ts=$(date "+%Y%m%d%H%M")

hook="client/src/hooks/useEnhancementSocket.ts"
detail="client/src/pages/note-detail.tsx"

if [ ! -f "$hook" ]; then
  echo "🛠  Creating $hook"
  cat > "$hook" <<'EOS'
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useEnhancementSocket(noteId?: number) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!noteId) return;

    const ws: WebSocket | undefined = (window as any).__realtimeWS;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[WS] not ready");
      return;
    }

    const onMsg = (e: MessageEvent) => {
      try {
        const m = JSON.parse(e.data);
        if (m.type === "enhancement_complete" && m.noteId === noteId) {
          qc.setQueryData(["/api/notes", noteId], m.note);
          qc.invalidateQueries({ queryKey: ["/api/notes"] });
        }
      } catch (err) {
        console.error("[WS] parse error", err);
      }
    };
    ws.addEventListener("message", onMsg);
    return () => ws.removeEventListener("message", onMsg);
  }, [noteId, qc]);
}
EOS
else
  echo "ℹ️  Hook already exists – skipping file creation"
fi

echo "📦  Mounting hook in NoteDetail"
cp "$detail" "$detail.bak-$ts"
grep -q "useEnhancementSocket" "$detail" || {
  perl -0777 -pi -e 's|(import .*react.*\n)|$1import { useEnhancementSocket } from "@/hooks/useEnhancementSocket";\n|' "$detail"
  perl -0777 -pi -e 's|(const .*note.*=.*useQuery[^\n]+\n)|$1useEnhancementSocket(id);\n|' "$detail"
}

echo "✅ WebSocket hook mounted"
