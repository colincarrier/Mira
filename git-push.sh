#!/bin/bash
# Automatic git push script with GitHub token authentication

set -e

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected, committing..."
    git add -A
    
    # Use provided commit message or generate default
    if [ -n "$1" ]; then
        COMMIT_MSG="$1"
    else
        COMMIT_MSG="Auto-commit: $(date +'%Y-%m-%d %H:%M:%S')"
    fi
    
    git commit -m "$COMMIT_MSG"
    echo "✅ Changes committed: $COMMIT_MSG"
else
    echo "📋 No local changes to commit"
fi

# Push to GitHub using token authentication
echo "🚀 Pushing to GitHub..."
git push https://$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main

echo "✅ Successfully synced to GitHub!"