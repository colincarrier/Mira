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

### Strategic Context Documentation Complete (July 23, 2025) ✅
- **Comprehensive Handoff Document**: Created STRATEGIC-CONTEXT-HANDOFF.md capturing multi-stage architectural evolution
- **Long-term Vision Context**: Documented transformation from note-taking app to superhuman AI assistant
- **Strategic Technical Decisions**: Captured rationale for GPT-4o exclusive, queue-based processing, confidence-driven intelligence
- **Future Stage Planning**: Detailed roadmap through Stage-7 (Mobile-First Experience) with dependencies and technical approaches
- **Integration Patterns**: Documented working vs broken segments of data flow architecture
- **Quality & Testing Strategy**: Established testing pyramid and quality gates for external agent guidance
- **Critical Success Factors**: Clear instructions for external agents on preserving working components while fixing display issues
- **External Agent Context**: Provides strategic thinking and architectural evolution context beyond immediate technical fixes

### Stage-4A Enhanced Note Processing Pipeline Implementation Complete (July 22, 2025) - PRODUCTION READY ✅
- **Production-Grade Queue Worker**: MinimalEnhancementWorker with stale job recovery, circuit breaker protection, and graceful shutdown
- **Advanced Database Schema**: Enhanced queue table with unique constraints, proper indexing, and comprehensive monitoring views  
- **Zero-Blocking UX**: Notes created instantly (<170ms) while full Intelligence V2 processing happens asynchronously (typically 5-8 seconds)
- **Complete Pipeline Integration**: Queue worker seamlessly connects Stage-2A Memory + Stage-2B Context + Stage-2C Reasoning + Stage-3A Task Extraction
- **Robust Error Handling**: Configurable retry logic (3 attempts), automatic stale job recovery, and permanent failure handling with flag cleanup
- **Environment Configuration**: Full environment variable support for polling intervals, batch sizes, retry limits, and schema guards
- **Comprehensive Monitoring**: Queue statistics API, failed job tracking, and real-time worker status monitoring
- **End-to-End Validation**: Successfully tested complete pipeline from note creation → queue → AI processing → rich context population
- **Conflict Resolution**: ON CONFLICT handling prevents duplicate queue entries, ensuring each note is enhanced exactly once
- **Production Deployment**: Auto-starting worker with graceful lifecycle management and proper signal handling

### Stage-3D Intelligent Notifications Implementation Complete (July 22, 2025)
- **Multi-Channel Delivery**: Production-ready push notifications with SMS fallback via Twilio
- **Smart Lead-Time Calculation**: Context-aware timing based on priority, category, and confidence scores
- **Push Subscription Management**: Complete user registration system with VAPID key configuration
- **Ambiguity Resolution**: Interactive clarification for vague timing requests ("remind me later")
- **Comprehensive Audit Logging**: Full transparency with notification success/failure tracking
- **Graceful Channel Fallback**: Push → SMS hierarchy with proper error handling
- **Category-Aware Intelligence**: Meeting/flight/appointment detection with appropriate lead times
- **Database Integration**: Complete schema with user profiles, subscriptions, and notification logs
- **Production Configuration**: Environment-based VAPID and Twilio settings
- **Complete Task Pipeline**: End-to-end flow from capture → reasoning → scheduling → notification delivery

### Stage-3C Smart Scheduler Implementation Complete (July 22, 2025)
- **Production-Grade Scheduler**: Complete chrono-node integration with binary heap queue for O(log n) performance
- **Natural Language Date Parsing**: Advanced parsing of timing phrases ("later", "tomorrow at 2pm", "next Friday")  
- **Database Schema Extensions**: Added parsed_due_date, due_date_confidence, and scheduled status to tasks table
- **Circuit Breaker Protection**: Configurable failure thresholds with automatic back-off and recovery
- **Memory-Safe Operations**: Binary heap queue with configurable size limits, graceful resource management
- **Environmental Configuration**: Configurable scan intervals, bootstrap limits, and failure thresholds
- **Graceful Lifecycle Management**: Proper startup/shutdown handlers with .unref() for clean exits
- **Comprehensive Test Suite**: Parser unit tests and scheduler smoke tests with <10s execution time
- **Production Deployment**: Auto-starts in production environment, manual control for development/testing
- **Task Status Pipeline**: Seamless progression from pending → scheduled → completed → archived

