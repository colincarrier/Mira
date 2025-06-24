# MIRA AI Memory Assistant - Complete Code Dump for ChatGPT o3-Pro Analysis

## Project Overview
Mira is a sophisticated AI-powered memory and productivity assistant built with React + TypeScript frontend, Express.js backend, PostgreSQL database, and OpenAI GPT-4o integration. The system features multi-modal input processing (text, voice, image), intelligent organization, and advanced AI processing through Intelligence-V2 architecture.

## Current Status
- **System State**: Fully operational after git restore from 2 hours ago
- **AI Processing**: Intelligence-V2 router properly initialized with OpenAI integration
- **Known Issue**: Text notes created but `aiEnhanced: false` and no AI processing completion
- **Frontend**: Loading correctly, camera functionality working
- **Backend**: All APIs responding, notification system operational

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + PWA
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o (primary), Intelligence-V2 processing pipeline
- **Build**: Vite with Replit deployment

### Key Components
1. **Intelligence-V2 Router**: Advanced AI processing with vector search, recursive reasoning
2. **Multi-Modal Input**: Text, voice, image processing
3. **Smart Collections**: AI-powered categorization
4. **Notification System**: Time-sensitive reminder management
5. **Data Protection**: Version control and rollback capabilities

---

## CORE BACKEND FILES

### 1. server/index.ts - Main Server Entry Point
```typescript
import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import { initializeStandardCollections } from "./collections";
import routes from "./routes";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalSend = res.send;
  res.send = function (body) {
    if (res.get("Content-Type")?.includes("application/json")) {
      try {
        capturedJsonResponse = typeof body === "string" ? JSON.parse(body) : body;
      } catch {
        // ignore
      }
    }
    return originalSend.call(this, body);
  };

  res.on("close", () => {
    const responseTime = Date.now() - start;
    if (capturedJsonResponse) {
      const jsonStr = JSON.stringify(capturedJsonResponse);
      log(`${req.method} ${path} ${res.statusCode} in ${responseTime}ms :: ${jsonStr.substring(0, 80) + (jsonStr.length > 80 ? "…" : "")}`);
    } else {
      log(`${req.method} ${path} ${res.statusCode} in ${responseTime}ms`);
    }
  });

  next();
});

(async () => {
  await initializeDatabase();
  await initializeStandardCollections();

  app.use('/api', routes);

  if (app.get("env") === "development") {
    await setupVite(app);
  } else {
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const port = Number(process.env.PORT) || 5000;
  const server = app.listen({
    port,
    host: "0.0.0.0",
  }, async () => {
    log(`serving on port ${port}`);
  });
})();
```

