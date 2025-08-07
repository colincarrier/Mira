#!/bin/bash

# Fix the Vite allowedHosts issue permanently
echo "Fixing Vite allowedHosts configuration..."

# Create a backup first
cp server/vite.ts server/vite.ts.backup 2>/dev/null || true

# Fix the allowedHosts issue - change string "all" to boolean true
sed -i 's/allowedHosts: "all"/allowedHosts: true/' server/vite.ts

# Verify the fix
if grep -q 'allowedHosts: true' server/vite.ts; then
    echo "✅ Successfully fixed allowedHosts configuration!"
    echo "Changed from: allowedHosts: \"all\""
    echo "Changed to:   allowedHosts: true"
else
    echo "❌ Fix may not have been applied. Checking current state..."
    grep "allowedHosts:" server/vite.ts
fi

echo ""
echo "This fix ensures Vite accepts connections from Replit's dynamic hostnames."
echo "The TypeScript error should now be resolved."