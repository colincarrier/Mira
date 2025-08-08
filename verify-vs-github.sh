#!/usr/bin/env bash
set -euo pipefail

# --------- Config ----------
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
  "vite.config.ts"
  ".replit"
)

echo "=== VERIFY: Local vs GitHub ${REPO_USER}/${REPO_NAME}@${BRANCH} ==="
echo "Time: $(date -Is)"
echo

# Make a temp dir
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

for f in "${FILES[@]}"; do
  echo "---- $f ----"
  if [ -f "$f" ]; then
    curl -sfL "${RAW_BASE}/${f}" -o "${TMPDIR}/remote.$(basename "$f")" || {
      echo "  !! Could not fetch ${RAW_BASE}/${f}"
      continue
    }
    # Show short diff (context 3)
    echo "[DIFF vs GitHub]"
    diff -u --label "local:$f" --label "github:$f" "$f" "${TMPDIR}/remote.$(basename "$f")" || true

    echo
    echo "[LOCAL: line-numbered excerpt of key patterns]"
    echo "  - updateNote:"
    nl -ba "$f" | sed -n '1,4000p' | grep -n -E "updateNote *:|async updateNote|function updateNote" || true

    echo "  - POST/PATCH /api/notes/:id (server):"
    nl -ba "$f" | sed -n '1,4000p' | grep -n -E "app\.post.*\/api\/notes\/:id|app\.patch.*\/api\/notes\/:id" || true

    echo "  - removeQueries / invalidateQueries / refetchInterval / gcTime (client):"
    nl -ba "$f" | sed -n '1,4000p' | grep -n -E "removeQueries|invalidateQueries|refetchInterval|gcTime|staleTime" || true

    echo "  - /patch URL usage:"
    nl -ba "$f" | sed -n '1,4000p' | grep -n "/patch" || true

    echo
  else
    echo "  !! Local file not found: $f"
  fi
done

echo "=== END VERIFY ==="