### Stage-3B Task Retrieval API + Timing Intelligence Complete (July 22, 2025)
- **Production REST API**: Complete HTTP endpoint `/api/v3/tasks` with filtering, pagination, and validation
- **Performance Optimized**: Parallel queries for <50ms response times, uses existing database indices
- **Comprehensive Filtering**: Support for status (pending/completed/archived) and priority (low/medium/high) filters
- **Smart Pagination**: Limit/offset with nextOffset calculation for front-end pagination
- **Robust Validation**: Input validation with clear error messages, 400/503 error handling
- **Zero Breaking Changes**: Purely additive implementation reusing existing auth and database patterns
- **Full Test Coverage**: 6 integration test cases covering happy path, filtering, pagination, and edge cases
- **Production Ready**: Type-safe implementation with proper SQL parameterization and error handling
- **Timing Intelligence**: Added timing_hint support for vague time words ("later", "soon", "tomorrow") with follow-up questions
- **Surgical Implementation**: 55 LOC across 3 files, maintains Stage-3B stability while capturing user timing intent

### Stage-3A Task Persistence System Implementation Complete (July 22, 2025)
- **Production-Grade Task Database**: Complete tasks table with comprehensive validation constraints, soft deduplication, and proper indexing
- **Intelligent Task Service**: Full CRUD operations with input validation, conflict resolution using confidence scores, and status management
- **Seamless Reasoning Integration**: Non-blocking task persistence for high-confidence extractions (≥0.6) with reasoning log linkage
- **Comprehensive Test Coverage**: Unit tests for TaskService CRUD operations, validation, deduplication, and completion workflows
- **Database Schema Validation**: Strong constraints on titles (2-200 chars), priorities, statuses, and confidence scores (0-1 range)
- **Foreign Key Relationships**: Proper linkage to reasoning_logs table with CASCADE handling for data integrity
- **Async Processing**: Task creation runs asynchronously to avoid blocking reasoning engine response times
- **Enhanced Logging**: Task creation success logging with user context and confidence tracking

### Stage-2C Reasoning Engine Implementation Complete (July 22, 2025)
- **Production-Grade Implementation**: Complete reasoning engine with OpenAI GPT-4o integration, circuit breaker pattern, and comprehensive error handling
- **Full Stack Integration**: Seamlessly integrates Stage-2A memory facts and Stage-2B entity extraction into intelligent prompt construction
- **Advanced Caching System**: LRU cache with TTL support, configurable size limits, and cache hit/miss statistics
- **Database Logging**: Complete reasoning_logs table with performance metrics, token usage tracking, and success/failure logging
- **Circuit Breaker Protection**: Automatic failure detection, retry logic, and graceful degradation when AI services unavailable
- **Comprehensive Test Suite**: Full test coverage including caching, context integration, circuit breaker functionality, and error conditions
- **Type Safety**: Strict TypeScript compliance with proper OpenAI v5 API interface alignment
- **Configuration Management**: Environment-based configuration with sensible defaults and production optimization

### Stage-2B Context Engine Implementation Complete (July 20, 2025)
- **Production Safe Installation**: Implemented additive-only Stage-2B installer with comprehensive safety measures
- **Entity Extraction Engine**: Context-aware extractor with pattern + NLP processing, LRU caching, and confidence scoring
- **Database Schema Extension**: Added extraction_method, extraction_confidence, context_data, and last_accessed columns to facts table
- **Pool Reuse Implementation**: Micro-fix A & B applied - exported Stage-2A pool and reused for context engine (no connection duplication)
- **Comprehensive Test Suite**: Stage-2B context tests passing (5 entities extracted, 2 facts stored, cache functionality verified)
- **Memory Integration**: Proper Stage-2A API usage with metadata merging and error handling
- **Performance Optimizations**: 16KB input limits, 25 entity maximum, 10-minute cache TTL, 5MB cache size limit
- **Configuration System**: Database-driven config table for dynamic cache sizing and confidence thresholds
- **Type Safety**: Fixed union types and import issues, TypeScript compilation successful for context engine modules

