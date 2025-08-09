#!/usr/bin/env bash
set -euo pipefail

REPO_USER="colincarrier"
REPO_NAME="Mira"
BRANCH="main"
RAW_BASE="https://raw.githubusercontent.com/${REPO_USER}/${REPO_NAME}/${BRANCH}"

FILES=(
  "server/routes.ts"
  "server/storage.ts"
  "server/sse/connectionManager.ts"
  "client/src/components/activity-feed.tsx"
  "client/src/pages/note-detail.tsx"
  "client/src/hooks/useFlushQueue.ts"
  "client/src/hooks/use-realtime-updates.ts"
  "client/src/hooks/useEnhancementSocket.ts"
  "client/src/utils/saveNote.ts"
  "client/src/utils/normalizeNote.ts"
  "vite.config.ts"
  ".replit"
)

echo "=== AUDIT: Local vs GitHub ${REPO_USER}/${REPO_NAME}@${BRANCH} ==="
echo "Time: $(date -Is)"
echo

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

for f in "${FILES[@]}"; do
  echo "---- $f ----"
  if [ -f "$f" ]; then
    curl -sfL "${RAW_BASE}/${f}" -o "${TMPDIR}/remote.$(basename "$f")" || {
      echo " !! Could not fetch ${RAW_BASE}/${f}"
      echo
      continue
    }
    echo "[DIFF vs GitHub] (context 3)"
    diff -u --label "local:$f" --label "github:$f" "$f" "${TMPDIR}/remote.$(basename "$f")" || true

    echo
    echo "[LOCAL INDEX: key patterns with line numbers]"
    # Server-specific
    if [[ "$f" == server/* ]]; then
      echo " - updateNote declarations:"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "async +updateNote|updateNote *:" || true
      echo " - /api/notes/:id handlers (POST/PATCH):"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "app\.(post|patch)\s*\(\s*['\"]/api/notes/:id" || true
      echo " - SSE endpoints (/events or /realtime):"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "app\.get\s*\(\s*['\"]/api/(notes/.*/events|realtime|realtime-updates)" || true
    fi

    # Client-specific
    if [[ "$f" == client/* ]]; then
      echo " - removeQueries / invalidateQueries / refetchInterval / staleTime / gcTime:"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "removeQueries|invalidateQueries|refetchInterval|staleTime|gcTime" || true
      echo " - '/patch' URL usage (should be none):"
      nl -ba "$f" | sed -n '1,5000p' | grep -n "/patch" || true
      echo " - real-time usage (EventSource/WebSocket):"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "EventSource|WebSocket|/events|/realtime" || true
      echo " - save mutation usage:"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "useMutation|saveMutation|commitFromEditor|onBlur=" || true
      echo " - isProcessing / is_processing or AI status UI:"
      nl -ba "$f" | sed -n '1,5000p' | grep -n -E "isProcessing|is_processing|processing|bouncing|dots|spinner" || true
    fi

    # Vite / .replit
    if [[ "$f" == "vite.config.ts" ]]; then
      echo " - server block:"
      nl -ba "$f" | sed -n '1,400p' | sed -n '/server:\s*{/,/}/p' || true
    fi
    if [[ "$f" == ".replit" ]]; then
      echo " - run / ports:"
      nl -ba "$f" | sed -n '1,400p' | grep -n -E 'run|PORT|ports|localPort|externalPort|5000|5173' || true
    fi

  else
    echo " !! Local file not found: $f"
  fi
  echo
done

echo "=== END AUDIT ==="