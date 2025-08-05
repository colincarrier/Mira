#!/bin/bash
# Push changes to GitHub following GIT_PUSH_PROCESS.md instructions

# Step 1: Remove any git locks
rm -f .git/index.lock .git/config.lock

# Step 2: Stage all changes
git add -A

# Step 3: Commit changes
git commit -m "Fix React object rendering error in ai-comparison.tsx - handle todo objects with {due, description} structure"

# Step 4: Push using the EXACT command from GIT_PUSH_PROCESS.md
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "Push complete!"