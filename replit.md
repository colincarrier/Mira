# Mira AI Memory Assistant

## Overview

Mira is a sophisticated AI-powered memory and productivity assistant that transforms note-taking through advanced multi-modal intelligence. The application combines text, voice, and image processing with intelligent organization, task extraction, and proactive assistance capabilities.

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS (PWA-enabled)
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: OpenAI GPT-4o (primary), Claude Sonnet 4 (secondary)
- **Build System**: Vite with deployment via Replit
- **Storage**: Local file system for media, Object Storage for scalability

### Architectural Decisions

**Progressive Web App (PWA) Architecture**
- Chosen to provide native app-like experience across all platforms
- Service workers enable offline functionality
- Cross-platform compatibility without separate mobile development

**Multi-Modal AI Processing**
- OpenAI GPT-4o as primary processor for consistency and reliability
- Claude Sonnet 4 as secondary for complex analysis and research tasks
- Modular AI processing pipeline with fallback capabilities

**Offline-First Data Architecture**
- Local processing where possible to ensure responsive user experience
- Asynchronous AI enhancement that doesn't block user interactions
- Comprehensive versioning system to protect user data integrity

## Key Components

### 1. AI Intelligence Framework

**Mira AI Brain** (`server/utils/miraAIProcessing.ts`)
- Central processing unit for all AI operations
- Intelligent classification between commerce and memory processing paths
- Advanced prompt engineering with context-aware analysis
- Protected files with strict modification protocols

**Multi-Model Processing Pipeline**
- Fast classification engine (1ms keyword scoring)
- Commerce path for shopping assistance and product research
- Memory path for personal task management and organization
- Orthogonal routing system preventing cross-contamination

### 2. Data Storage and Protection

**Advanced Schema Design**
- Comprehensive note versioning with rollback capabilities
- Protected content preservation during AI modifications
- Multi-dimensional relationship mapping (notes, todos, collections, items)
- Time-sensitive data handling with intelligent scheduling

**Data Protection Service**
- Content analysis to identify high-value user input sections
- Version control for all AI modifications
- User approval workflows for sensitive changes
- Emergency rollback capabilities

### 3. Multi-Modal Input Processing

**Text Processing**
- Advanced natural language understanding
- Intelligent todo extraction with quality filtering
- Contextual collection suggestions
- Time-sensitive reminder detection

**Voice Processing**
- High-quality speech-to-text transcription
- Inline recording with waveform visualization
- Automatic audio file management
- Voice command recognition

**Image Processing**
- Enhanced image analysis with company intelligence
- Multi-item identification and extraction
- OCR capabilities for text recognition
- Visual context understanding

### 4. Intelligent Organization System

**Smart Collections**
- AI-powered categorization with visual themes
- Automatic collection creation and assignment
- Icon and color coordination
- Hierarchical organization support

**Advanced Todo Management**
- Intelligent priority assignment
- Time-based scheduling with lead time calculation
- Reminder integration with notification system
- Project hierarchy and dependency tracking

## Data Flow

### Input Processing Flow
1. **Multi-Modal Capture**: Text, voice, or image input received
2. **Fast Classification**: 1ms keyword-based routing decision
3. **AI Processing**: Route to appropriate AI brain (commerce/memory)
4. **Enhancement**: Content enrichment with context and suggestions
5. **Organization**: Automatic collection assignment and todo extraction
6. **Storage**: Versioned storage with data protection protocols

### AI Processing Pipeline
1. **Content Analysis**: Intent classification and complexity scoring
2. **Context Generation**: Rich context with next steps and recommendations
3. **Task Extraction**: Intelligent todo creation with time sensitivity
4. **Collection Suggestion**: Smart categorization with visual elements
5. **Enhancement**: Content improvement while preserving user intent

### Notification System
1. **Intelligent Parsing**: Time reference detection and extraction
2. **Context-Aware Scheduling**: Category-based lead time calculation
3. **Notification Delivery**: Multi-channel notification system
4. **User Feedback Loop**: Completion tracking and optimization

## External Dependencies

### AI Services
- **OpenAI GPT-4o**: Primary AI processing, image analysis, transcription
- **Claude Sonnet 4**: Secondary analysis, complex research tasks
- **Company Intelligence Database**: Business intelligence and research capabilities

### Infrastructure
- **PostgreSQL**: Primary database with advanced querying capabilities
- **Replit Object Storage**: Scalable file storage for media content
- **Express.js**: RESTful API with comprehensive route protection
- **Drizzle ORM**: Type-safe database operations with migration support

### Development Tools
- **TypeScript**: End-to-end type safety
- **Tailwind CSS**: Utility-first styling with design system
- **Radix UI**: Accessible component primitives
- **React Query**: Efficient data fetching and caching

## Deployment Strategy

### Replit Cloud Platform
- **Auto-scaling**: Automatic resource scaling based on demand
- **Environment Management**: Separate development and production environments
- **Database Integration**: Managed PostgreSQL with automatic backups
- **Object Storage**: Integrated file storage with CDN capabilities

### Build Process
- **Development**: Hot-reload development server with real-time updates
- **Production**: Optimized builds with code splitting and tree shaking
- **Asset Management**: Automatic asset optimization and caching
- **Service Workers**: PWA capabilities with offline functionality

### Security Considerations
- **API Protection**: Rate limiting and authentication middleware
- **Data Encryption**: Secure data transmission and storage
- **User Privacy**: Configurable privacy levels and data protection
- **AI Content Protection**: Strict modification protocols for AI prompts

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Permission System Consolidation Complete (June 20, 2025)
- **Extended Permission Caching**: Increased cache validity from 24 hours to 1 year (8760 hours)
- **Centralized Permission Management**: Unified hook eliminating duplicate permission requests
- **Enhanced Error Diagnostics**: Detailed error reporting for camera/microphone access issues
- **Progressive Fallback Logic**: Camera constraints fallback from ideal to basic settings
- **Persistent Permission State**: localStorage-based caching with denial cooldown protection
- **Cross-Component Integration**: Full-screen capture and voice recorder using unified system

### Intelligence-V2 Processing Fully Restored (June 20, 2025)
- **Critical Method Fix**: Corrected `processWithIntelligenceV2` to `processNoteV2` method name mismatch
- **Schema Validation Fixed**: Resolved OpenAI response parsing with proper ActionLabel type mapping
- **V2 Processing Active**: Full Intelligence-V2 pipeline operational with recursive reasoning
- **Enhanced Entity Extraction**: Advanced entity recognition with relevance scores up to 0.95
- **Recursive Analysis Working**: Generating contextual next steps, micro-questions, and relationship mapping
- **Vector Operations Restored**: Semantic search and vector updates functioning properly
- **Type Compatibility Fixed**: V2 to V1 result format mapping working correctly
- **Processing Path Routing**: Proper classification between commerce and memory processing paths

### Intelligence-V2 Architecture Implementation (June 14, 2025)
- **Vector Engine**: Implemented dual-vector storage (dense + sparse) for semantic search
- **Recursive Reasoning Engine**: Built 2-3 step ahead thinking capabilities
- **Relationship Mapper**: Created sophisticated content relationship analysis
- **Feature Flag System**: Enabled controlled rollout of new intelligence features
- **Enhanced Database Schema**: Added vector storage, intent classification, and collection intelligence
- **Proactive Intelligence Router**: Integrated all components for unified processing

### Previous Updates
- June 14, 2025. Initial setup with basic AI processing and reminder system