#!/usr/bin/env bash
set -e

echo "🔎 Checking for numeric navigate(-1) misuse…"
if grep -R "navigate(-1)" client/src --include="*.tsx"; then
  echo "❌ navigate(-1) found – must use path strings."
  exit 1
fi

echo "🔎 Checking for multiple Pool instances…"
POOLS=$(grep -R "new Pool(" server --include="*.ts" | wc -l)
[ "$POOLS" -le 1 ] || { echo "❌ Multiple pg pools detected ($POOLS)"; exit 1; }

echo "🔎 Running type check…"
npm run type-check

echo "🔎 Ensuring no direct object renders…"
grep -R "{todo}" client/src --include="*.tsx" && { echo "❌ Direct object render found"; exit 1; } || echo "✅ clean"

echo "✅ Verification passed"