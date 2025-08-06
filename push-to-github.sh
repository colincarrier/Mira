#!/bin/bash
# Direct GitHub push script

# Set git config
git config user.name "colincarrier"
git config user.email "43347114-colincarrier@users.noreply.replit.com"

# Stage changes
git add -A

# Create commit
git commit -m "Diagnostic report: manual save issue identified - wrong endpoint URL

Changes made:
- Added processing indicators with toast notifications
- Enhanced save status indicators (Unsaved/Saving/Saved)
- Fixed TypeScript errors in activity-feed.tsx
- Improved object-safe rendering for todo titles
- Changed saveMutation to use .mutateAsync()

Root cause identified:
- Client calling /api/notes/:id/patch instead of /api/notes/:id
- Returns HTML instead of JSON causing silent failure
- Fix needed: change endpoint URL in saveMutation" || true

# Push with authentication using correct token
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/colincarrier/Mira.git main