# Mira - Intelligent AI Memory Assistant
## Comprehensive Product Documentation

### Table of Contents
1. [Product Vision & Mission](#product-vision--mission)
2. [Core Architecture](#core-architecture)
3. [AI Intelligence Framework](#ai-intelligence-framework)
4. [Feature Implementation](#feature-implementation)
5. [Technical Infrastructure](#technical-infrastructure)
6. [User Experience Design](#user-experience-design)
7. [Development Progress](#development-progress)
8. [Known Issues & Solutions](#known-issues--solutions)

---

## Product Vision & Mission

### Core Purpose
Mira transforms how humans capture, process, and organize information by leveraging advanced AI to create an intelligent memory extension. Unlike traditional note-taking apps, Mira understands context, predicts needs, and actively assists with task completion.

### Target Users
- **Knowledge Workers**: Professionals managing complex projects and research
- **Students**: Academic note-taking with AI-powered study assistance
- **Creatives**: Content creators organizing ideas and inspiration
- **Busy Professionals**: Quick capture with intelligent organization

### Unique Value Propositions
1. **Multimodal Intelligence**: Process text, voice, images, and documents with contextual understanding
2. **Predictive Assistance**: AI anticipates next steps and suggests relevant actions
3. **Offline-First Architecture**: Full functionality without internet dependency
4. **Contextual Organization**: Smart collections based on content analysis
5. **Progressive Intelligence**: Learns user patterns and improves over time

---

## Core Architecture

### Technology Stack
```
Frontend: React 18 + TypeScript + Tailwind CSS
Backend: Express.js + Node.js
Database: PostgreSQL + Drizzle ORM
AI Services: OpenAI GPT-4o + Claude Sonnet 4
Storage: IndexedDB (offline) + PostgreSQL (sync)
Build: Vite (current) / Next.js (proposed migration)
PWA: Service Workers + Manifest
```

### Architectural Principles
1. **Offline-First**: Core functionality works without internet
2. **Progressive Enhancement**: Features gracefully degrade
3. **Mobile-First**: Optimized for mobile capture scenarios
4. **Error Resilience**: Comprehensive error boundaries and recovery
5. **Performance**: Sub-200ms response times for core interactions

### Data Flow Architecture
```
User Input → Capture Layer → AI Processing → Storage → Sync → UI Update
    ↓
Offline Queue → Background Sync → Conflict Resolution → State Update
```

---

## AI Intelligence Framework

### Multi-Model Strategy
Mira employs a sophisticated dual-AI approach leveraging the strengths of both OpenAI and Claude:

#### OpenAI GPT-4o Implementation
```typescript
// Primary use cases: Creative content, image analysis, general intelligence
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeNote(content: string, mode: string): Promise<AIAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // Latest model as of May 2024
    messages: [
      {
        role: "system",
        content: `You are Mira, an intelligent memory assistant. Analyze this content for:
        1. Complexity scoring (1-10 scale)
        2. Intent classification (simple-task, complex-project, research-inquiry, etc.)
        3. Urgency assessment (low, medium, high, critical)
        4. Todo extraction with hierarchical structure
        5. Collection suggestion with appropriate categorization
        6. Predictive next steps and success factors
        
        Provide response in structured JSON format.`
      },
      { role: "user", content: `Mode: ${mode}\nContent: ${content}` }
    ],
    response_format: { type: "json_object" }
  });
}
```

#### Claude Sonnet 4 Implementation
```typescript
// Primary use cases: Deep analysis, research, contextual understanding
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function enhancedAnalysis(content: string): Promise<AIAnalysisResult> {
  const message = await anthropic.messages.create({
    max_tokens: 2048,
    messages: [{ 
      role: 'user', 
      content: `As Mira's deep intelligence engine, provide comprehensive analysis including:
      - Taxonomical categorization using advanced pattern recognition
      - Contextual micro-questions for deeper exploration
      - Knowledge connections and skill requirements
      - Predictive obstacle identification
      - Resource recommendations with confidence scoring
      
      Content: ${content}` 
    }],
    model: 'claude-sonnet-4-20250514', // Latest model post-knowledge cutoff
  });
}
```

### AI Taxonomy Engine
Advanced pattern recognition system for content categorization:

```typescript
export const AI_TAXONOMY_PATTERNS = {
  LEARNING: {
    keywords: ['learn', 'study', 'understand', 'research', 'explore'],
    microQuestions: [
      'What specific skills need development?',
      'What resources would accelerate learning?',
      'How will you measure progress?'
    ],
    confidence: 0.85
  },
  PROJECT_MANAGEMENT: {
    keywords: ['project', 'deadline', 'milestone', 'deliverable', 'timeline'],
    microQuestions: [
      'What are the critical path dependencies?',
      'Who are the key stakeholders?',
      'What risks could derail this project?'
    ],
    confidence: 0.90
  },
  CREATIVE_WORK: {
    keywords: ['design', 'create', 'brainstorm', 'concept', 'inspiration'],
    microQuestions: [
      'What creative constraints exist?',
      'How will you validate creative decisions?',
      'What references inspire this direction?'
    ],
    confidence: 0.88
  }
};
```

### Intelligent Prompting Strategy

#### Complexity Analysis Prompt
```
You are analyzing content for complexity and intent. Consider:

COMPLEXITY SCORING (1-10):
- 1-3: Simple tasks, quick captures, basic reminders
- 4-6: Multi-step processes, moderate planning required
- 7-10: Complex projects, extensive research, long-term commitment

INTENT CLASSIFICATION:
- simple-task: Single action items, quick todos
- complex-project: Multi-phase work with dependencies
- research-inquiry: Information gathering and analysis
- personal-reflection: Thoughts, ideas, journaling
- reference-material: Facts, data, documentation

URGENCY ASSESSMENT:
- critical: Immediate action required (deadlines, emergencies)
- high: Important with time sensitivity
- medium: Scheduled work, planned activities
- low: Future considerations, nice-to-have items
```

#### Predictive Intelligence Prompt
```
As Mira's predictive engine, analyze this content for:

NEXT STEPS PREDICTION:
- What are the logical next actions?
- What preparation is needed before starting?
- What decisions need to be made first?

SUCCESS FACTOR ANALYSIS:
- What conditions increase likelihood of success?
- What skills or knowledge gaps exist?
- What resources would accelerate progress?

OBSTACLE ANTICIPATION:
- What common failure points exist for this type of work?
- What external dependencies could cause delays?
- What personal patterns might interfere?

TIME ESTIMATION:
- Realistic time requirements for completion
- Breakdown by phases or milestones
- Buffer time for unexpected challenges
```

### AI Response Processing
```typescript
export interface AIAnalysisResult {
  // Core Analysis
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  
  // Complexity Framework
  complexityScore: number; // 1-10 scale
  intentType: 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Task Intelligence
  todos: string[];
  taskHierarchy?: {
    phase: string;
    description: string;
    tasks: string[];
    estimatedTime: string;
    dependencies?: string[];
  }[];
  
  // Organizational Intelligence
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  
  // Contextual Intelligence
  richContext?: {
    recommendedActions: {
      title: string;
      description: string;
      links?: { title: string; url: string }[];
    }[];
    researchResults: {
      title: string;
      description: string;
      rating?: string;
      keyPoints: string[];
      contact?: string;
    }[];
    quickInsights: string[];
  };
  
  // Predictive Intelligence
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  
  // Knowledge Framework
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
  
  // Content Splitting for Complex Input
  splitNotes?: {
    content: string;
    todos: string[];
    collectionSuggestion?: {
      name: string;
      icon: string;
      color: string;
    };
  }[];
}
```

---

## Feature Implementation

### Multimodal Capture System

#### Text Input
- **Floating Input Bar**: Always accessible, context-aware
- **Full-Screen Capture**: Distraction-free writing mode
- **Smart Formatting**: AI-powered content enhancement

#### Voice Processing
```typescript
// Advanced voice transcription with context awareness
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioBuffer,
    model: "whisper-1",
    language: "en", // Auto-detect in production
    prompt: "This is a note capture for Mira, an AI memory assistant. The user may be capturing ideas, tasks, or information."
  });
  
  return transcription.text;
}
```

#### Visual Intelligence
- **Camera Capture**: Instant photo-to-text extraction
- **Document Analysis**: PDF, image, and file processing
- **Context Recognition**: Scene understanding and content extraction

### Smart Organization System

#### Collections Framework
```typescript
export const STANDARD_COLLECTIONS = [
  {
    name: "Inbox",
    icon: "📥",
    color: "#64748b", // slate-500
    description: "Unprocessed captures and quick notes"
  },
  {
    name: "Personal",
    icon: "👤",
    color: "#8b5cf6", // violet-500
    description: "Personal projects, goals, and reflections"
  },
  {
    name: "Work",
    icon: "💼", 
    color: "#06b6d4", // cyan-500
    description: "Professional tasks and work-related content"
  },
  {
    name: "To-do's",
    icon: "✅",
    color: "#10b981", // emerald-500
    description: "Action items and task management"
  }
];
```

#### AI-Powered Auto-Categorization
```typescript
export async function suggestCollection(content: string): Promise<CollectionSuggestion> {
  const analysis = await analyzeNote(content, "categorization");
  
  // Machine learning-based classification
  const contentVector = await generateEmbedding(content);
  const similarity = await compareWithExistingCollections(contentVector);
  
  return {
    name: analysis.collectionSuggestion?.name || "Inbox",
    icon: analysis.collectionSuggestion?.icon || "📝",
    color: analysis.collectionSuggestion?.color || "#64748b",
    confidence: similarity.confidence
  };
}
```

### Task Intelligence System

#### Todo Extraction & Hierarchy
```typescript
// Advanced todo extraction with dependency mapping
export async function extractTodos(content: string): Promise<TaskHierarchy> {
  const prompt = `
  Extract actionable tasks from this content. For each task:
  1. Identify dependencies (what must happen first)
  2. Estimate time requirements
  3. Determine priority level
  4. Suggest optimal sequencing
  
  Content: ${content}
  `;
  
  const response = await analyzeWithClaude(prompt);
  return processTaskHierarchy(response);
}
```

#### Smart Scheduling
- **Time Estimation**: AI-powered duration predictions
- **Dependency Mapping**: Automatic task sequencing
- **Context Switching**: Optimal task grouping by context

---

## Technical Infrastructure

### Offline-First Architecture

#### State Management with Zustand
```typescript
interface AppState {
  // Online/Offline status
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  
  // Core data
  notes: NoteWithTodos[];
  todos: Todo[];
  collections: Collection[];
  
  // UI state
  activeView: 'activity' | 'todos' | 'collections' | 'settings';
  captureMode: 'text' | 'voice' | 'camera' | null;
  
  // Sync queue
  pendingChanges: PendingChange[];
  conflictResolution: ConflictItem[];
}
```

#### IndexedDB Integration
```typescript
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MiraDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Notes store
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('collectionId', 'collectionId', { unique: false });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        
        // Sync queue store
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      };
    });
  }
}
```

#### Conflict Resolution Strategy
```typescript
export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'user-choice';
  clientVersion: any;
  serverVersion: any;
  resolvedVersion?: any;
  timestamp: number;
}

export async function resolveConflict(conflict: ConflictItem): Promise<ConflictResolution> {
  // Smart merge strategy based on content type
  if (conflict.type === 'note') {
    return await mergeNoteConflict(conflict);
  } else if (conflict.type === 'todo') {
    return await mergeTodoConflict(conflict);
  }
  
  // Default to user choice for complex conflicts
  return { strategy: 'user-choice', ...conflict };
}
```

### Error Resilience Framework

#### Feature-Level Error Boundaries
```typescript
export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  private maxRetries = 3;
  
  static getDerivedStateFromError(error: Error): Partial<FeatureErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error tracking service
    console.error(`Feature ${this.props.featureName} error:`, error, errorInfo);
    
    // Attempt automatic recovery for known issues
    if (error.message.includes('Network')) {
      this.scheduleRetry();
    }
  }
  
  private scheduleRetry = () => {
    setTimeout(() => {
      if (this.state.retryCount < this.maxRetries) {
        this.setState({ 
          hasError: false, 
          error: undefined,
          retryCount: this.state.retryCount + 1 
        });
      }
    }, 1000 * Math.pow(2, this.state.retryCount)); // Exponential backoff
  };
}
```

#### Graceful Degradation
```typescript
export function withFallback<T>(
  primaryFunction: () => Promise<T>,
  fallbackFunction: () => T,
  errorMessage: string
): Promise<T> {
  return primaryFunction().catch((error) => {
    console.warn(`${errorMessage}:`, error);
    return fallbackFunction();
  });
}

// Usage example
const aiAnalysis = await withFallback(
  () => analyzeWithAI(content),
  () => ({ todos: [], collectionSuggestion: null }), // Basic fallback
  "AI analysis failed, using basic extraction"
);
```

### Performance Optimization

#### React Query Integration
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.message.includes('40')) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global error handling
        console.error('Mutation error:', error);
      },
    },
  },
});
```

#### Service Worker Implementation
```typescript
// Progressive caching strategy
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open('api-cache').then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

---

## User Experience Design

### Mobile-First Interface
- **Touch-Optimized**: All interactions designed for mobile use
- **Thumb-Friendly**: Critical actions within thumb reach
- **Gesture Support**: Swipe actions for common tasks
- **Voice-First**: Hands-free operation prioritized

### Progressive Web App Features
```json
{
  "name": "Mira - AI Memory Assistant",
  "short_name": "Mira",
  "description": "Your trusted memory. AI-powered note capture, voice processing, and smart organization.",
  "theme_color": "#007AFF",
  "background_color": "#F5F7FA",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Accessibility Implementation
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Dark mode and accessibility themes
- **Voice Commands**: Speech-to-text integration

---

## Development Progress

### Completed Features ✅
1. **Core Architecture**
   - Offline-first state management with Zustand
   - IndexedDB integration for local storage
   - Error boundary implementation
   - Progressive Web App setup

2. **AI Intelligence Framework**
   - Dual-model AI implementation (OpenAI + Claude)
   - Advanced taxonomy engine
   - Complexity analysis and intent classification
   - Predictive intelligence system

3. **Multimodal Capture**
   - Text input with AI enhancement
   - Voice transcription and processing
   - Camera capture integration
   - File upload handling

4. **Smart Organization**
   - Collection-based organization
   - AI-powered categorization
   - Todo extraction and hierarchy
   - Context-aware suggestions

5. **Data Management**
   - PostgreSQL schema with Drizzle ORM
   - Conflict resolution strategies
   - Background synchronization
   - Data integrity safeguards

### In Progress 🔄
1. **Build System Optimization**
   - Vite routing conflict resolution
   - Alternative build system evaluation
   - Performance optimization

2. **Enhanced AI Features**
   - Context learning from user patterns
   - Improved prediction accuracy
   - Advanced research capabilities

### Planned Features 📋
1. **Collaboration**
   - Shared collections
   - Real-time collaboration
   - Permission management

2. **Advanced Intelligence**
   - Learning from user behavior
   - Predictive scheduling
   - Smart notifications

3. **Platform Expansion**
   - Desktop applications
   - Browser extensions
   - API for third-party integrations

---

## Known Issues & Solutions

### Current Critical Issue: Vite Routing Conflict

**Problem**: Express catch-all route intercepting Vite JavaScript module requests
**Impact**: React app fails to initialize due to MIME type mismatches
**Status**: Requires build system migration or deep middleware restructuring

**Attempted Solutions**:
1. Middleware reordering - Failed
2. Static file serving for Vite assets - Failed
3. Custom route bypass logic - Failed
4. Alternative Express configurations - Failed

**Recommended Solution**: Migration to Next.js or Remix for better full-stack integration

### Performance Considerations
1. **AI Request Optimization**: Implement request batching and caching
2. **Offline Sync Efficiency**: Optimize sync queue processing
3. **Mobile Performance**: Bundle size optimization and lazy loading

### Security Considerations
1. **API Key Management**: Secure environment variable handling
2. **Data Encryption**: Client-side encryption for sensitive notes
3. **Authentication**: Replit Auth integration for user management

---

## Future Roadmap

### Phase 1: Stability & Performance (Current)
- Resolve build system issues
- Optimize AI request handling
- Improve offline capabilities

### Phase 2: Enhanced Intelligence (Next 3 months)
- Advanced learning algorithms
- Contextual micro-questions
- Predictive task scheduling

### Phase 3: Collaboration & Sharing (6 months)
- Multi-user support
- Shared collections
- Team productivity features

### Phase 4: Platform Expansion (12 months)
- Desktop applications
- Browser extensions
- Third-party integrations

---

## Technical Architecture Diagrams

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Capture Layer  │───▶│  AI Processing  │
│  (Multi-modal)  │    │   (React PWA)   │    │ (OpenAI/Claude) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Offline Storage │◀───│  State Manager  │◀───│   API Layer     │
│   (IndexedDB)   │    │   (Zustand)     │    │   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Sync Manager   │───▶│   Database      │───▶│   Cloud Sync    │
│ (Background)    │    │ (PostgreSQL)    │    │  (Real-time)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture
```
User Input ──┐
             ├─▶ Validation ──▶ AI Analysis ──▶ Enhancement ──┐
File Upload ─┘                                                ├─▶ Storage
                                                              │
Offline Queue ◀── Conflict Resolution ◀── Sync Manager ◀─────┘
     │
     ▼
IndexedDB ──▶ Background Sync ──▶ PostgreSQL ──▶ Real-time Updates
```

This comprehensive documentation provides ChatGPT with complete context about Mira's architecture, AI implementation strategy, and current development status for informed consultation and future development guidance.