### 2. server/routes.ts - API Routes (Key Sections)
```typescript
import { Router } from "express";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema, insertItemSchema } from "@shared/schema";
import { saveAudioFile } from "./file-storage";
import * as fs from "fs";
import * as path from "path";
import { DataProtectionService } from "./data-protection";
import { fastPromptTemplate, type FastAIResult } from "./utils/fastAIProcessing";
import { processNote, processWithIntelligenceV2, type MiraAIInput, type MiraAIResult } from "./brain/miraAIProcessing";
import { IntelligenceV2Router, type IntelligenceV2Input } from "./intelligence-v2/intelligence-router";
import { makeTitle } from "./utils/title-governor";

const router = Router();

// POST /api/notes - Create new note with AI processing 
router.post('/notes', async (req, res) => {
  try {
    console.log('[API] Note creation request received:', {
      mode: req.body.mode,
      contentLength: req.body.content?.length || 0,
      hasAudioData: !!req.body.audioData
    });

    const validatedData = insertNoteSchema.parse(req.body);
    console.log('[API] Data validation successful');

    // Create note in database first
    const note = await storage.createNote(validatedData);
    console.log('[API] Note created in database with ID:', note.id);

    // Initialize AI processing flag
    await storage.updateNote(note.id, { 
      isProcessing: true,
      aiContext: "Processing started"
    });

    // Handle audio file if present
    if (req.body.audioData && req.body.mode === 'voice') {
      console.log('[API] Processing audio data...');
      try {
        const audioBuffer = Buffer.from(req.body.audioData, 'base64');
        const audioUrl = await saveAudioFile(audioBuffer, note.id);
        await storage.updateNote(note.id, { audioUrl });
        console.log('[API] Audio file saved:', audioUrl);
      } catch (audioError) {
        console.error('[API] Audio processing failed:', audioError);
      }
    }

    // Trigger AI processing asynchronously
    console.log('[API] Starting AI processing for note:', note.id);
    processNoteAsync(note.id, note.content, note.mode || 'text');

    // Return note immediately
    const finalNote = await storage.getNote(note.id);
    console.log('[API] Returning note with processing flag set');
    res.json(finalNote);

  } catch (error) {
    console.error('[API] Note creation failed:', error);
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Failed to create note' 
    });
  }
});

// Async AI processing function
async function processNoteAsync(noteId: number, content: string, mode: string) {
  try {
    console.log(`[AI-ASYNC] Starting processing for note ${noteId}, mode: ${mode}`);
    
    // Get user profile for context
    const userProfile = await storage.getUserProfile();
    console.log('[AI-ASYNC] User profile retrieved');

    // Process with Intelligence V2
    const analysis = await processWithIntelligenceV2({
      id: noteId.toString(),
      content: content,
      mode: mode as 'text' | 'voice' | 'image',
      userProfile: userProfile || { personalBio: "" }
    });

    console.log(`[AI-ASYNC] Intelligence V2 processing complete for note ${noteId}`);
    console.log('[AI-ASYNC] Analysis result:', {
      hasTitle: !!analysis.title,
      hasRichContext: !!analysis.richContext,
      hasSummary: !!analysis.summary
    });

    // Update note with AI results
    await storage.updateNote(noteId, {
      aiGeneratedTitle: analysis.title || makeTitle(content),
      richContext: JSON.stringify(analysis.richContext || {}),
      aiEnhanced: true,
      isProcessing: false,
      aiSuggestion: analysis.summary || '',
      aiContext: "Processed with Intelligence V2"
    });

    console.log(`[AI-ASYNC] Note ${noteId} updated with AI enhancements`);

    // Extract and create todos if present
    if (analysis.todos && analysis.todos.length > 0) {
      console.log(`[AI-ASYNC] Creating ${analysis.todos.length} todos for note ${noteId}`);
      for (const todo of analysis.todos) {
        try {
          await storage.createTodo({
            title: todo.title,
            noteId: noteId,
            completed: false,
            priority: todo.priority || 'medium'
          });
        } catch (todoError) {
          console.error('[AI-ASYNC] Todo creation failed:', todoError);
        }
      }
    }

    console.log(`[AI-ASYNC] Processing completed successfully for note ${noteId}`);

  } catch (error) {
    console.error(`[AI-ASYNC] Processing failed for note ${noteId}:`, error);
    
    // Update note with error state
    try {
      await storage.updateNote(noteId, {
        isProcessing: false,
        aiContext: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } catch (updateError) {
      console.error('[AI-ASYNC] Failed to update note with error state:', updateError);
    }
  }
}

// GET /api/notes - Get all notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await storage.getNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// GET /api/collections - Get all collections  
router.get('/collections', async (req, res) => {
  try {
    const collections = await storage.getCollections();
    res.json(collections || []);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.json([]);
  }
});

export default router;
```

