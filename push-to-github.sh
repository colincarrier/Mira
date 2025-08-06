#!/bin/bash
# Direct GitHub push script

# Set git config
git config user.name "colincarrier"
git config user.email "43347114-colincarrier@users.noreply.replit.com"

# Stage changes
git add -A

# Create commit
git commit -m "Diagnostic: manual save issue - wrong endpoint URL causing silent failure" || true

# Push with authentication using correct token
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/colincarrier/Mira.git main