#!/bin/bash

# GitHub Push Script for Mira Repository
# Based on GIT_PUSH_PROCESS.md instructions

# Configure git user (required for commits)
git config --global user.email "colincarrier@users.noreply.github.com"
git config --global user.name "Colin Carrier"

# Stage all changes
git add .

# Commit with timestamp (|| true to handle no changes case)
git commit -m "Update: Debug panel removed, fixes for blank notes issue $(date '+%Y-%m-%d %H:%M:%S')" || true

# Push to GitHub using the correct authentication format
export GIT_ASKPASS=echo
echo ${GITHUB_PERSONAL_ACCESS_TOKEN} | git push https://colincarrier:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/colincarrier/Mira.git main