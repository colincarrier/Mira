#!/usr/bin/env bash
set -e
ts=$(date "+%Y%m%d%H%M")
file="client/src/hooks/useFlushQueue.ts"

echo "🔧 1/1  Removing /patch suffix in $file …"
cp "$file" "$file.bak-$ts"

# Replace EXACTLY two occurrences
perl -0777 -pi -e 's|/api/notes/\$\{op\.noteId\}/patch|/api/notes/${op.noteId}|g' "$file"
perl -0777 -pi -e 's|/api/notes/\$\{id\}/patch|/api/notes/${id}|g'         "$file"

grep -q "/patch" "$file" && { echo "❌ /patch still present – abort"; mv "$file.bak-$ts" "$file"; exit 1; }

echo "✅ URL fixed in $file"
