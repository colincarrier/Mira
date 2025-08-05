# Mira AI Memory Assistant

## Overview

Mira is a sophisticated AI-powered memory and productivity assistant that transforms note-taking through advanced multi-modal intelligence. It combines text, voice, and image processing with intelligent organization, task extraction, and proactive assistance capabilities. The project aims to provide a native app-like experience across all platforms, offering advanced multi-modal AI processing and an offline-first data architecture to ensure a responsive user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS (PWA-enabled)
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: OpenAI GPT-4o (primary), Claude Sonnet 4 (secondary)
- **Build System**: Vite
- **Storage**: Local file system for media, Object Storage for scalability

### Architectural Decisions

**Progressive Web App (PWA) Architecture**
- Provides native app-like experience across all platforms.
- Service workers enable offline functionality and cross-platform compatibility.

**Multi-Modal AI Processing**
- Uses OpenAI GPT-4o as primary and Claude Sonnet 4 as secondary.
- Features a modular AI processing pipeline with fallback capabilities.

**Offline-First Data Architecture**
- Prioritizes local processing for responsive user experience.
- Asynchronous AI enhancement that doesn't block user interactions.
- Includes a comprehensive versioning system for data integrity.

**Core Components**

**AI Intelligence Framework (Mira AI Brain)**
- Central processing unit for AI operations, classifying between commerce and memory processing.
- Utilizes advanced prompt engineering and multi-model processing pipelines for fast classification and orthogonal routing.

**Data Storage and Protection**
- Advanced schema design for note versioning, protected content preservation, and multi-dimensional relationship mapping.
- Data protection service identifies high-value user input, provides version control for AI modifications, and supports user approval workflows for sensitive changes.

**Multi-Modal Input Processing**
- **Text Processing**: Advanced natural language understanding, intelligent todo extraction, and contextual collection suggestions.
- **Voice Processing**: High-quality speech-to-text, inline recording, and voice command recognition.
- **Image Processing**: Enhanced image analysis, multi-item identification, OCR, and visual context understanding.

**Intelligent Organization System**
- **Smart Collections**: AI-powered categorization with visual themes and automatic assignment.
- **Advanced Todo Management**: Intelligent priority assignment, time-based scheduling, and reminder integration.

**Data Flow**
- **Input Processing Flow**: Multi-modal capture, fast classification, AI processing, enhancement, organization, and versioned storage.
- **AI Processing Pipeline**: Content analysis, context generation, task extraction, collection suggestion, and content enhancement.
- **Notification System**: Intelligent parsing of time references, context-aware scheduling, and multi-channel delivery.

### UI/UX Decisions
- Instant note preview with "AI analyzing..." placeholder for optimistic updates.
- Enhanced rich context display with prominent sections for strategic intelligence.
- Responsive UI design for voice recording playback.

## Recent Changes (August 5, 2025)

### Auto-Save and Claude Deprecation Implementation
- Implemented auto-save functionality in note-detail.tsx with:
  - 2-second debounced saves on textarea changes
  - Visual save status indicators (Unsaved/Saving/Saved)
  - beforeunload guard to prevent data loss on navigation
  - useBeforeUnload hook from react-use library
- Deprecated Claude comparison functionality per user request:
  - Marked /api/compare-ai endpoint as deprecated (returns 410 status)
  - Renamed ai-comparison.tsx to ai-comparison.deprecated.tsx
  - Focus on single AI partner (OpenAI) until main app pathways are solid

### Critical P0 Fixes - React Object Rendering and Database Issues
- Created parseRichContext.ts utility with safe JSON parsing and React-safe text rendering
- Fixed database column name mismatch: Changed `mira_responseCreatedAt` to `mira_response_created_at` in routes.ts
- Added safeText() wrapper to prevent "Objects are not valid as React child" errors in:
  - note-card.tsx: Fixed rendering of steps, action.title, action.description, link.title
  - ai-comparison.tsx: Fixed rendering of richContext.summary and keyInsights
- Fixed undefined variable errors: Changed `otherUpdates` to `validUpdates` in routes.ts
- Fixed database column issue: Removed `updated_at` reference (database uses `last_modified`)
- Verified rich_context storage already has ::text cast in queue-worker.ts

### Infrastructure and Editor Enhancement (August 3, 2025)
- Comprehensive database normalization with normalizeNote utility for snake_case/camelCase consistency
- Fixed all database column naming inconsistencies across the entire codebase
- Enhanced TipTap editor with Link extension for better link handling
- Implemented iOS-style BubbleMenu formatting (press-and-hold menus)
- Added debounced saves and improved markdown parsing in the editor
- Fixed BubbleMenu import issue by updating to use '@tiptap/react/menus'
- Removed redundant toast notifications for better UX

### Note Detail Editing Fix (August 2, 2025)
- Resolved all 6 TypeScript errors in note-detail.tsx
- Fixed textarea overlap issue by setting pb-[80px] padding
- Implemented client-side task extraction utility (extractTasks.ts)
- Created API normalizer for camelCase property names (normalizeNote.ts)
- Added data-note-id attribute to InputBar for focus guard protection
- Enhanced blur handler with automatic task extraction and saving
- Added PUT /api/notes/:id/tasks endpoint for saving extracted tasks
- Fixed refetchInterval TypeScript error with proper query destructuring

### V3 Help-First AI Implementation (July 31, 2025)
- Fixed InputBar component props issue in NoteDetailSimple
- Implemented and tested V3 Help-First processing with notes #627 and #628
- Enhanced intent classification system (IMMEDIATE_PROBLEM, GENERAL, etc.)
- Improved note detail display with proper layout and debugging

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Primary AI processing, image analysis, transcription.
- **Claude Sonnet 4**: Secondary analysis, complex research tasks.
- **Company Intelligence Database**: Business intelligence and research.

### Infrastructure
- **PostgreSQL**: Primary database.
- **Replit Object Storage**: Scalable file storage for media content.
- **Express.js**: RESTful API.
- **Drizzle ORM**: Type-safe database operations.

### Development Tools
- **TypeScript**: End-to-end type safety.
- **Tailwind CSS**: Utility-first styling.
- **Radix UI**: Accessible component primitives.
- **React Query**: Efficient data fetching and caching.

### Third-Party Integrations
- **Twilio**: For SMS fallback notifications.
- **chrono-node**: For smart scheduling and natural language date parsing.
- **GitHub**: Repository integration for version control (`https://github.com/colincarrier/Mira.git`).