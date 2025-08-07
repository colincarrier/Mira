#!/bin/bash

# Backup the original file
cp vite.config.ts vite.config.ts.backup

# Check if server config already exists
if grep -q "server:" vite.config.ts; then
  echo "✅ Server configuration already exists in vite.config.ts"
  exit 0
fi

# Add the server configuration before the final });
sed -i '/^});$/i \  server: {\
    host: true,\
    allowedHosts: "all"\
  },' vite.config.ts

# Verify the change was made
if grep -q "allowedHosts" vite.config.ts; then
  echo "✅ Successfully added server configuration to vite.config.ts"
  echo "The server will restart automatically."
else
  echo "❌ Failed to add server configuration"
  echo "Restoring backup..."
  cp vite.config.ts.backup vite.config.ts
  exit 1
fi