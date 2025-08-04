#!/bin/bash
# Direct GitHub push script

# Set git config
git config user.name "colincarrier"
git config user.email "43347114-colincarrier@users.noreply.replit.com"

# Stage changes
git add .

# Create commit
git commit -m "Fix React child error, navigation, and remove all toast notifications" || true

# Push with authentication
git push https://colincarrier:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/colincarrier/Mira.git main