### 3. server/intelligence-v2/intelligence-router.ts - AI Processing Core
```typescript
import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';
import { buildPrompt } from '../ai/prompt-specs.js';

export interface IntelligenceV2Input { 
  id?:string; 
  content:string; 
  mode:'text'|'voice'|'image'|'file'; 
  userId?: string;
  userProfile?: { personalBio: string };
}

export interface IntelligenceV2Output {
  title: string;
  summary: string;
  richContext: any;
  todos?: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }>;
  collections?: Array<{
    name: string;
    reason: string;
  }>;
  vectorData?: {
    dense: number[];
    sparse: Record<string, number>;
    intent: IntentVector;
  };
}

export class IntelligenceV2Router {
  private openai: OpenAI;
  private vectorEngine: VectorEngine;
  private reasoningEngine: RecursiveReasoningEngine;
  private intentClassifier: IntentVectorClassifier;
  private collectionsExtractor: CollectionsExtractor;

  constructor(apiKey: string) {
    console.log('IntelligenceV2Router initialized with API key:', apiKey ? 'present' : 'missing');
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    
    this.vectorEngine = new VectorEngine();
    this.reasoningEngine = new RecursiveReasoningEngine(this.openai);
    this.intentClassifier = new IntentVectorClassifier();
    this.collectionsExtractor = new CollectionsExtractor(this.openai);
    
    // Test OpenAI connection
    this.testConnection();
  }

  private async testConnection() {
    try {
      console.log('Testing OpenAI connection with simple call...');
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      console.log('✅ OpenAI connection test successful:', response.choices[0]?.message?.content);
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error);
    }
  }

  async process(input: IntelligenceV2Input): Promise<IntelligenceV2Output> {
    console.log(`🧠 [Intelligence-V2] Processing ${input.mode} input: "${input.content.substring(0, 50)}..."`);
    
    try {
      // Step 1: Intent Classification
      const intentVector = FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED 
        ? await this.intentClassifier.classify(input.content)
        : { primary: 'memory', confidence: 0.8, dimensions: {} };

      console.log('📊 Intent classification:', intentVector);

      // Step 2: Generate vectors if enabled
      let vectorData = undefined;
      if (FEATURE_FLAGS.VECTOR_SEARCH_ENABLED) {
        vectorData = {
          dense: await this.vectorEngine.generateDenseVector(input.content),
          sparse: await this.vectorEngine.generateSparseVector(input.content),
          intent: intentVector
        };
        console.log('🔢 Vector generation completed');
      }

      // Step 3: Build context-aware prompt
      const systemPrompt = buildPrompt({
        userProfile: input.userProfile || { personalBio: "" },
        intentVector,
        mode: input.mode,
        enabledFeatures: FEATURE_FLAGS
      });

      // Step 4: Primary AI processing
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.content }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      console.log('🤖 OpenAI processing completed, response length:', aiResponse.length);

      // Step 5: Parse structured output
      let structuredOutput;
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredOutput = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to simple parsing
          structuredOutput = {
            title: makeTitle(input.content),
            summary: aiResponse.substring(0, 200),
            richContext: {
              aiGenerated: true,
              processingMode: input.mode,
              response: aiResponse
            }
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse structured output, using fallback');
        structuredOutput = {
          title: makeTitle(input.content),
          summary: aiResponse.substring(0, 200),
          richContext: {
            aiGenerated: true,
            processingMode: input.mode,
            rawResponse: aiResponse,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          }
        };
      }

      // Step 6: Enhanced reasoning if enabled
      if (FEATURE_FLAGS.RECURSIVE_REASONING_ENABLED) {
        try {
          const reasoningResult = await this.reasoningEngine.enhance(structuredOutput, input.content);
          structuredOutput.richContext = {
            ...structuredOutput.richContext,
            ...reasoningResult
          };
          console.log('🧠 Recursive reasoning enhancement completed');
        } catch (reasoningError) {
          console.warn('⚠️ Recursive reasoning failed:', reasoningError);
        }
      }

      // Step 7: Collections extraction if enabled
      if (FEATURE_FLAGS.ENHANCED_COLLECTIONS_ENABLED) {
        try {
          const collections = await this.collectionsExtractor.extractCollections(input.content, structuredOutput);
          if (collections && collections.length > 0) {
            structuredOutput.collections = collections;
            console.log('📁 Collections extraction completed:', collections.length, 'collections');
          }
        } catch (collectionsError) {
          console.warn('⚠️ Collections extraction failed:', collectionsError);
        }
      }

      // Final output
      const result: IntelligenceV2Output = {
        title: structuredOutput.title || makeTitle(input.content),
        summary: structuredOutput.summary || '',
        richContext: structuredOutput.richContext || {},
        todos: structuredOutput.todos || [],
        collections: structuredOutput.collections || [],
        vectorData
      };

      console.log('✅ [Intelligence-V2] Processing completed successfully');
      return result;

    } catch (error) {
      console.error('❌ [Intelligence-V2] Processing failed:', error);
      
      // Return fallback result
      return {
        title: makeTitle(input.content),
        summary: 'AI processing encountered an error',
        richContext: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        todos: [],
        collections: []
      };
    }
  }
}

// Singleton instance
let intelligenceRouter: IntelligenceV2Router | null = null;

export function getIntelligenceV2Router(): IntelligenceV2Router {
  if (!intelligenceRouter) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    intelligenceRouter = new IntelligenceV2Router(apiKey);
    console.log('✅ [Bootstrap] Intelligence‑V2 router initialised successfully');
  }
  return intelligenceRouter;
}
```

