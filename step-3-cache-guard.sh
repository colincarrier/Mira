#!/usr/bin/env bash
set -e
ts=$(date "+%Y%m%d%H%M")
file="client/src/components/activity-feed.tsx"

echo "🛠  Adjusting React‑Query polling in $file"
cp "$file" "$file.bak-$ts"

perl -0777 -pi -e 's/refetchInterval:\s*\d+/refetchInterval: false/' "$file"
perl -0777 -pi -e 's/refetchIntervalInBackground:\s*true/refetchIntervalInBackground: false/' "$file"
perl -0777 -pi -e 's/staleTime:\s*0/staleTime: 10000/' "$file"

echo "✅ Polling updated"

# Add cache purge effect once per note mount
detail="client/src/pages/note-detail.tsx"
cp "$detail" "$detail.bak-$ts"
perl -0777 -pi -e '
  unless (/removeQueries\(\{ queryKey: \["\/api\/notes", id \] \}\)/) {
    s|(useEffect\([^)]*=>\s*{\s*)|$1\n  // purge bad HTML cache\n  queryClient.invalidateQueries({ queryKey: ["/api/notes", id] });\n  queryClient.refetchQueries({queryKey: ["/api/notes", id]});\n|;
  }' "$detail"

echo "✅ Cache guard added"
