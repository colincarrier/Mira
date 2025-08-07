#!/usr/bin/env bash
set -e
ts=$(date "+%Y%m%d%H%M")
file="server/routes.ts"
cp "$file" "$file.bak-$ts"

echo "🛠  Adding minimal type annotations to $file"
perl -0777 -pi -e '
  s/function normalizeHeaders\((headers): any\)/function normalizeHeaders($1: Record<string,string>)/;
  s/function authGuard\((req),\s*(res),\s*(next)\)/function authGuard($1: import("express").Request,$2: import("express").Response,$3: import("express").NextFunction)/;
  s/\(req,\s*res,\s*next\)/($&: any)/ if $. == 1;  # safeguard
' "$file"

echo "🔎  Running final type‑check …"
npx tsc --noEmit --project . 2>&1 | tee ts-after.log
errs=$(grep -c "error TS" ts-after.log || true)
[ "$errs" -eq 0 ] && echo "✅ TypeScript errors: 0" || { echo "❌ Still $errs TS errors"; exit 1; }
