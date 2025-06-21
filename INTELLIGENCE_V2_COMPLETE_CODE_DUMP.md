# MIRA INTELLIGENCE V2 COMPLETE CODE DUMP
## For ChatGPT Analysis and Bulletproofing

### CURRENT PROBLEM:
Intelligence V2 system is not activating properly. Environment flags show as DISABLED despite being set to true in .env. Need comprehensive analysis and bulletproof implementation.

---

## 1. ENVIRONMENT CONFIGURATION (.env)
```bash
# Add any environment variables you need here
# Example: API_KEY=your_api_key_here

# Enable Intelligence-V2 Enhanced Processing
FEATURE_INTELLIGENCE_V2=true
NODE_ENV=development
FEATURE_VECTOR_SEARCH=true
FEATURE_RECURSIVE_REASONING=true
FEATURE_RELATIONSHIP_MAPPING=true
FEATURE_PROACTIVE_DELIVERY=true
FEATURE_ENHANCED_COLLECTIONS=true
FEATURE_ADVANCED_NOTIFICATIONS=true
```

---

## 2. SERVER INDEX (server/index.ts)
```typescript
import express from "express";
import cors from "cors";
import { createViteServer } from "./vite";
import { storage } from "./storage";
import session from "express-session";
import rateLimit from "express-rate-limit";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const app = express();

// Enable CORS
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "https://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// Environment debugging
console.log("Environment check:", { 
  FEATURE_INTELLIGENCE_V2: process.env.FEATURE_INTELLIGENCE_V2,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'present' : 'missing'
});

// Feature flags initialization
const FEATURE_FLAGS = {
  INTELLIGENCE_V2_ENABLED: process.env.FEATURE_INTELLIGENCE_V2 === 'true',
  VECTOR_SEARCH_ENABLED: process.env.FEATURE_VECTOR_SEARCH === 'true',
  RECURSIVE_REASONING_ENABLED: process.env.FEATURE_RECURSIVE_REASONING === 'true',
  RELATIONSHIP_MAPPING_ENABLED: process.env.FEATURE_RELATIONSHIP_MAPPING === 'true',
  PROACTIVE_DELIVERY_ENABLED: process.env.FEATURE_PROACTIVE_DELIVERY === 'true',
  ENHANCED_COLLECTIONS_ENABLED: process.env.FEATURE_ENHANCED_COLLECTIONS === 'true',
  ADVANCED_NOTIFICATIONS_ENABLED: process.env.FEATURE_ADVANCED_NOTIFICATIONS === 'true',
};

console.log('🚩 Feature Flags initialized:', FEATURE_FLAGS);

// Export for use in other modules
export { FEATURE_FLAGS };

if (FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED) {
  console.log('✅ [Bootstrap] Intelligence‑V2 system activated');
} else {
  console.log('❌ [Bootstrap] Intelligence‑V2 disabled by env flag');
}

console.log('🚩 Feature Flags Status:');
Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✅ ENABLED' : '❌ DISABLED'}`);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
const PgSession = ConnectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Import and setup routes
import("./routes").then(({ default: setupRoutes }) => {
  setupRoutes(app, storage);
});

// Initialize collections if needed
async function initializeCollections() {
  const collections = await storage.getCollections();
  if (collections.length === 0) {
    console.log("Standard collections initialized");
    // Default collections are handled in the frontend
  }
}

// Initialize OpenAI Module (NO CLAUDE)
import("./openai").then(({ default: openaiModule }) => {
  console.log("OpenAI module loaded successfully - Claude disabled per user request");
}).catch(error => {
  console.error("Failed to load OpenAI module:", error);
});

// Initialize collections
initializeCollections().catch(console.error);

