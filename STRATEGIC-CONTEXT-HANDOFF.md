# **STRATEGIC-CONTEXT-HANDOFF.md**
*Comprehensive context for external agents on Mira's architectural evolution and strategic planning*

## **1 · Project Vision & Strategic Direction**

### **1.1 · North Star Evolution**
Mira began as a note-taking app and is transforming into a **superhuman AI assistant** with:
- **Collaborative Document Editing**: iOS Notes/Google Docs-like real-time experience
- **Context-Aware Intelligence**: MBA-level thinking that anticipates user needs 2-3 steps ahead
- **Living Document Platform**: Seamless user-AI collaboration where content evolves intelligently
- **Proactive Task Management**: Intelligent notifications and scheduling without manual setup
- **Offline-First Architecture**: Works regardless of connectivity with sync when available

### **1.2 · Strategic Architecture Philosophy**
- **Progressive Enhancement**: Every stage adds capability without breaking existing functionality
- **AI-First Design**: Intelligence baked into every interaction, not bolted on
- **User Voice Preservation**: AI enhances without overwriting personal expression
- **Incremental Deployment**: Ship small, validated changes rather than big-bang releases
- **Cost-Conscious Intelligence**: Maximum value within token/compute budgets

## **2 · Multi-Stage Architectural Evolution**

### **2.1 · Completed Foundation Stages**

#### **Stage-1: Foundation (June 2025)**
- **Achievement**: Cost/IO guards, circuit breakers, type safety
- **Strategic Value**: Established safety patterns for AI-intensive operations
- **Key Learning**: Proper guardrails enable aggressive AI experimentation

#### **Stage-2A: Memory System (July 2025)**
- **Achievement**: Fact storage, confidence scoring, semantic deduplication
- **Strategic Value**: Created persistent context layer for intelligent responses
- **Key Learning**: Memory decay prevents staleness while preserving valuable insights

#### **Stage-2B: Context Engine (July 2025)**
- **Achievement**: Entity extraction, LRU caching, confidence-based filtering
- **Strategic Value**: Bridges raw input to structured understanding
- **Key Learning**: NLP + pattern matching outperforms pure LLM extraction for entities

#### **Stage-2C: Reasoning Engine (July 2025)**
- **Achievement**: GPT-4o integration, circuit breaker, comprehensive logging
- **Strategic Value**: Central intelligence hub with full observability
- **Key Learning**: Structured prompts with validation prevent malformed responses

### **2.2 · Current Implementation Stages**

#### **Stage-3A: Task Persistence (July 22, 2025) - COMPLETE**
- **Achievement**: Production-grade task database with validation constraints
- **Strategic Value**: Converts AI insights into actionable user workflows
- **Key Learning**: Confidence-based deduplication prevents task spam

#### **Stage-3B: Task Retrieval API (July 22, 2025) - COMPLETE**
- **Achievement**: REST API with filtering, pagination, performance optimization
- **Strategic Value**: Enables task management UIs and external integrations
- **Key Learning**: Parallel queries essential for sub-50ms response times

#### **Stage-3C: Smart Scheduler (July 22, 2025) - COMPLETE**
- **Achievement**: Natural language date parsing, binary heap queue, circuit breaker
- **Strategic Value**: Converts vague timing into precise scheduling
- **Key Learning**: chrono-node + custom heap outperforms cron for dynamic scheduling

#### **Stage-3D: Intelligent Notifications (July 22, 2025) - COMPLETE**
- **Achievement**: Multi-channel delivery (push + SMS), smart lead times, audit logging
- **Strategic Value**: Proactive assistance without user configuration overhead
- **Key Learning**: Category-aware timing prevents notification spam

#### **Stage-4A: Enhanced Note Processing (July 22, 2025) - COMPLETE BACKEND**
- **Achievement**: MinimalEnhancementWorker with production queue system
- **Strategic Value**: Instant note creation with background intelligence enhancement
- **Current Status**: Backend perfect, frontend display completely broken

## **3 · Planned Future Stages**

### **3.1 · Stage-4B: Learning Loops (August 2025)**
- **Objective**: AI system learns from user patterns and improves responses
- **Components**: Prompt self-reflection, user feedback integration, pattern recognition
- **Strategic Value**: Personalizes intelligence without manual configuration
- **Dependencies**: Stage-4A display issues resolved

### **3.2 · Stage-5: Collaborative Editing (September 2025)**
- **Objective**: Real-time collaborative document editing with AI participation
- **Components**: Operational transforms, conflict resolution, AI suggestion integration
- **Strategic Value**: Enables true living document experience
- **Technical Approach**: WebSocket-based with CRDT for conflict resolution

