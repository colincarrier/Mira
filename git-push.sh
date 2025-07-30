#!/bin/bash
# Reliable GitHub Push Script for Mira Project
# Usage: ./git-push.sh "commit message"

set -e

# Clear any git locks
rm -f .git/index.lock .git/config.lock

# Stage all changes
git add -A

# Commit with provided message or default
COMMIT_MSG=${1:-"Auto-commit: Update Mira codebase"}
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

# Push using correct authentication
export GIT_ASKPASS=echo
echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "✅ Successfully pushed to GitHub"