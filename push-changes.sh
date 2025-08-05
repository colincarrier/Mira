#!/bin/bash
# Push changes to GitHub following GIT_PUSH_PROCESS.md instructions

echo "Adding all changes..."
git add -A

echo "Creating commit..."
git commit -m "Fix React object rendering error in ai-comparison.tsx - handle todo objects with {due, description} structure"

echo "Pushing to GitHub..."
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "Push complete!"