### **3.3 · Stage-6: Advanced Intelligence (October 2025)**
- **Objective**: Multi-document reasoning, relationship mapping, proactive insights
- **Components**: Document graph analysis, cross-reference detection, trend identification
- **Strategic Value**: Transforms collection of notes into interconnected knowledge base
- **AI Architecture**: Vector embeddings + graph traversal for context discovery

### **3.4 · Stage-7: Mobile-First Experience (November 2025)**
- **Objective**: Native mobile app experience with offline-first architecture
- **Components**: Service workers, local SQLite, background sync
- **Strategic Value**: Captures insights anywhere without connectivity dependence
- **Technical Approach**: PWA with native capabilities via Capacitor

## **4 · Strategic Technical Decisions & Rationale**

### **4.1 · AI Architecture Decisions**

#### **GPT-4o Exclusive Strategy**
- **Decision**: Use GPT-4o for all AI processing, eliminating Claude fallback
- **Rationale**: Consistency in response format, lower latency, cost predictability
- **Trade-offs**: Single point of failure vs. reduced complexity
- **Status**: Implemented and validated

#### **Queue-Based Processing Pattern**
- **Decision**: Async processing with persistent queues for all AI enhancement
- **Rationale**: User experience not blocked by AI latency, graceful failure handling
- **Implementation**: MinimalEnhancementWorker with stale job recovery
- **Status**: Production-ready, auto-starting

#### **Confidence-Driven Intelligence**
- **Decision**: All AI outputs include confidence scores for quality filtering
- **Rationale**: Prevents low-quality suggestions from cluttering user experience
- **Implementation**: Thresholds at extraction (0.6+), display (0.7+), action (0.8+)
- **Status**: Validated across all stages

### **4.2 · Data Architecture Decisions**

#### **PostgreSQL with Memory Schema**
- **Decision**: Dedicated `memory` schema for AI-related tables
- **Rationale**: Separation of concerns, easier backup/migration, cleaner queries
- **Structure**: facts, reasoning_logs, enhance_queue, tasks tables
- **Status**: Stable foundation for all intelligence features

#### **Rich Context Storage Pattern**
- **Decision**: Store structured AI responses as TEXT fields with client-side parsing
- **Rationale**: Flexibility for format evolution, simplicity over premature optimization
- **Implementation**: parseRichContext.ts handles multiple format versions
- **Status**: Working backend, broken frontend display

#### **Offline-First with Sync**
- **Decision**: Local processing where possible, async sync to server
- **Rationale**: Responsive user experience regardless of connectivity
- **Implementation**: Service workers, local storage, background sync
- **Status**: Planned for Stage-7

### **4.3 · User Experience Architecture**

#### **Progressive Disclosure Strategy**
- **Decision**: Start simple, reveal complexity only when user engages
- **Implementation**: Note → AI insight → task extraction → scheduling
- **Rationale**: Prevents cognitive overload while maintaining power user capabilities
- **Status**: Design validated, implementation in Stage-4B

#### **Voice Preservation Protocol**
- **Decision**: AI enhances without overwriting user's original expression
- **Implementation**: Separate rich_context field, clearly marked AI content
- **Rationale**: Maintains user ownership and trust in the system
- **Status**: Enforced in all AI processing stages

## **5 · Critical Integration Patterns**

### **5.1 · Data Flow Architecture**
```
User Input → Note Creation (instant) → Enhancement Queue → AI Processing → Rich Context Storage → UI Display
```

**Working Segments:**
- User Input → Note Creation ✅
- Enhancement Queue → AI Processing ✅  
- AI Processing → Rich Context Storage ✅

**Broken Segment:**
- Rich Context Storage → UI Display ❌ (Current crisis)

### **5.2 · AI Processing Pipeline**
```
Raw Content → Memory Facts → Context Entities → Reasoning → Task Extraction → Scheduling → Notifications
```

**Stage Integration:**
- Stage-2A (Memory) feeds Stage-2C (Reasoning)
- Stage-2B (Context) provides entities to Stage-2C
- Stage-2C output triggers Stage-3A (Task Creation)
- Stage-3A tasks flow to Stage-3C (Scheduling)
- Stage-3C scheduled items trigger Stage-3D (Notifications)

### **5.3 · Frontend Integration Points**
- **React Query**: Auto-refresh with staleTime: 0 for real-time updates
- **parseRichContext**: Client-side intelligence response parsing
- **Component Hierarchy**: note-card → NoteDetailSimple → task display
- **State Management**: Minimal React state, rely on React Query cache

## **6 · Strategic Learnings & Patterns**

### **6.1 · What Works Well**
- **Additive-Only Changes**: Never breaks existing functionality
- **Circuit Breaker Pattern**: Prevents cascade failures in AI services
- **Confidence Scoring**: Natural quality filter without hard rules
- **Queue-Based Processing**: Decouples user experience from AI latency
- **Type-Safe Boundaries**: TypeScript strict mode catches integration issues

