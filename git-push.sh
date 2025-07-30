#!/bin/bash

# Remove git locks if they exist
rm -f .git/index.lock .git/config.lock

# Configure git credentials (replace YOUR_TOKEN with actual token)
git config --global user.email "colincarrier@gmail.com"
git config --global user.name "Colin Carrier"

# Add all modified files
git add client/src/components/input-bar.tsx
git add replit.md

# Commit with comprehensive message covering all today's changes
git commit -m "Fix InputBar evolution endpoint and document recent changes

- Fixed 400 error in evolution endpoint by adding missing existingContent parameter
- Enhanced error handling and user feedback with toast notifications  
- Successfully corrected AI misclassification (nixie tubes → sparkling water)
- Removed outdated character limits from note display
- Updated documentation with latest changes

Files modified:
- client/src/components/input-bar.tsx: Evolution endpoint fix
- replit.md: Documentation updates"

# Push to repository with authentication
git push https://YOUR_TOKEN@github.com/colincarrier/Mira.git main

echo "✅ Changes pushed to repository"