#!/usr/bin/env bash
set -euo pipefail

echo "=== PREVIEW / DEV SERVER AUDIT ==="
echo "Time: $(date -Is)"
echo

if [ -f vite.config.ts ]; then
  echo "[vite.config.ts] server block:"
  nl -ba vite.config.ts | sed -n '1,400p' | sed -n '/server:\s*{/,/}/p' || echo "<no server block found>"
else
  echo "vite.config.ts not found"
fi
echo

if [ -f .replit ]; then
  echo "[.replit] run / ports:"
  nl -ba .replit | sed -n '1,400p' | grep -n -E 'run|PORT|ports|localPort|externalPort|5000|5173' || true
else
  echo ".replit not found"
fi
echo

echo "[Ports listening] (should see 5000; 5173 only if standalone Vite)"
if command -v ss >/dev/null 2>&1; then
  ss -tln | grep -E '5000|5173' || true
else
  netstat -tln 2>/dev/null | grep -E '5000|5173' || true
fi

echo
echo "=== END PREVIEW AUDIT ==="