### 4. server/brain/miraAIProcessing.ts - AI Processing Interface
```typescript
import { getIntelligenceV2Router, type IntelligenceV2Input, type IntelligenceV2Output } from '../intelligence-v2/intelligence-router';

export interface MiraAIInput {
  id: string;
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  userProfile?: { personalBio: string };
}

export interface MiraAIResult {
  title: string;
  summary: string;
  richContext: any;
  todos?: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }>;
  collections?: Array<{
    name: string;
    reason: string;
  }>;
}

export async function processWithIntelligenceV2(input: MiraAIInput): Promise<MiraAIResult> {
  console.log('[MIRA-AI] Processing with Intelligence V2:', input.id);
  
  try {
    const router = getIntelligenceV2Router();
    const result = await router.process(input);
    
    console.log('[MIRA-AI] Intelligence V2 processing completed');
    return {
      title: result.title,
      summary: result.summary,
      richContext: result.richContext,
      todos: result.todos,
      collections: result.collections
    };
  } catch (error) {
    console.error('[MIRA-AI] Intelligence V2 processing failed:', error);
    throw error;
  }
}

export async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  return processWithIntelligenceV2(input);
}
```

---

## DATABASE SCHEMA

### shared/schema.ts (Key Tables)
```typescript
import { pgTable, serial, text, timestamp, boolean, integer, jsonb, vector } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  aiGeneratedTitle: text("ai_generated_title"),
  mode: text("mode").notNull().default("text"),
  userId: text("user_id"),
  isShared: boolean("is_shared").default(false),
  shareId: text("share_id"),
  privacyLevel: text("privacy_level").default("private"),
  createdAt: timestamp("created_at").defaultNow(),
  audioUrl: text("audio_url"),
  mediaUrl: text("media_url"),
  transcription: text("transcription"),
  imageData: text("image_data"),
  aiEnhanced: boolean("ai_enhanced").default(false),
  aiSuggestion: text("ai_suggestion"),
  aiContext: text("ai_context"),
  richContext: jsonb("rich_context"),
  isProcessing: boolean("is_processing").default(false),
  collectionId: integer("collection_id"),
  vectorDense: vector("vector_dense", { dimensions: 1536 }),
  vectorSparse: jsonb("vector_sparse"),
  intentVector: jsonb("intent_vector"),
  version: integer("version").default(1),
  originalContent: text("original_content"),
  lastUserEdit: timestamp("last_user_edit").defaultNow(),
  protectedContent: jsonb("protected_content"),
  processingPath: text("processing_path"),
  classificationScores: jsonb("classification_scores"),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  noteId: integer("note_id"),
  createdAt: timestamp("created_at").defaultNow(),
  priority: text("priority").default("medium"),
  dueDate: timestamp("due_date"),
  timeDue: timestamp("time_due"),
  isActiveReminder: boolean("is_active_reminder").default(false),
  reminderTitle: text("reminder_title"),
  archived: boolean("archived").default(false),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("folder"),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
  isDefault: boolean("is_default").default(false),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  lastUserEdit: true,
}).extend({
  audioData: z.string().optional(),
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type SelectNote = typeof notes.$inferSelect;
```

---

## FRONTEND KEY FILES