// Start Vite in development or serve static files in production
createViteServer(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${PORT}`);
  
  // Initialize notification system after server starts
  import("./notifications").then(({ initializeNotificationSystem }) => {
    initializeNotificationSystem().catch(console.error);
  });
});
```

---

## 3. INTELLIGENCE V2 ROUTER (server/intelligence-v2/intelligence-router.ts)
```typescript
import { FEATURE_FLAGS } from "../index";

// Intelligence V2 processing pipeline interface
export interface IntelligenceV2Input {
  content: string;
  mode: "text" | "voice" | "image" | "file";
  noteId?: string;
  context?: {
    previousNotes?: any[];
    userProfile?: any;
    collections?: any[];
  };
}

export interface IntelligenceV2Result {
  // Core analysis
  title: string;
  summary: string;
  intent: string;
  complexity: number;
  confidence: number;
  
  // Enhanced outputs
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  
  suggestedLinks: Array<{
    title: string;
    url: string;
    reasoning: string;
  }>;
  
  nextSteps: string[];
  microQuestions: string[];
  fromTheWeb: Array<{
    title: string;
    snippet: string;
    relevance: number;
  }>;
  
  // Time and scheduling
  timeInstructions: {
    hasTimeReference: boolean;
    extractedTimes: Array<{
      text: string;
      parsedTime: Date | null;
      type: "reminder" | "deadline" | "schedule";
    }>;
    scheduledItems: Array<{
      title: string;
      dueTime: Date;
      category: string;
    }>;
  };
  
  // Processing metadata
  processingPath: "memory" | "commerce";
  classificationScores: Record<string, number>;
  vectorEmbedding?: number[];
  relationshipMappings?: Array<{
    targetNoteId: string;
    relationship: string;
    strength: number;
  }>;
}

/**
 * Main Intelligence V2 Processing Router
 */
export async function processWithIntelligenceV2(
  input: IntelligenceV2Input
): Promise<IntelligenceV2Result> {
  
  if (!FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED) {
    console.log('⚠️ Intelligence V2 disabled, falling back to V1');
    return await fallbackToV1Processing(input);
  }

  console.log('🧠 [Intelligence V2] Processing:', input.content.substring(0, 100) + '...');

  try {
    // Step 1: Fast classification
    const classification = await classifyContent(input);
    console.log('📊 [V2] Classification:', classification);

    // Step 2: Vector analysis (if enabled)
    let vectorEmbedding: number[] | undefined;
    if (FEATURE_FLAGS.VECTOR_SEARCH_ENABLED) {
      vectorEmbedding = await generateVectorEmbedding(input.content);
      console.log('🔢 [V2] Vector embedding generated:', vectorEmbedding ? 'success' : 'failed');
    }

    // Step 3: Enhanced AI processing
    const aiResult = await enhancedAIProcessing(input, classification);
    console.log('🎯 [V2] AI processing complete');

    // Step 4: Relationship mapping (if enabled)
    let relationshipMappings: any[] = [];
    if (FEATURE_FLAGS.RELATIONSHIP_MAPPING_ENABLED && input.context?.previousNotes) {
      relationshipMappings = await mapRelationships(input, input.context.previousNotes);
      console.log('🔗 [V2] Relationship mapping:', relationshipMappings.length, 'connections found');
    }

    // Step 5: Time extraction and scheduling
    const timeInstructions = await extractTimeInstructions(input.content);
    console.log('⏰ [V2] Time analysis:', timeInstructions);

    // Compile final result
    const result: IntelligenceV2Result = {
      title: aiResult.title || input.content.substring(0, 50),
      summary: aiResult.summary || "Processed with Intelligence V2",
      intent: classification.intent,
      complexity: classification.complexity,
      confidence: classification.confidence,
      
      entities: aiResult.entities || [],
      suggestedLinks: aiResult.suggestedLinks || [],
      nextSteps: aiResult.nextSteps || [],
      microQuestions: aiResult.microQuestions || [],
      fromTheWeb: aiResult.fromTheWeb || [],
      
      timeInstructions,
      processingPath: classification.path,
      classificationScores: classification.scores,
      vectorEmbedding,
      relationshipMappings
    };

    console.log('✅ [Intelligence V2] Processing complete:', {
      entities: result.entities.length,
      nextSteps: result.nextSteps.length,
      relationships: result.relationshipMappings?.length || 0
    });

    return result;

  } catch (error) {
    console.error('❌ [Intelligence V2] Processing failed:', error);
    return await fallbackToV1Processing(input);
  }
}

/**
 * Content classification for routing
 */
async function classifyContent(input: IntelligenceV2Input) {
  const content = input.content.toLowerCase();
  
  // Simple classification logic
  const commerceKeywords = ['buy', 'purchase', 'price', 'shop', 'order', 'product'];
  const commerceScore = commerceKeywords.filter(word => content.includes(word)).length;
  
  const intent = commerceScore > 0 ? 'commerce' : 'memory';
  const path = intent === 'commerce' ? 'commerce' : 'memory';
  
  return {
    intent,
    path,
    complexity: Math.min(content.length / 100, 5),
    confidence: 0.8,
    scores: {
      commerce: commerceScore,
      memory: commerceScore === 0 ? 1 : 0
    }
  };
}

/**
 * Generate vector embedding for semantic search
 */
async function generateVectorEmbedding(content: string): Promise<number[]> {
  try {
    // Import OpenAI for embeddings
    const { analyzeWithOpenAI } = await import("../openai");
    
    // Generate a simple numerical representation
    // In a real implementation, this would use OpenAI's embedding API
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    // Simple hash-based embedding simulation
    words.forEach((word, i) => {
      const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      embedding[hash % 384] = (embedding[hash % 384] + 1) / (i + 1);
    });
    
    return embedding;
  } catch (error) {
    console.error('Vector embedding failed:', error);
    return [];
  }
}

/**
 * Enhanced AI processing with structured outputs
 */
async function enhancedAIProcessing(input: IntelligenceV2Input, classification: any) {
  try {
    const { analyzeWithOpenAI } = await import("../openai");
    
    const enhancedPrompt = `
Analyze this content with enhanced Intelligence V2 processing:

CONTENT: "${input.content}"
CLASSIFICATION: ${classification.intent} (confidence: ${classification.confidence})
MODE: ${input.mode}

Provide a comprehensive analysis with:

1. TITLE: Generate a clear, actionable title
2. SUMMARY: 2-3 sentence summary
3. ENTITIES: Extract people, places, organizations, dates, etc.
4. NEXT_STEPS: Suggest 2-3 specific actionable next steps
5. MICRO_QUESTIONS: Generate 1-2 clarifying questions
6. SUGGESTED_LINKS: Relevant web resources (if applicable)

Format as structured data for parsing.
`;

    const result = await analyzeWithOpenAI(enhancedPrompt, 'enhanced-v2');
    
    return {
      title: result.enhancedContent || result.title || input.content.substring(0, 50),
      summary: result.context || result.summary || "Enhanced analysis completed",
      entities: parseEntities(result.rawResponse || ''),
      nextSteps: parseNextSteps(result.rawResponse || ''),
      microQuestions: parseMicroQuestions(result.rawResponse || ''),
      suggestedLinks: [],
      fromTheWeb: []
    };
    
  } catch (error) {
    console.error('Enhanced AI processing failed:', error);
    return {
      title: input.content.substring(0, 50),
      summary: "Processing completed with errors",
      entities: [],
      nextSteps: [],
      microQuestions: [],
      suggestedLinks: [],
      fromTheWeb: []
    };
  }
}

/**
 * Map relationships between notes
 */
async function mapRelationships(input: IntelligenceV2Input, previousNotes: any[]) {
  const relationships = [];
  
  const inputWords = new Set(input.content.toLowerCase().split(/\s+/));
  
  for (const note of previousNotes.slice(0, 10)) { // Limit to recent notes
    const noteWords = new Set(note.content.toLowerCase().split(/\s+/));
    const commonWords = [...inputWords].filter(word => noteWords.has(word));
    
    if (commonWords.length > 2) {
      relationships.push({
        targetNoteId: note.id.toString(),
        relationship: 'semantic_similarity',
        strength: commonWords.length / Math.max(inputWords.size, noteWords.size)
      });
    }
  }
  
  return relationships;
}

/**
 * Extract time instructions and scheduling
 */
async function extractTimeInstructions(content: string) {
  const timePatterns = [
    /tomorrow/i,
    /today/i,
    /next week/i,
    /\d{1,2}:\d{2}\s*(am|pm)?/i,
    /\d{1,2}\/\d{1,2}\/\d{4}/,
    /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i
  ];
  
  const hasTimeReference = timePatterns.some(pattern => pattern.test(content));
  const extractedTimes: any[] = [];
  const scheduledItems: any[] = [];
  
  if (hasTimeReference) {
    // Simple time extraction logic
    const timeMatches = content.match(/\d{1,2}:\d{2}\s*(am|pm)?/gi) || [];
    timeMatches.forEach(match => {
      extractedTimes.push({
        text: match,
        parsedTime: null, // Would parse to actual Date object
        type: "reminder"
      });
    });
  }
  
  return {
    hasTimeReference,
    extractedTimes,
    scheduledItems
  };
}

/**
 * Fallback to V1 processing when V2 fails
 */
async function fallbackToV1Processing(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
  console.log('⬇️ [Fallback] Using V1 processing for:', input.content.substring(0, 50));
  
  return {
    title: input.content.substring(0, 50),
    summary: "Note processed successfully",
    intent: "general",
    complexity: 2,
    confidence: 0.7,
    
    entities: [],
    suggestedLinks: [],
    nextSteps: [],
    microQuestions: [],
    fromTheWeb: [],
    
    timeInstructions: {
      hasTimeReference: false,
      extractedTimes: [],
      scheduledItems: []
    },
    
    processingPath: "memory",
    classificationScores: { memory: 1 }
  };
}

// Helper parsing functions
function parseEntities(text: string): Array<{type: string, value: string, confidence: number}> {
  // Simple entity extraction
  const entities = [];
  
  // Extract potential names (capitalized words)
  const names = text.match(/\b[A-Z][a-z]+\b/g) || [];
  names.forEach(name => {
    entities.push({ type: 'person', value: name, confidence: 0.6 });
  });
  
  return entities;
}

function parseNextSteps(text: string): string[] {
  // Extract action items
  const actionWords = ['call', 'email', 'schedule', 'book', 'buy', 'research', 'contact'];
  const steps = [];
  
  const sentences = text.split(/[.!?]+/);
  sentences.forEach(sentence => {
    if (actionWords.some(word => sentence.toLowerCase().includes(word))) {
      steps.push(sentence.trim());
    }
  });
  
  return steps.slice(0, 3); // Max 3 steps
}

function parseMicroQuestions(text: string): string[] {
  // Generate clarifying questions
  const questions = [];
  
  if (text.includes('meeting')) {
    questions.push('What time works best for the meeting?');
  }
  if (text.includes('buy') || text.includes('purchase')) {
    questions.push('What\'s your budget for this purchase?');
  }
  
  return questions.slice(0, 2); // Max 2 questions
}
```

---

## 4. MAIN AI PROCESSING (server/brain/miraAIProcessing.ts)
```typescript
/**
 * MIRA AI BRAIN - Processing Engine for Intelligent Note Handling
 * Enhanced with Intelligence-V2 Integration
 */

import { FEATURE_FLAGS } from "../index";

export interface MiraAIInput {
  id?: string;
  content: string;
  mode: "text" | "voice" | "image" | "file";
  req?: any;
  imageData?: string;
  locale?: string;
  timestamp?: string;
  userId?: string;
  context?: {
    source?: string;
    location?: LocationContext;
    previousConversation?: ConversationContext;
  };
}

export interface MiraAIResult {
  id: string;
  title: string;
  summary: string;
  enhancedContent: string;
  intent: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  hasTimeReference: boolean;
  todos: ProcessedTodo[];
  smartActions: SmartAction[];
  entities: Entity[];
  suggestedLinks: Link[];
  nextSteps: string[];
  microQuestions: string[];
  fromTheWeb: WebResult[];
  tags: string[];
  relatedTopics: string[];
  confidence: number;
  processingPath: 'memory' | 'commerce';
  timestamp: string;
  classificationScores: Record<string, number>;
}

interface ProcessedTodo {
  title: string;
  priority: 'low' | 'medium' | 'high';
  due?: Date;
  category?: string;
}

interface SmartAction {
  type: string;
  title: string;
  data: any;
}

interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface Link {
  title: string;
  url: string;
  reasoning: string;
}

interface WebResult {
  title: string;
  snippet: string;
  relevance: number;
}

interface LocationContext {
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface ConversationContext {
  previousMessages?: string[];
  topic?: string;
}

/**
 * Main processing function with Intelligence V2 integration
 */
export async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  console.log('🧠 [Mira AI] Processing note with V2 intelligence:', input.content.substring(0, 100));
  
  try {
    // Check if Intelligence V2 is enabled
    if (FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED) {
      console.log('🚀 [Mira AI] Using Intelligence V2 processing');
      return await processWithIntelligenceV2(input);
    } else {
      console.log('⚠️ [Mira AI] V2 disabled, using standard processing');
      return await processWithStandardMethod(input);
    }
  } catch (error) {
    console.error('❌ [Mira AI] Processing failed:', error);
    return await generateFallbackResult(input);
  }
}

/**
 * Intelligence V2 processing pathway
 */
async function processWithIntelligenceV2(input: MiraAIInput): Promise<MiraAIResult> {
  try {
    const { processWithIntelligenceV2: v2Process } = await import("../intelligence-v2/intelligence-router");
    
    const v2Input = {
      content: input.content,
      mode: input.mode,
      noteId: input.id,
      context: {
        previousNotes: [], // Would load from database
        userProfile: null, // Would load user profile
        collections: [] // Would load collections
      }
    };
    
    const v2Result = await v2Process(v2Input);
    console.log('✅ [V2] Intelligence processing complete');
    
    // Convert V2 result to Mira format
    return {
      id: input.id || generateId(),
      title: v2Result.title,
      summary: v2Result.summary,
      enhancedContent: input.content, // Keep original content
      intent: v2Result.intent,
      urgency: mapComplexityToUrgency(v2Result.complexity),
      complexity: v2Result.complexity,
      hasTimeReference: v2Result.timeInstructions.hasTimeReference,
      todos: convertToProcessedTodos(v2Result.timeInstructions.scheduledItems),
      smartActions: generateSmartActions(v2Result),
      entities: v2Result.entities,
      suggestedLinks: v2Result.suggestedLinks,
      nextSteps: v2Result.nextSteps,
      microQuestions: v2Result.microQuestions,
      fromTheWeb: v2Result.fromTheWeb,
      tags: extractTags(input.content),
      relatedTopics: extractRelatedTopics(input.content),
      confidence: v2Result.confidence,
      processingPath: v2Result.processingPath,
      timestamp: new Date().toISOString(),
      classificationScores: v2Result.classificationScores
    };
    
  } catch (error) {
    console.error('❌ [V2] Intelligence processing failed:', error);
    return await processWithStandardMethod(input);
  }
}

/**
 * Standard processing method (V1)
 */
async function processWithStandardMethod(input: MiraAIInput): Promise<MiraAIResult> {
  console.log('🔄 [Mira AI] Using standard processing method');
  
  try {
    const { analyzeWithOpenAI } = await import("../openai");
    
    const prompt = `Analyze this content: "${input.content}"
    
Provide:
1. A clear title
2. Brief summary
3. Key insights
4. Any action items
5. Urgency level (low/medium/high)`;

    const result = await analyzeWithOpenAI(prompt, 'standard');
    
    return {
      id: input.id || generateId(),
      title: result.enhancedContent || extractTitle(input.content),
      summary: result.context || "Note processed successfully",
      enhancedContent: input.content,
      intent: classifyIntent(input.content),
      urgency: determineUrgency(input.content),
      complexity: calculateComplexity(input.content),
      hasTimeReference: detectTimeReference(input.content),
      todos: extractTodos(input.content),
      smartActions: [],
      entities: [],
      suggestedLinks: [],
      nextSteps: [],
      microQuestions: [],
      fromTheWeb: [],
      tags: extractTags(input.content),
      relatedTopics: [],
      confidence: 0.8,
      processingPath: 'memory',
      timestamp: new Date().toISOString(),
      classificationScores: { memory: 1 }
    };
    
  } catch (error) {
    console.error('❌ [Standard] Processing failed:', error);
    return await generateFallbackResult(input);
  }
}

/**
 * Generate fallback result when all processing fails
 */
async function generateFallbackResult(input: MiraAIInput): Promise<MiraAIResult> {
  console.log('🆘 [Fallback] Generating minimal result');
  
  return {
    id: input.id || generateId(),
    title: extractTitle(input.content),
    summary: "Note saved successfully",
    enhancedContent: input.content,
    intent: "general",
    urgency: "medium",
    complexity: 2,
    hasTimeReference: false,
    todos: [],
    smartActions: [],
    entities: [],
    suggestedLinks: [],
    nextSteps: [],
    microQuestions: [],
    fromTheWeb: [],
    tags: [],
    relatedTopics: [],
    confidence: 0.5,
    processingPath: "memory",
    timestamp: new Date().toISOString(),
    classificationScores: { memory: 1 }
  };
}

// Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
}

function classifyIntent(content: string): string {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('buy') || lowerContent.includes('purchase')) return 'commerce';
  if (lowerContent.includes('remind') || lowerContent.includes('schedule')) return 'reminder';
  return 'note';
}

function determineUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
  const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
  const lowerContent = content.toLowerCase();
  
  if (urgentWords.some(word => lowerContent.includes(word))) return 'high';
  if (lowerContent.includes('today') || lowerContent.includes('now')) return 'medium';
  return 'low';
}

function calculateComplexity(content: string): number {
  return Math.min(Math.floor(content.length / 100) + 1, 5);
}

function detectTimeReference(content: string): boolean {
  const timePatterns = [
    /tomorrow/i, /today/i, /tonight/i,
    /\d{1,2}:\d{2}/,
    /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i,
    /\d{1,2}\/\d{1,2}/
  ];
  return timePatterns.some(pattern => pattern.test(content));
}

function extractTodos(content: string): ProcessedTodo[] {
  const todos: ProcessedTodo[] = [];
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      todos.push({
        title: trimmed.substring(2),
        priority: 'medium'
      });
    }
  });
  
  return todos;
}

function extractTags(content: string): string[] {
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  // Simple tag extraction based on keywords
  if (lowerContent.includes('work') || lowerContent.includes('office')) tags.push('work');
  if (lowerContent.includes('personal') || lowerContent.includes('family')) tags.push('personal');
  if (lowerContent.includes('health') || lowerContent.includes('medical')) tags.push('health');
  if (lowerContent.includes('finance') || lowerContent.includes('money')) tags.push('finance');
  
  return tags;
}

function extractRelatedTopics(content: string): string[] {
  // Simple topic extraction
  const topics = [];
  const words = content.toLowerCase().split(/\s+/);
  
  if (words.includes('meeting')) topics.push('meetings');
  if (words.includes('project')) topics.push('projects');
  if (words.includes('appointment')) topics.push('appointments');
  
  return topics;
}

function mapComplexityToUrgency(complexity: number): 'low' | 'medium' | 'high' | 'critical' {
  if (complexity >= 4) return 'high';
  if (complexity >= 3) return 'medium';
  return 'low';
}

function convertToProcessedTodos(scheduledItems: any[]): ProcessedTodo[] {
  return scheduledItems.map(item => ({
    title: item.title,
    priority: 'medium',
    due: item.dueTime,
    category: item.category
  }));
}

function generateSmartActions(v2Result: any): SmartAction[] {
  const actions: SmartAction[] = [];
  
  if (v2Result.timeInstructions.hasTimeReference) {
    actions.push({
      type: 'reminder',
      title: 'Set reminder',
      data: { time: v2Result.timeInstructions.extractedTimes[0] }
    });
  }
  
  if (v2Result.suggestedLinks.length > 0) {
    actions.push({
      type: 'research',
      title: 'Research links',
      data: { links: v2Result.suggestedLinks }
    });
  }
  
  return actions;
}
```

---

## 5. ROUTES INTEGRATION (server/routes.ts - Key V2 Integration Points)
```typescript
// Key section from routes.ts showing V2 integration
import { FEATURE_FLAGS } from "./index";

export default function setupRoutes(app: Express, storage: IStorage) {
  
  // Note creation with V2 processing
  app.post("/api/notes", async (req, res) => {
    try {
      const { content, mode = "text", imageData } = req.body;
      
      console.log('📝 Creating note with V2 processing:', content.substring(0, 100));
      
      // Create note first
      const note = await storage.createNote({
        content,
        mode,
        imageData,
        isProcessing: true
      });
      
      res.json(note);
      
      // Process with V2 intelligence
      if (FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED) {
        console.log('🚀 [Routes] Using Intelligence V2 for note processing');
        
        try {
          const { processWithIntelligenceV2 } = await import("./intelligence-v2/intelligence-router");
          
          const v2Input = {
            content,
            mode,
            noteId: note.id.toString(),
            context: {
              previousNotes: await storage.getNotes(),
              collections: await storage.getCollections()
            }
          };
          
          const v2Result = await processWithIntelligenceV2(v2Input);
          console.log('✅ [V2] Processing complete:', v2Result.title);
          
          // Map V2 result to database format
          const updateData = {
            aiGeneratedTitle: v2Result.title,
            aiEnhanced: true,
            aiSuggestion: v2Result.summary,
            aiContext: v2Result.summary,
            richContext: JSON.stringify({
              entities: v2Result.entities,
              suggestedLinks: v2Result.suggestedLinks,
              nextSteps: v2Result.nextSteps,
              microQuestions: v2Result.microQuestions,
              fromTheWeb: v2Result.fromTheWeb,
              timeInstructions: v2Result.timeInstructions
            }),
            processingPath: v2Result.processingPath,
            classificationScores: v2Result.classificationScores,
            isProcessing: false
          };
          
          await storage.updateNote(note.id, updateData);
          console.log('✅ [V2] Note updated with intelligence data');
          
          // Create todos from V2 results
          if (v2Result.timeInstructions.scheduledItems.length > 0) {
            for (const item of v2Result.timeInstructions.scheduledItems) {
              await storage.createTodo({
                title: item.title,
                noteId: note.id,
                timeDue: item.dueTime,
                priority: 'medium',
                isActiveReminder: true
              });
            }
          }
          
        } catch (v2Error) {
          console.error('❌ [V2] Processing failed, falling back:', v2Error);
          await fallbackProcessing(note, storage);
        }
        
      } else {
        console.log('⚠️ [Routes] V2 disabled, using fallback processing');
        await fallbackProcessing(note, storage);
      }
      
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Fallback processing function
  async function fallbackProcessing(note: any, storage: IStorage) {
    try {
      const { processNote } = await import("./brain/miraAIProcessing");
      
      const aiResult = await processNote({
        id: note.id.toString(),
        content: note.content,
        mode: note.mode
      });
      
      await storage.updateNote(note.id, {
        aiGeneratedTitle: aiResult.title,
        aiEnhanced: true,
        aiSuggestion: aiResult.summary,
        aiContext: aiResult.summary,
        isProcessing: false
      });
      
      // Create todos from AI result
      for (const todo of aiResult.todos) {
        await storage.createTodo({
          title: todo.title,
          noteId: note.id,
          priority: todo.priority,
          timeDue: todo.due
        });
      }
      
    } catch (error) {
      console.error('Fallback processing failed:', error);
    }
  }
}
```

---

## 6. DATABASE SCHEMA (shared/schema.ts - V2 Fields)
```typescript
// Key V2-related fields in the notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  aiGeneratedTitle: text("ai_generated_title"),
  mode: text("mode").notNull(),
  // ... other fields ...
  
  // Intelligence-v2: Vector storage for semantic search
  vectorDense: text("vector_dense"), // Dense vector embedding array format: [0.1,0.2,...]
  vectorSparse: text("vector_sparse"), // Sparse vector as JSON string
  intentVector: json("intent_vector").$type<{
    categories: Record<string, number>;
    confidence: number;
    reasoning: string;
  }>(),
  
  // Version control and data protection
  version: integer("version").default(1).notNull(),
  originalContent: text("original_content"), // Preserve original user input
  lastUserEdit: timestamp("last_user_edit").defaultNow(), // Track manual edits
  protectedContent: json("protected_content").$type<{
    userSections: string[]; // Content sections that should be preserved
    manualEdits: { timestamp: Date; content: string; }[];
    aiModifications: { timestamp: Date; type: string; description: string; }[];
  }>(),
  
  // Orthogonal AI upgrade metadata
  processingPath: text("processing_path"), // 'commerce' | 'memory'
  classificationScores: json("classification_scores").$type<Record<string, number>>(),
});
```

---

## 7. PACKAGE.JSON DEPENDENCIES
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.7",
    "@neondatabase/serverless": "^0.9.3",
    "@replit/object-storage": "^1.1.0",
    "drizzle-orm": "^0.30.10",
    "drizzle-zod": "^0.5.1",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.1",
    "openai": "^4.47.3",
    "postgres": "^3.4.4",
    "tsx": "^4.7.2",
    "typescript": "^5.4.5",
    "zod": "^3.23.8"
  }
}
```

---

## 8. CURRENT ERROR LOGS AND DEBUGGING INFO
```
Environment check: { FEATURE_INTELLIGENCE_V2: undefined, OPENAI_API_KEY: 'present' }
🚩 Feature Flags initialized: {
  INTELLIGENCE_V2_ENABLED: false,
  VECTOR_SEARCH_ENABLED: false,
  RECURSIVE_REASONING_ENABLED: false,
  RELATIONSHIP_MAPPING_ENABLED: false,
  PROACTIVE_DELIVERY_ENABLED: false,
  ENHANCED_COLLECTIONS_ENABLED: false,
  ADVANCED_NOTIFICATIONS_ENABLED: false
}
❌ [Bootstrap] Intelligence‑V2 disabled by env flag
```

---

## 9. FRONTEND NOTE CARD COMPONENT (client/src/components/note-card.tsx - Key V2 Display Logic)
```typescript
// Key section showing how V2 data should be displayed
export default function NoteCard({ note, onTodoModalClose }: NoteCardProps) {
  // Parse rich context from V2 processing
  let richContextData: any = null;
  try {
    if (note.richContext) {
      richContextData = JSON.parse(note.richContext);
    }
  } catch (error) {
    console.log('Failed to parse rich context:', error);
  }

  // Display V2 enhanced content
  return (
    <div className="note-card">
      {/* Enhanced AI Analysis Display */}
      {note.aiContext && note.aiContext !== "Enhanced AI analysis completed" && (
        <div className="mb-2">
          <div className="flex items-center space-x-1 mb-1">
            <Zap className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">AI Analysis</span>
          </div>
          <p className="text-xs text-[hsl(var(--foreground))] bg-blue-50 p-2 rounded-md line-clamp-2">
            {note.aiContext}
          </p>
        </div>
      )}

      {/* V2 Rich Context Display */}
      {richContextData?.entities && richContextData.entities.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Entities:</div>
          <div className="flex flex-wrap gap-1">
            {richContextData.entities.slice(0, 3).map((entity: any, index: number) => (
              <span key={index} className="text-xs px-2 py-1 bg-gray-100 rounded">
                {entity.type}: {entity.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps from V2 */}
      {richContextData?.nextSteps && richContextData.nextSteps.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Next Steps:</div>
          {richContextData.nextSteps.slice(0, 2).map((step: string, index: number) => (
            <div key={index} className="text-xs text-blue-600 mb-1">• {step}</div>
          ))}
        </div>
      )}

      {/* Processing Path Indicator */}
      {note.processingPath && (
        <div className="text-xs text-gray-500 mt-2">
          Processed via: {note.processingPath} path
        </div>
      )}
    </div>
  );
}
```

---

## ANALYSIS REQUEST FOR CHATGPT:

**Please analyze this complete codebase and provide specific fixes for:**

1. **Why are the environment variables not being read properly?** The .env file has `FEATURE_INTELLIGENCE_V2=true` but the server logs show `FEATURE_INTELLIGENCE_V2: undefined`

2. **How to make the Intelligence V2 system bulletproof and always activate when enabled?**

3. **What specific code changes are needed to ensure V2 processing works end-to-end?**

4. **Are there any import/export issues preventing the V2 system from loading?**

5. **How to properly integrate the V2 results into the database and frontend display?**

**Requirements:**
- V2 system must activate when environment flag is true
- Enhanced AI analysis with entities, next steps, micro-questions
- Rich context display in frontend note cards
- Proper fallback to V1 when V2 fails
- Vector embeddings and relationship mapping when enabled

**Please provide specific, implementable code fixes for each file that needs modification.**