### **6.2 · Anti-Patterns to Avoid**
- **Big-Bang Deployments**: Stage-based approach much more reliable
- **Synchronous AI Processing**: Always blocks user interactions
- **Hard-Coded Thresholds**: Confidence-based filtering more adaptive
- **Manual Configuration**: Intelligence should work without user setup
- **Premature Optimization**: Focus on working features first

### **6.3 · Cost Management Patterns**
- **Token Ceiling**: 8K token limit per processing cycle
- **Batch Processing**: Group similar operations to reduce API calls
- **Caching Strategy**: LRU cache with TTL prevents redundant processing
- **Circuit Breakers**: Automatic back-off when costs spike
- **Budget Monitoring**: Daily $20 limit with kill-switch at $25

## **7 · External Integration Strategy**

### **7.1 · Planned Integrations**
- **Calendar Systems**: Bidirectional sync with Google Calendar, Outlook
- **Communication**: Slack, Discord, email parsing for context
- **File Systems**: Dropbox, Google Drive for document intelligence
- **Task Management**: Notion, Todoist integration for power users

### **7.2 · API Design Principles**
- **REST-First**: Standard HTTP patterns for external consumption
- **Versioning**: /v3/ prefix with backward compatibility commitment
- **Authentication**: JWT tokens with scoped permissions
- **Rate Limiting**: Prevents abuse while allowing legitimate usage
- **Documentation**: OpenAPI specs auto-generated from code

## **8 · Quality & Testing Strategy**

### **8.1 · Testing Pyramid**
- **Unit Tests**: Pure functions, data transformations, utilities
- **Integration Tests**: API endpoints, database operations, AI processing
- **E2E Tests**: Complete user workflows, critical path validation
- **Performance Tests**: Load testing with K6, latency monitoring

### **8.2 · Quality Gates**
- **TypeScript Strict**: No any types, proper interface definitions
- **Test Coverage**: >80% for core logic, >60% for UI components
- **Performance**: <170ms note creation, <50ms API responses
- **Security**: Dependency scanning, SQL injection prevention
- **Cost**: Daily budget monitoring with automatic alerts

## **9 · Deployment & Operations**

### **9.1 · Environment Strategy**
- **Development**: Local Replit with hot reload
- **Staging**: Full Replit environment with production data subset
- **Production**: Replit deployment with auto-scaling
- **Monitoring**: Grafana dashboards, alert rules, log aggregation

### **9.2 · Release Process**
- **Feature Branches**: stage-4b/learning-loops naming convention
- **Code Review**: AI code changes require architect approval
- **Staging Validation**: Full E2E test suite must pass
- **Production Deploy**: Blue-green deployment with rollback capability
- **Post-Deploy**: Monitor metrics for 24h, rollback if issues

## **10 · Current Critical Context**

### **10.1 · Immediate Technical Crisis**
**Stage-4A Backend Complete, Frontend Completely Broken**

**Evidence:**
- Enhancement queue processing all notes successfully (11/11 completed)
- AI responses properly stored in memory.reasoning_logs
- Rich context data exists in notes.rich_context field
- parseRichContext receives data but UI components don't render aiBody
- Tasks created but not displayed in note detail pages
- Image processing stores embedded prompts instead of analysis results

**Root Cause:**
AI processing pipeline works perfectly, presentation layer completely broken.

### **10.2 · Strategic Impact**
- **User Experience**: Appears like AI system is completely non-functional
- **Development Velocity**: Cannot proceed with Stage-4B until display fixed
- **Stakeholder Confidence**: Working system looks broken due to UI issues
- **Technical Debt**: Display issues compound with each new AI feature

## **11 · Handoff Instructions for External Agents**

### **11.1 · Context Loading Priority**
1. **This Document**: Strategic context and multi-stage planning
2. **SYSTEM-CORE.md**: Current technical architecture
3. **DEV-ROADMAP.md**: Immediate priorities and operational context
4. **UX-COLLAB.md**: Frontend patterns and user experience requirements

### **11.2 · Critical Success Factors**
- **Preserve Working Components**: Don't modify MinimalEnhancementWorker or reasoning engine
- **Focus on Display Layer**: AI processing works, UI rendering is broken
- **Maintain Strategic Direction**: Fixes should align with living document vision
- **Document Changes**: Update replit.md with any architectural modifications
- **Test Thoroughly**: Verify both backend processing and frontend display

### **11.3 · Long-Term Vision Context**
Remember that immediate fixes are part of larger transformation:
- Current crisis blocks progression to Stage-4B learning loops
- Stage-5 collaborative editing depends on solid Stage-4 foundation
- Mobile-first experience (Stage-7) requires reliable offline sync
- Every decision should consider multi-stage architectural evolution

---

*This document captures the strategic thinking, architectural evolution, and long-term planning context that external agents need to make decisions aligned with Mira's transformation vision.*