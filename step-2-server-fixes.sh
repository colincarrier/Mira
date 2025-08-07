#!/usr/bin/env bash
set -e

echo "🛠  Patching server…"

#──────── 2‑a  BACKUP
cp server/storage.ts         server/storage.ts.bak
cp server/routes.ts          server/routes.ts.bak

#──────── 2‑b  graceful‑return in storage.updateNote
perl -0777 -i -pe '
  s{
    if\s*\(valid\.length\s*===\s*0\)\s*\{[^}]+\}
  }{
    if (valid.length === 0) {
      // 🟢 no valid fields → return existing row
      const { rows } = await pool.query("SELECT * FROM notes WHERE id = $1", [id]);
      return rows[0];
    }
  }sx' server/storage.ts || { mv server/storage.ts.bak server/storage.ts; echo "❌ storage patch failed"; exit 1; }

#──────── 2‑c  idempotent POST /api/notes/:id
grep -q "app.post('/api/notes/:id'" server/routes.ts || {
  perl -0777 -i -pe '
    s{(app\.patch\("/api/notes/:id".*?\);\n)}{$1\n\n// ░░  AUTO‑ADDED safe POST handler\napp.post("/api/notes/:id", async (req,res) => {\n  const noteId = Number(req.params.id);\n  const updates = req.body ?? {};\n  const updated = await storage.updateNote(noteId, updates);\n  res.json(updated);\n});\n}s
  ' server/routes.ts || { mv server/routes.ts.bak server/routes.ts; echo "❌ routes patch failed"; exit 1; }
}

echo "✅  server patches applied"
