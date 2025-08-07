#!/bin/bash
# Git push script following GIT_PUSH_PROCESS.md instructions

echo "Starting GitHub push process..."

# Use correct secret name
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN not found"
    exit 1
fi

# Configure git
git config --global user.email "colincarrier@users.noreply.github.com"
git config --global user.name "colincarrier"

# Stage all changes
echo "Staging changes..."
git add -A

# Commit with descriptive message
echo "Committing changes..."
git commit -m "Fix reconciliation report issues: empty payload guard, staleTime, restore original vite config" || true

# Push using correct format from GIT_PUSH_PROCESS.md
echo "Pushing to GitHub..."
export GIT_ASKPASS=echo
echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "Push complete!"