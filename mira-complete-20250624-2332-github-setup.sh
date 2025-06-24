#!/bin/bash
# GitHub Repository Setup Script for Mira AI

echo "Setting up Mira AI private repository..."

# Option 1: GitHub CLI (recommended)
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI..."
    gh repo create mira-ai-private --private --description "Mira AI Memory Assistant - Private Repository"
    git init
    git add .
    git commit -m "Initial commit: Complete Mira AI codebase"
    git branch -M main
    git remote add origin $(gh repo view mira-ai-private --json url -q .url)
    git push -u origin main
    echo "✅ Repository created and pushed successfully!"
    echo "🔗 Repository URL: $(gh repo view mira-ai-private --json url -q .url)"
else
    echo "GitHub CLI not found. Manual setup required:"
    echo "1. Create private repository at https://github.com/new"
    echo "2. Name it: mira-ai-private"
    echo "3. Make it private"
    echo "4. Run the following commands:"
    echo ""
    echo "git init"
    echo "git add ."
    echo "git commit -m 'Initial commit: Complete Mira AI codebase'"
    echo "git branch -M main"
    echo "git remote add origin https://github.com/YOURUSERNAME/mira-ai-private.git"
    echo "git push -u origin main"
fi
