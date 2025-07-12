#!/usr/bin/env bash
echo "⏮  Rolling back V3 commit…"
git reset --hard HEAD~1
echo "✅  Repo restored to previous commit."
