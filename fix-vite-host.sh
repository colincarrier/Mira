#!/bin/bash

# Backup the original file
cp vite.config.ts vite.config.ts.backup2

# Remove the incorrect allowedHosts line and keep just host: true
sed -i '/allowedHosts: "all"/d' vite.config.ts

echo "✅ Fixed vite.config.ts - removed invalid allowedHosts configuration"
echo "The 'host: true' setting alone should allow all hosts"
echo ""
echo "Current server configuration:"
grep -A2 "server:" vite.config.ts