### client/src/App.tsx - Main Application
```typescript
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Notes from "@/pages/notes";
import Remind from "@/pages/remind";
import Profile from "@/pages/profile";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/notes" component={Notes} />
            <Route path="/remind" component={Remind} />
            <Route path="/profile" component={Profile} />
            <Route path="/notes/:id" component={NoteDetail} />
            <Route path="/collections/:id" component={CollectionDetail} />
            <Route path="/todos/:id" component={TodoDetail} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
```

### client/src/pages/home.tsx - Main Dashboard
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Mic, Camera, MicOff, Camera as CameraIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActivityFeed } from "@/components/activity-feed";
import { CollectionsSidebar } from "@/components/collections-sidebar";
import { VoiceRecorder } from "@/components/voice-recorder";
import { FullScreenCapture } from "@/components/full-screen-capture";

export default function Home() {
  const [activeMode, setActiveMode] = useState<'text' | 'voice' | 'camera'>('text');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      if (!response.ok) throw new Error('Failed to create note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({ title: "Note created successfully" });
      setTextInput('');
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create note", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    createNoteMutation.mutate({
      content: textInput,
      mode: 'text'
    });
  };

  const handleVoiceComplete = (audioData: string, transcription: string) => {
    createNoteMutation.mutate({
      content: transcription,
      mode: 'voice',
      audioData: audioData
    });
  };

  const handleCameraCapture = (imageData: string) => {
    createNoteMutation.mutate({
      content: "Image captured",
      mode: 'image',
      mediaUrl: imageData
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="flex">
        <CollectionsSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Mira
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Your trusted memory assistant
              </p>
            </div>

            {/* Input Card */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-lg">
              {/* Mode Selector */}
              <div className="flex justify-center space-x-2 mb-4">
                <Button
                  variant={activeMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMode('text')}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Text</span>
                </Button>
                <Button
                  variant={activeMode === 'voice' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMode('voice')}
                  className="flex items-center space-x-2"
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>Voice</span>
                </Button>
                <Button
                  variant={activeMode === 'camera' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveMode('camera');
                    setShowCamera(true);
                    console.log('📷 CAMERA TRIGGERED!');
                  }}
                  className="flex items-center space-x-2"
                >
                  <CameraIcon className="w-4 h-4" />
                  <span>Camera</span>
                </Button>
              </div>

              {/* Input Methods */}
              {activeMode === 'text' && (
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="What's on your mind?"
                    className="min-h-[100px] resize-none border-0 bg-gray-50 dark:bg-gray-700"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!textInput.trim() || createNoteMutation.isPending}
                  >
                    {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
                  </Button>
                </form>
              )}

              {activeMode === 'voice' && (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceComplete}
                  onRecordingStateChange={setIsRecording}
                />
              )}

              {activeMode === 'camera' && showCamera && (
                <FullScreenCapture
                  onCapture={handleCameraCapture}
                  onClose={() => {
                    setShowCamera(false);
                    setActiveMode('text');
                  }}
                />
              )}
            </Card>

            {/* Activity Feed */}
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## ISSUE ANALYSIS

### Current Problem
Text notes are being created successfully but show:
- `aiEnhanced: false` 
- `isProcessing: false`
- No AI-generated content in `richContext`

### Expected Behavior
After creation, notes should show:
- `aiEnhanced: true`
- Rich AI-generated context
- Extracted todos
- Smart categorization

### Diagnostic Steps Needed
1. **Verify Intelligence-V2 Router Initialization**
   - Check if `getIntelligenceV2Router()` is working
   - Verify OpenAI API key is present and valid

2. **Trace AI Processing Pipeline**
   - Monitor `processNoteAsync()` execution
   - Check if `processWithIntelligenceV2()` is being called
   - Verify database updates are happening

3. **Check Feature Flags**
   - Ensure Intelligence-V2 features are enabled
   - Verify environmental configuration

4. **Database Query Analysis**
   - Check if notes are being updated after AI processing
   - Verify storage layer is working correctly

### Logs to Monitor
- `[AI-ASYNC]` prefixed logs in server console
- `[Intelligence-V2]` processing logs
- OpenAI API call success/failure messages
- Database update confirmations

---

This complete code dump should give you everything needed to analyze the AI processing pipeline issue externally. The system appears to be properly initialized but the asynchronous AI processing may not be completing successfully.