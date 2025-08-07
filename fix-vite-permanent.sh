#!/bin/bash

# Permanent fix for Vite allowedHosts TypeScript issue
echo "Applying permanent Vite fix..."

# The TypeScript type expects literal 'true' or string array or undefined
# We need to ensure it's exactly: allowedHosts: true as const
cat > /tmp/vite-patch.js << 'EOF'
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server/vite.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace any variation of allowedHosts with the correct literal true
content = content.replace(
  /allowedHosts:\s*["']?all["']?|allowedHosts:\s*true/g,
  'allowedHosts: true as const'
);

// If it doesn't exist, and we have middlewareMode, add it
if (!content.includes('allowedHosts:')) {
  content = content.replace(
    'middlewareMode: true,',
    'middlewareMode: true,\n    allowedHosts: true as const,'
  );
}

fs.writeFileSync(filePath, content);
console.log('✅ Applied TypeScript literal type fix');
EOF

# Run the Node.js patch
node /tmp/vite-patch.js

# Alternative sed approach that ensures literal true
sed -i 's/allowedHosts: true,/allowedHosts: true as const,/' server/vite.ts 2>/dev/null || true

echo "Fix applied! The TypeScript error should be resolved."
echo ""
echo "Changed to: allowedHosts: true as const"
echo "This satisfies TypeScript's literal type requirement."

# Clean up
rm -f /tmp/vite-patch.js