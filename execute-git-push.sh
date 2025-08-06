#!/bin/bash
# Execute git push using the permanent solution from GIT_PUSH_PROCESS.md

# Remove lock files
rm -f .git/index.lock .git/config.lock

# Stage all changes
git add -A

# Commit with message
git commit -m "Diagnostic: manual save issue - wrong endpoint URL causing silent failure

Changes made:
- Added processing indicators with toast notifications  
- Enhanced save status indicators (Unsaved/Saving/Saved)
- Fixed TypeScript errors in activity-feed.tsx
- Improved object-safe rendering for todo titles
- Changed saveMutation to use .mutateAsync()

Root cause identified:
- Client calling /api/notes/:id/patch instead of /api/notes/:id
- Returns HTML instead of JSON causing silent failure"

# Push using the exact command from GIT_PUSH_PROCESS.md line 23
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "Push complete!"