# Mira AI Architecture Reference - Current State (July 22, 2025)

This document provides accurate technical context for AI assistants working on the Mira codebase. All file paths, method signatures, and data flows are verified against the actual implementation.

## System Overview

Mira is a Progressive Web App (PWA) that combines real-time note capture with asynchronous AI enhancement through a sophisticated multi-stage pipeline.

**Core Architecture:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Node.js with PostgreSQL
- **AI Processing:** OpenAI GPT-4o via custom Stage-4A enhancement queue
- **Data Flow:** Instant note creation → Background AI enhancement → Rich context population

## Key Architectural Principles

1. **Zero-Blocking UX:** Notes created instantly (<170ms) while AI processing happens asynchronously
2. **Queue-Based Enhancement:** Production-grade worker system handles AI processing without blocking user interactions  
3. **Multi-Stage Intelligence:** Stage-2A Memory → Stage-2B Context → Stage-2C Reasoning → Stage-3A Tasks → Stage-4A Enhancement
4. **Progressive Enhancement:** Notes work without AI, but get progressively enriched over time

## Current Data Flow Architecture

### Note Creation Flow
```
User Input → POST /api/notes → Database (instant) → enhance_queue → MinimalEnhancementWorker → ReasoningEngine → rich_context update
```

### Enhancement Pipeline (Stage-4A)
```
enhance_queue table → MinimalEnhancementWorker.processBatch() → ReasoningEngine.processNote() → rich_context JSON storage
```

### Frontend Data Flow  
```
React Query cache → ActivityFeed & NoteCard → parseRichContext() → Display components
```

## File Structure & Key Components

### Server-Side Architecture

#### `/server/ai/v3/enhance/queue-worker.ts`
**Class:** `MinimalEnhancementWorker`
**Key Methods:**
- `start()`: Begins polling loop with stale job recovery
- `processBatch()`: Atomic batch processing with transaction safety
- `processJob(job: EnhanceJob)`: Single note enhancement pipeline
- `applyEnhancement(noteId: number, rc: unknown)`: Database update with rich_context

**Environment Configuration:**
- `ENHANCE_POLL_MS` (default: 3000)
- `ENHANCE_BATCH_SIZE` (default: 5) 
- `ENHANCE_MAX_RETRIES` (default: 3)
- `ENHANCE_SCHEMA_GUARD` (boolean)

#### `/server/ai/v3/reasoning/reasoning-engine.ts`
**Class:** `ReasoningEngine`
**Key Method:** `processNote(uid: string, note: string, opt: ReasoningRequest['options']): Promise<ReasoningResponse>`

**Data Flow:**
1. Cache lookup via LRU with TTL
2. Stage-2A: Memory.recallFacts() for context
3. Stage-2B: ContextMemory.processNote() for entity extraction  
4. Prompt building via PromptBuilder.build()
5. OpenAI API call via OpenAIClient.generate()
6. Task extraction via PromptBuilder.extractTask()
7. Response assembly with timing follow-up logic

**Return Format:**
```typescript
interface ReasoningResponse {
  answer: string;           // Natural language response
  task?: ExtractedTask;     // Structured task data
  meta: {
    cached: boolean;
    latencyMs: number;
    tokenUsage?: object;
    confidence: number;
    model: string;
  };
}
```

#### `/server/ai/v3/reasoning/prompt-builder.ts`
**Class:** `PromptBuilder`
**Key Methods:**
- `build(uid: string, note: string, ctx: string[])`: Constructs system prompt with context
- `extractTask(ans: string)`: Parses TASK_JSON from AI response
- `enhanceTiming(task: any, sourceText: string)`: Post-processes timing hints

**Current System Prompt (lines 10-17):**
```typescript
private sys = `You are Mira, a concise, helpful assistant. 
Analyse the note and offer insights (≤200 words).
• If there is a clear task, output exactly one line starting with TASK_JSON: followed by valid JSON describing it.
• If the user uses an explicit but ambiguous time word (e.g. "later", "soon", "tomorrow") 
  and you cannot determine a concrete date, put that literal word into a field 
  "timing_hint" inside the JSON instead of "dueDate", **do not drop it**.
• In that situation, end your answer with a short clarifying question 
  ("Sure – when should I remind you?").`;
```

**Known Issue:** Line 17 causes ALL responses to include "Sure – when should I remind you?" regardless of context.

### Client-Side Architecture

#### `/client/src/pages/notes.tsx`
**Main Notes Page Component**
**React Query Configuration (lines 21-26):**
```typescript
const { data: notes } = useQuery<NoteWithTodos[]>({
  queryKey: ["/api/notes"],
  staleTime: 120000,           // 2 minute cache
  gcTime: 600000,              // 10 minute garbage collection
  refetchOnMount: false,       // ISSUE: Prevents auto-refresh
});
```

**Mutations:** 
- `createTextNoteMutation`: POST /api/notes with immediate cache invalidation

#### `/client/src/components/activity-feed.tsx` 
**Notes List Component**
**React Query Configuration (lines 17-23):**
```typescript
const { data: notes, isLoading } = useQuery<NoteWithTodos[]>({
  queryKey: ["/api/notes"],
  staleTime: 120000,
  gcTime: 600000, 
  refetchOnWindowFocus: false,  // ISSUE: No focus refetch
  refetchOnMount: false,        // ISSUE: Prevents auto-refresh
});
```

