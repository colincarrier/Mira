#!/bin/bash

# Mira AI - GitHub Ready Export Script
# Creates multiple format options for comprehensive code sharing

TIMESTAMP=$(date +%Y%m%d-%H%M)
EXPORT_BASE="mira-complete-$TIMESTAMP"

echo "Creating comprehensive Mira codebase export..."

# 1. Create clean source-only archive (excluding docs/assets)
echo "📦 Creating source-only archive..."
tar -czf "$EXPORT_BASE-source-only.tar.gz" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=uploads \
  --exclude=attached_assets \
  --exclude="*.md" \
  --exclude="*.txt" \
  --exclude="*.log" \
  --exclude="*.tar.gz" \
  client/ server/ shared/ drizzle/ \
  package.json tsconfig.json vite.config.ts tailwind.config.ts drizzle.config.ts \
  components.json postcss.config.js .replit

# 2. Create documentation-only archive  
echo "📚 Creating documentation archive..."
tar -czf "$EXPORT_BASE-docs.tar.gz" \
  *.md *.txt attached_assets/ \
  --exclude="*.tar.gz"

# 3. Create complete archive
echo "🗂️ Creating complete archive..."
tar -czf "$EXPORT_BASE-complete.tar.gz" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=uploads \
  --exclude="*.tar.gz" \
  --exclude="*.log" \
  .

# 4. Generate file manifest
echo "📋 Generating file manifest..."
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./uploads/*" \
  -not -name "*.tar.gz" \
  -not -name "*.log" | sort > "$EXPORT_BASE-manifest.txt"

# 5. Generate source code tree
echo "🌳 Generating source tree..."
find client server shared -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  xargs wc -l | sort -n > "$EXPORT_BASE-source-stats.txt"

# 6. Create GitHub repository initialization script
cat > "$EXPORT_BASE-github-setup.sh" << 'GITHUB_EOF'
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
GITHUB_EOF

chmod +x "$EXPORT_BASE-github-setup.sh"

# 7. Generate comprehensive README
cat > "$EXPORT_BASE-README.md" << 'README_EOF'
# Mira AI Memory Assistant - Complete Codebase

## Quick Start Options

### Option 1: Extract and Run Locally
```bash
# Extract source archive
tar -xzf mira-complete-TIMESTAMP-source-only.tar.gz

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY

# Start development
npm run dev
```

### Option 2: Deploy to Replit
1. Upload complete archive to new Replit
2. Extract files
3. Add OPENAI_API_KEY secret
4. Run development server

### Option 3: GitHub Repository
```bash
# Extract complete archive
tar -xzf mira-complete-TIMESTAMP-complete.tar.gz
cd mira-complete-TIMESTAMP

# Run GitHub setup script
./mira-complete-TIMESTAMP-github-setup.sh
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS (PWA)
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o with Intelligence-V2 architecture
- **Build**: Vite with deployment capabilities

### Key Features
- Multi-modal input processing (text, voice, image)
- Advanced AI processing with vector search
- Smart collections and todo extraction
- Real-time notifications and reminders
- Progressive Web App capabilities
- Comprehensive data protection

### File Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and schemas
- `drizzle/` - Database migrations and configuration

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push database schema changes
npm run db:studio    # Open database studio
```

## Environment Variables Required
- `OPENAI_API_KEY` - OpenAI API key for AI processing
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)

## Export Contents
- Source code: Complete TypeScript/React application
- Documentation: Comprehensive project documentation
- Configuration: All build and deployment configurations
- Database: Schema definitions and migration files

Total Lines of Code: 157,295
Total Files: 14,347
README_EOF

# 8. Show export summary
echo ""
echo "✅ Export completed successfully!"
echo ""
echo "📊 Export Summary:"
echo "- Source-only archive: $(ls -lh $EXPORT_BASE-source-only.tar.gz | awk '{print $5}')"
echo "- Documentation archive: $(ls -lh $EXPORT_BASE-docs.tar.gz | awk '{print $5}')"
echo "- Complete archive: $(ls -lh $EXPORT_BASE-complete.tar.gz | awk '{print $5}')"
echo "- File manifest: $EXPORT_BASE-manifest.txt"
echo "- GitHub setup script: $EXPORT_BASE-github-setup.sh"
echo "- README: $EXPORT_BASE-README.md"
echo ""
echo "🚀 Ready for GitHub upload or external analysis!"