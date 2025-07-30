# GitHub Push Process - Permanent Solution

## Issue Analysis
The agent repeatedly fails to push to GitHub on first attempt due to:
1. **Wrong Secret Name**: Checking for `GITHUB_TOKEN` instead of `GITHUB_PERSONAL_ACCESS_TOKEN`
2. **Authentication Format**: Using incorrect git authentication format
3. **Git Lock Issues**: Not handling `.git/index.lock` files properly

## Correct Process (ALWAYS USE THIS)

### Step 1: Use Correct Secret Name
```bash
# CORRECT - This secret exists
GITHUB_PERSONAL_ACCESS_TOKEN

# WRONG - This doesn't exist
GITHUB_TOKEN
```

### Step 2: Correct Push Command
```bash
# ALWAYS use this format for pushing
export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main
```

### Step 3: Handle Git Locks
```bash
# If git operations fail, remove lock files first
rm -f .git/index.lock .git/config.lock
```

## Standard GitHub Push Workflow

1. **Stage Changes**: `git add -A`
2. **Commit Changes**: `git commit -m "descriptive message"`
3. **Push to GitHub**: Use the correct command above

## Environment Variables Available
- ✅ `GITHUB_PERSONAL_ACCESS_TOKEN` - USE THIS
- ❌ `GITHUB_TOKEN` - DOES NOT EXIST

## Repository Details
- **URL**: https://github.com/colincarrier/Mira.git
- **Branch**: main
- **Owner**: colincarrier

## Success Pattern
```bash
Enumerating objects: 151, done.
Counting objects: 100% (151/151), done.
Delta compression using up to 8 threads
Compressing objects: 100% (123/123), done.
Writing objects: 100% (127/127), 31.68 KiB | 1.06 MiB/s, done.
Total 127 (delta 90), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (90/90), completed with 21 local objects.
To https://github.com/colincarrier/Mira.git
   28cdc1e..cd4f219  main -> main
```

## Quick Reference Command
```bash
# One-liner for future pushes
git add -A && git commit -m "commit message" && export GIT_ASKPASS=echo && echo $GITHUB_PERSONAL_ACCESS_TOKEN | git push https://colincarrier:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com/colincarrier/Mira.git main
```