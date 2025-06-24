# How to Sync Your Code to GitHub in Replit

## Method 1: Using Replit's Git Panel (Easiest)

1. **Find the Git Panel**
   - Look for the **Source Control** icon in the left sidebar (looks like a branch symbol)
   - Or press `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)

2. **Stage Your Changes**
   - You'll see a list of all modified files
   - Click the **"+"** button next to each file to stage it
   - Or click **"Stage All Changes"** at the top

3. **Commit Your Changes**
   - Enter a commit message in the text box (e.g., "Initial commit: Complete Mira AI codebase")
   - Click **"Commit"**

4. **Push to GitHub**
   - Click **"Push"** or **"Sync Changes"**
   - Your code will upload to https://github.com/colincarrier/Mira

## Method 2: Using Replit Shell

If the Git panel isn't visible, use the Shell tab at the bottom:

```bash
git add .
git commit -m "Initial commit: Complete Mira AI codebase"
git push origin main
```

## Method 3: Manual Upload (Backup Option)

If Git sync doesn't work:
1. Download the file: `mira-complete-20250624-2332-source-only.tar.gz` (319KB)
2. Go to https://github.com/colincarrier/Mira
3. Click "Upload files" 
4. Drag and drop the archive
5. Extract it in GitHub

## What You're Syncing
- 157,295 lines of source code
- Complete React + Express + PostgreSQL application
- Intelligence-V2 AI processing system
- All configuration and documentation files

Your repository is already connected - you just need to push the changes!