### Intelligence V3 Architecture Planning Complete (June 27, 2025)
- **Comprehensive Blueprint**: Created detailed V3_CHANGEOVER_PLAN.md with 8-phase implementation strategy
- **Single-Source Intelligence**: Consolidated architecture with `server/ai/mira-superintelligence.ts` as master file
- **Cost-Controlled Processing**: 8K token ceiling with $30/month user budget and value-driven recursion
- **Living Document Integration**: Seamless AI-human collaboration with contextual content weaving
- **Context-Aware Intelligence**: User profiling, relationship mapping, and stakes-based processing
- **Smart Task Extraction**: Intelligent todo/reminder creation with user pattern learning
- **GPT-4o Exclusive**: All enrichment through advanced prompting, no external API dependencies
- **V2 Preservation**: Maintains sophisticated V2 capabilities while adding contextual awareness

### GitHub Repository Integration (June 24, 2025)
- **Repository Connected**: Successfully linked to https://github.com/colincarrier/Mira.git
- **Comprehensive Export**: Generated complete codebase archives (157,295 lines of code)
- **Clean .gitignore**: Created to exclude uploads, node_modules, and temporary files
- **Ready for Sync**: All source code prepared for GitHub synchronization
- **Export Archives**: Multiple formats available (source-only: 319KB, complete: 102MB)

### Complete Voice Recording System Implementation (June 20, 2025)
- **Audio File Storage**: Fixed saveAudioFile integration to properly store and serve voice recordings
- **Full Playback System**: Implemented HTML5 audio with play/pause controls and progress tracking
- **Authentic Waveform Generation**: Content-based waveform patterns replacing fake Math.sin() animations
- **OpenAI V2 Intelligence**: Removed all Claude dependencies, routing voice processing through V2 system
- **Real Duration Display**: Using actual audio metadata instead of transcription-length estimates
- **Responsive UI Design**: Fixed overflow issues with proper container bounds and click-to-seek
- **Cross-Component Consistency**: Unified voice note player across cards and detail pages

### Permission System Consolidation Complete (June 20, 2025)
- **Extended Permission Caching**: Increased cache validity from 24 hours to 1 year (8760 hours)
- **Centralized Permission Management**: Unified hook eliminating duplicate permission requests
- **Enhanced Error Diagnostics**: Detailed error reporting for camera/microphone access issues
- **Progressive Fallback Logic**: Camera constraints fallback from ideal to basic settings
- **Persistent Permission State**: localStorage-based caching with denial cooldown protection
- **Cross-Component Integration**: Full-screen capture and voice recorder using unified system

### AI-First Implementation Complete (June 24, 2025)
- **JSON Processing Fix**: OpenAI now uses strict JSON mode with response_format enforcement
- **Client-Side Elimination**: Removed all hardcoded follow-up questions and fallback content
- **Prompt Engineering**: Rebuilt prompts for guaranteed JSON output without conversational responses  
- **Image Processing**: Updated image analysis to use Intelligence V2 pipeline consistently
- **UI Components**: Added InputBar to all note detail pages for complete functionality
- **Fallback Removal**: Disabled all non-AI content generation systems
- **Production Status**: True AI-first architecture with no client-side content generation

### Intelligence-V2 Architecture Implementation (June 14, 2025)
- **Vector Engine**: Implemented dual-vector storage (dense + sparse) for semantic search
- **Recursive Reasoning Engine**: Built 2-3 step ahead thinking capabilities
- **Relationship Mapper**: Created sophisticated content relationship analysis
- **Feature Flag System**: Enabled controlled rollout of new intelligence features
- **Enhanced Database Schema**: Added vector storage, intent classification, and collection intelligence
- **Proactive Intelligence Router**: Integrated all components for unified processing

### Previous Updates
- June 14, 2025. Initial setup with basic AI processing and reminder system