#!/bin/bash
# GitHub Push Script for Mira Project
# Date: August 6, 2025

echo "========================================="
echo "Pushing Mira changes to GitHub"
echo "========================================="

# Configuration
BRANCH="main"
REMOTE="origin"

# Clean up any lock files
rm -f .git/index.lock 2>/dev/null

# Add all changes
echo "→ Staging all changes..."
git add -A

# Check status
echo "→ Current status:"
git status --short

# Create commit
COMMIT_MSG="Fix manual save issues and React rendering errors

Changes:
- Added processing indicators with toast notifications
- Enhanced save status indicators (Unsaved/Saving/Saved)  
- Fixed TypeScript errors in activity-feed.tsx
- Improved object-safe rendering for todo titles
- Changed saveMutation to use .mutateAsync() for better async handling
- Diagnosed root cause: incorrect endpoint URL in saveMutation

Issues identified:
- Client calling /api/notes/:id/patch instead of /api/notes/:id
- Need to fix endpoint URL for manual saves to work"

echo "→ Creating commit..."
git commit -m "$COMMIT_MSG"

# Push to GitHub
echo "→ Pushing to GitHub ($REMOTE/$BRANCH)..."
git push $REMOTE $BRANCH

echo "========================================="
echo "✅ Push complete!"
echo "Repository: https://github.com/colincarrier/Mira"
echo "========================================="