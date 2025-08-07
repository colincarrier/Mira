#!/bin/bash
###############################################################################
# fix-replit-preview.sh
#
# 1. Backs-up any existing .replit file           → .replit.bak-<timestamp>
# 2. Writes a minimal .replit that tells Replit   → run on port 5000
# 3. Prints the URL you should use in the browser → https://$REPL_SLUG.$REPL_OWNER.repl.co
###############################################################################
set -euo pipefail

TS=$(date +%Y%m%d-%H%M%S)
[[ -f .replit ]] && cp .replit ".replit.bak-${TS}"

cat > .replit <<'EOF'
modules = ["nodejs-20", "web", "postgresql-16", "python-3.11"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-24_05"
packages = ["jq"]

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

# ─── PORT MAPPING (tell Replit which port to expose) ──────────────────────────
[[ports]]
localPort = 5000
externalPort = 80

[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
author = "agent"

[[workflows.workflow.tasks]]
task = "workflow.run"
args = "Start application"

[[workflows.workflow]]
name = "Start application"
author = "agent"

[[workflows.workflow.tasks]]
task = "shell.exec"
args = "npm run dev"
waitForPort = 5000

[objectStorage]
defaultBucketID = "replit-objstore-4a8bb232-6674-49c7-8ea5-7166ade1f334"
EOF

echo "✅  .replit updated to use port 5000 (Express+Vite middleware)"
echo "🔗  Open your app at: https://$REPL_SLUG.$REPL_OWNER.repl.co"
echo ""
echo "The app runs Vite as middleware inside Express on port 5000."
echo "This fixes the 'Blocked host' error that occurred when Replit tried port 5173."