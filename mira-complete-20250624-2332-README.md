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
