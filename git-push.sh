#!/bin/bash

# Remove git lock if it exists
rm -f .git/index.lock

# Add the modified file
git add client/src/components/input-bar.tsx

# Commit with descriptive message
git commit -m "Fix InputBar evolution endpoint bug - add missing existingContent parameter

- Fixed 400 error when updating notes via InputBar evolution endpoint
- Now fetches current note data and includes required parameters:
  - existingContent, existingContext, existingTodos, existingRichContext  
- Added user feedback with toast notifications for success/failure
- Resolves issue where note clarifications weren't processing

This fixes the case where user tried to clarify note 620 'nixie' 
misclassification but update failed due to missing existingContent parameter."

# Push to repository
git push origin main

echo "✅ Changes pushed to repository"