#### `/client/src/utils/parseRichContext.ts`
**Rich Context Parser**
**Interface:**
```typescript
interface ParsedRichContext {
  title: string;
  original?: string;
  aiBody?: string;
  perspective?: string;
  recommendedActions?: string[];
  quickInsights?: string[];
  nextSteps?: string[];
  answer?: string;              // Stage-4A format
  task?: {                     // Stage-4A structured task
    task: string;
    timing_hint?: string;
    confidence?: number;
  };
  meta?: {                     // Processing metadata
    latencyMs?: number;
    confidence?: number;
    model?: string;
  };
}
```

**Parsing Logic:**
- Stage-4A format detection via `'answer' in parsed || 'task' in parsed`
- Double-decode fallback for legacy stringified data
- Defensive error handling with console warnings

#### `/client/src/components/note-card.tsx`
**Individual Note Display**
**Rich Context Integration (lines 316-320, 596-651):**
```typescript
const richContextData = React.useMemo(() => {
  if (!note.richContext) return null;
  try {
    return parseRichContext(note.richContext);
  } catch (error) {
    return null;
  }
}, [note.richContext]);
```

## Database Schema

### Notes Table
```sql
id: SERIAL PRIMARY KEY
content: TEXT NOT NULL
rich_context: TEXT              -- JSON string from Stage-4A processing
ai_enhanced: BOOLEAN DEFAULT false
is_processing: BOOLEAN DEFAULT false
created_at: TIMESTAMP
-- ... other fields
```

### Enhancement Queue Table  
```sql
-- memory.enhance_queue
id: SERIAL PRIMARY KEY
note_id: INTEGER REFERENCES notes(id)
user_id: TEXT NOT NULL
text: TEXT NOT NULL
status: TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
retry_count: INTEGER DEFAULT 0
error_message: TEXT
created_at: TIMESTAMP
started_at: TIMESTAMP
completed_at: TIMESTAMP
```

## Current Known Issues (July 22, 2025)

### 1. Hardcoded Follow-up Question
**Location:** `server/ai/v3/reasoning/prompt-builder.ts:17`
**Issue:** System prompt always includes "Sure – when should I remind you?" instruction
**Impact:** ALL notes get this question appended, regardless of content
**Example Corrupted Data:**
```json
{
  "answer": "\"task\": \"build a business plan...\", \"timing_hint\": \"later\" } Sure – when should I remind you?",
  "meta": {...}
}
```

### 2. JSON Structure Corruption  
**Location:** `server/ai/v3/reasoning/reasoning-engine.ts:118-123`
**Issue:** Manual timing question appending creates malformed JSON structure
**Root Cause:** Task JSON embedded in answer field instead of separate structure

### 3. Auto-Refresh Disabled
**Locations:** 
- `client/src/pages/notes.tsx:25` 
- `client/src/components/activity-feed.tsx:21-22`
**Issue:** `refetchOnMount: false` prevents new notes from appearing automatically
**Impact:** Users must manually refresh to see new notes

### 4. Rich Context Display Issues
**Location:** Various client components
**Issue:** Raw code strings leak into UI due to malformed JSON parsing
**Impact:** Users see technical JSON instead of natural language

## Integration Points

### OpenAI API Integration
**Client Class:** `OpenAIClient` (custom wrapper)
**Model:** GPT-4o-mini (configurable via `OPENAI_MODEL`)
**Token Limits:** 300 max tokens (configurable via `OPENAI_MAX_TOKENS`)
**Authentication:** Via `OPENAI_API_KEY` environment variable

### React Query Patterns
**Cache Keys:** Array format for hierarchical invalidation
- `['/api/notes']` for notes list
- `['/api/notes', id]` for individual notes
- `['/api/todos']` for tasks

**Invalidation Pattern:**
```typescript
queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
```

### Error Handling
**Circuit Breaker:** Built into ReasoningEngine for AI service failures
**Retry Logic:** 3 attempts with exponential backoff in queue worker
**Graceful Degradation:** Notes work without AI enhancement

## Performance Characteristics

**Note Creation:** <170ms average response time
**AI Enhancement:** 5-8 seconds background processing
**Queue Processing:** 3-second polling interval, 5 notes per batch
**Cache Strategy:** 2-minute stale time, 10-minute garbage collection
**Database:** Connection pooling via `contextPool` from `../context/db-pool.js`

## Development & Testing

**Test Files:**
- `/tests/stage-4a-enhanced-queue-test.js`: End-to-end pipeline testing
- `/run-automated-tests.js`: Comprehensive test runner

**Debugging Endpoints:**
- `GET /api/enhance-queue/stats`: Queue monitoring
- Console logging throughout pipeline for troubleshooting

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `NODE_ENV`: Environment mode (development/production)

**Optional Configuration:**
- `ENHANCE_POLL_MS`: Queue polling frequency
- `ENHANCE_BATCH_SIZE`: Notes processed per batch
- `ENHANCE_MAX_RETRIES`: Failure retry limit
- `OPENAI_MODEL`: AI model selection
- `FEATURE_INTELLIGENCE_V2`: Enable/disable V2 features

This document represents the current state as of July 22, 2025. Update as architectural changes are made to maintain accuracy for future AI assistance.