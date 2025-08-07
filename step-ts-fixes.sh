#!/bin/bash
set -e
perl -0777 -pi -e 's/allowedHosts:\s*true/allowedHosts: "all"/' server/vite.ts
perl -pi -e 's/console\.error\('"'"'SSE connection error:'"'"',\s*error\);/console.error("SSE connection error:", error instanceof Error ? error.message : error);/' server/routes.ts
perl -pi -e 's/for\s*\(const client of this\.clients\)/this.clients.forEach(client =>/g' server/sse/connectionManager.ts
npm run type-check
