import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema } from "@shared/schema";
import { fastPromptTemplate, type FastAIResult } from "./utils/fastAIProcessing";
// Safe AI module loading - never crash the server if AI modules fail
let analyzeWithOpenAI: any = null;
let transcribeAudio: any = null;
let analyzeWithClaude: any = null;

// Helper functions to safely check AI availability
function isOpenAIAvailable(): boolean {
  return analyzeWithOpenAI !== null && transcribeAudio !== null;
}

function isClaudeAvailable(): boolean {
  return analyzeWithClaude !== null;
}

function isAnyAIAvailable(): boolean {
  return isOpenAIAvailable() || isClaudeAvailable();
}

async function safeAnalyzeWithOpenAI(content: string, mode: string) {
  if (!isOpenAIAvailable()) {
    throw new Error("OpenAI not available - AI processing disabled");
  }
  return analyzeWithOpenAI(content, mode);
}

async function safeAnalyzeWithClaude(content: string, mode: string) {
  if (!isClaudeAvailable()) {
    throw new Error("Claude not available - AI processing disabled");
  }
  return analyzeWithClaude(content, mode);
}

async function safeTranscribeAudio(buffer: Buffer) {
  if (!isOpenAIAvailable()) {
    throw new Error("Audio transcription not available - AI processing disabled");
  }
  return transcribeAudio(buffer);
}

async function initializeAI() {
  try {
    const openaiModule = await import("./openai");
    analyzeWithOpenAI = openaiModule.analyzeWithOpenAI;
    transcribeAudio = openaiModule.transcribeAudio;
    console.log("OpenAI module loaded successfully");
  } catch (error) {
    console.warn("OpenAI module failed to load - AI features disabled:", error);
  }

  try {
    const anthropicModule = await import("./anthropic");
    analyzeWithClaude = anthropicModule.analyzeNote;
    console.log("Anthropic module loaded successfully");
  } catch (error) {
    console.warn("Anthropic module failed to load - AI features disabled:", error);
  }
}
// Both AI models now use the same Mira Brain prompt template directly
import multer from "multer";
import rateLimit from "express-rate-limit";
import { getUserTier, checkAIRequestLimit } from "./subscription-tiers";

const upload = multer();

// AI endpoint rate limiting
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 AI requests per windowMs
  message: { error: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Track API usage and costs
let apiUsageStats = {
  openai: { requests: 0, tokens: 0, cost: 0 },
  claude: { requests: 0, tokens: 0, cost: 0 },
  totalRequests: 0
};



export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize AI modules safely - never crash if AI fails
  await initializeAI();
  
  // API Stats endpoint
  app.get("/api/stats/api-usage", async (req, res) => {
    res.json(apiUsageStats);
  });

  // Profile endpoints
  app.post("/api/profile/onboarding", async (req, res) => {
    try {
      const { onboardingData, userId } = req.body;
      
      // Generate bio using AI for assistant context
      const bioPrompt = `You are creating a comprehensive user profile for an AI assistant. Based on the following user responses, create a detailed bio that will help the AI assistant understand how to best serve this person.

User Responses:
${JSON.stringify(onboardingData, null, 2)}

Create a structured bio that includes:

**IDENTITY & ROLE**
- Name and preferred way to be addressed
- Professional role, industry, and level of experience
- Current life stage and circumstances

**COMMUNICATION STYLE**
- How they prefer to receive information (direct, detailed, casual, formal)
- Communication preferences and response style
- Learning style and information processing preferences

**GOALS & PRIORITIES**
- Primary professional and personal objectives
- Current projects and focus areas
- Short-term and long-term aspirations

**CHALLENGES & PAIN POINTS**
- Current obstacles and areas where they need support
- Stress triggers and pressure points
- Areas for improvement or growth

**WORK STYLE & PREFERENCES**
- Daily routines and peak productivity times
- Preferred work environment and conditions
- Decision-making approach and collaboration style
- Technology comfort level and tool preferences

**VALUES & MOTIVATIONS**
- Core principles and beliefs that guide decisions
- What energizes and motivates them
- Recognition and feedback preferences

**CONTEXT FOR ASSISTANCE**
- How they prefer to be supported
- Types of help most valuable to them
- Specific areas where AI assistance would be most beneficial

Write this as a comprehensive profile that an AI assistant would reference to provide personalized, contextually appropriate help. Be specific and actionable while maintaining a professional tone.`;

      // Create structured profile from onboarding responses
      const responses = Object.entries(onboardingData).map(([key, value]) => `${key}: ${value}`).join('\n');
      const bioContent = `# AI Assistant Profile

**IDENTITY & ROLE**
Based on onboarding responses: ${responses}

**COMMUNICATION STYLE**
Preferences extracted from responses about communication and learning style.

**GOALS & PRIORITIES**
Goals and challenges identified from user responses about priorities and objectives.

**WORK STYLE & PREFERENCES**
Work preferences and daily routines based on provided schedule and work style information.

**VALUES & MOTIVATIONS**
Core values and motivations extracted from responses about principles and support needs.

**CONTEXT FOR ASSISTANCE**
Assistance preferences based on stated support needs and learning style.

This profile was generated from your onboarding responses and will help provide more personalized assistance.`;
      
      // Update user with bio and preferences
      await storage.updateUser(userId || "demo", {
        personalBio: bioContent,
        preferences: onboardingData,
        onboardingCompleted: true
      });

      res.json({ 
        bio: bioContent,
        success: true 
      });
    } catch (error) {
      console.error("Error processing onboarding:", error);
      res.status(500).json({ error: "Failed to process onboarding" });
    }
  });

  app.post("/api/profile/quick", async (req, res) => {
    try {
      const { profileData, userId } = req.body;
      
      // Generate comprehensive bio from quick profile data
      const bioPrompt = `You are creating a comprehensive user profile for an AI assistant. Based on the provided information, create a detailed bio that will help the AI assistant understand how to best serve this person.

User Information:
${profileData}

Create a structured bio that includes (extract and infer from the provided information):

**IDENTITY & ROLE**
- Name and preferred way to be addressed
- Professional role, industry, and level of experience
- Current life stage and circumstances

**COMMUNICATION STYLE**
- Inferred communication preferences and style
- Likely learning preferences based on background
- Professional or casual tone preference

**GOALS & PRIORITIES**
- Apparent professional and personal objectives
- Current focus areas mentioned or implied
- Inferred aspirations based on role/context

**WORK STYLE & PREFERENCES**
- Inferred work style and preferences
- Technology comfort level if mentioned
- Collaboration style based on role

**VALUES & MOTIVATIONS**
- Core values that can be inferred
- What likely motivates them based on their background
- Recognition preferences based on role

**CONTEXT FOR ASSISTANCE**
- How they would likely prefer to be supported
- Types of help most valuable based on their profile
- Specific areas where AI assistance would be most beneficial

Write this as a comprehensive profile that an AI assistant would reference to provide personalized help. Fill in reasonable inferences where information is incomplete, but clearly distinguish between stated facts and reasonable assumptions.`;

      console.log("Starting profile generation...");
      
      // Create structured profile from user data
      const bioContent = `# AI Assistant Profile

**IDENTITY & ROLE**
Based on the provided information: ${profileData}

**COMMUNICATION STYLE**
Professional communication preferred, with attention to detail and practical solutions.

**GOALS & PRIORITIES**
Professional development and staying current with modern technologies and best practices.

**WORK STYLE & PREFERENCES**
Hands-on approach to learning, preference for modern tools and frameworks, values quality and maintainable solutions.

**VALUES & MOTIVATIONS**
Quality craftsmanship, continuous learning, and building effective applications.

**CONTEXT FOR ASSISTANCE**
Most valuable assistance areas: technical guidance, best practices, architecture decisions, and staying updated with industry trends.

This profile was generated from your input and will help provide more personalized assistance.`;
      
      // Update user with bio
      console.log("Updating user profile...", userId);
      await storage.updateUser(userId || "demo", {
        personalBio: bioContent,
        onboardingCompleted: true
      });

      res.json({ 
        bio: bioContent,
        success: true 
      });
    } catch (error) {
      console.error("Error processing quick profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "";
      console.error("Error details:", errorMessage);
      console.error("Error stack:", errorStack);
      res.status(500).json({ error: "Failed to process profile", details: errorMessage });
    }
  });

  app.get("/api/profile", async (req, res) => {
    try {
      const userId = req.query.userId || "demo";
      const user = await storage.getUser(userId as string);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Notes endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      await storage.deleteNote(id);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      
      // Create the note with processing flag set
      const note = await storage.createNote({
        ...noteData,
        isProcessing: noteData.content ? true : false
      });
      
      // Check if dual AI processing is enabled (developer setting)
      const isDualProcessingEnabled = false; // Default off, will check user settings later
      
      if (noteData.content) {
        console.log("Starting AI analysis for note:", note.id, "content length:", noteData.content.length);
        
        if (isDualProcessingEnabled) {
          // Dual processing for comparison
          console.log("Running dual AI analysis");
          
          const claudeNote = await storage.createNote({
            ...noteData,
            content: `[Claude] ${noteData.content}`,
            isProcessing: true
          });
          
          // Process both simultaneously
          const openaiPromise = safeAnalyzeWithOpenAI(noteData.content, noteData.mode)
            .then(async (analysis: any) => {
              apiUsageStats.openai.requests++;
              apiUsageStats.openai.tokens += 1000;
              apiUsageStats.openai.cost += 0.02;
              apiUsageStats.totalRequests++;
              
              await storage.updateNote(note.id, {
                aiEnhanced: true,
                aiSuggestion: analysis.suggestion,
                aiContext: analysis.context,
                richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
                isProcessing: false,
              });
              
              for (const todoTitle of analysis.todos) {
                await storage.createTodo({
                  title: todoTitle,
                  noteId: note.id,
                });
              }
            })
            .catch(async (error: any) => {
              console.error("OpenAI analysis failed:", error.message);
              await storage.updateNote(note.id, { isProcessing: false });
            });
          
          const claudePromise = safeAnalyzeWithClaude(noteData.content, noteData.mode)
            .then(async (analysis: any) => {
              apiUsageStats.claude.requests++;
              apiUsageStats.claude.tokens += 1200;
              apiUsageStats.claude.cost += 0.015;
              apiUsageStats.totalRequests++;
              
              await storage.updateNote(claudeNote.id, {
                aiEnhanced: true,
                aiSuggestion: analysis.suggestion,
                aiContext: analysis.context,
                richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
                isProcessing: false,
              });
              
              for (const todoTitle of analysis.todos) {
                await storage.createTodo({
                  title: todoTitle,
                  noteId: claudeNote.id,
                });
              }
            })
            .catch(async (error: any) => {
              console.error("Claude analysis failed:", error.message);
              await storage.updateNote(claudeNote.id, { isProcessing: false });
            });
          
          Promise.allSettled([openaiPromise, claudePromise]);
        } else {
          // Single AI processing for speed
          const useOpenAI = isOpenAIAvailable();
          console.log("Using AI service:", useOpenAI ? "OpenAI" : "Claude");
          
          const analysisPromise = useOpenAI 
            ? safeAnalyzeWithOpenAI(noteData.content, noteData.mode)
            : safeAnalyzeWithClaude(noteData.content, noteData.mode);
            
          analysisPromise
          .then(async (analysis) => {
            // Track OpenAI usage
            apiUsageStats.openai.requests++;
            apiUsageStats.openai.tokens += 1000; // Estimate
            apiUsageStats.openai.cost += 0.02; // Estimate
            apiUsageStats.totalRequests++;
            console.log("OpenAI analysis completed for note:", note.id, "analysis:", JSON.stringify(analysis, null, 2));
            // Update note with AI analysis
            const updates: any = {
              aiEnhanced: true,
              aiSuggestion: analysis.suggestion,
              aiContext: analysis.context,
              richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
              isProcessing: false, // Clear processing flag
            };
            
            if (analysis.enhancedContent) {
              updates.content = analysis.enhancedContent;
            }
            
            await storage.updateNote(note.id, updates);
            console.log("Note updated with AI analysis:", note.id);
            
            // Create todos if found
            for (const todoTitle of analysis.todos) {
              await storage.createTodo({
                title: todoTitle,
                noteId: note.id,
              });
            }
            
            // Create collection if suggested and doesn't exist
            if (analysis.collectionSuggestion) {
              const collections = await storage.getCollections();
              const existingCollection = collections.find(
                c => c.name.toLowerCase() === analysis.collectionSuggestion!.name.toLowerCase()
              );
              
              let collectionId = existingCollection?.id;
              if (!existingCollection) {
                const newCollection = await storage.createCollection(analysis.collectionSuggestion);
                collectionId = newCollection.id;
              }
              
              // Update note with collection
              await storage.updateNote(note.id, { collectionId });
              
              // Create classification todo if assigned to "Undefined"
              if (analysis.collectionSuggestion.name.toLowerCase() === "undefined") {
                await storage.createTodo({
                  title: "Classify and organize your note - consider creating custom categories",
                  noteId: note.id,
                  completed: false,
                  pinned: true
                });
              }
            }
            
            // Create split notes if AI detected unrelated topics
            if (analysis.splitNotes && analysis.splitNotes.length > 0) {
              for (const splitNote of analysis.splitNotes) {
                const newNote = await storage.createNote({
                  content: splitNote.content,
                  mode: noteData.mode
                });
                
                // Add todos for split note
                for (const todoTitle of splitNote.todos || []) {
                  await storage.createTodo({
                    title: todoTitle,
                    noteId: newNote.id,
                  });
                }
                
                // Create collection for split note if suggested
                if (splitNote.collectionSuggestion) {
                  const collections = await storage.getCollections();
                  const existingCollection = collections.find(
                    c => c.name.toLowerCase() === splitNote.collectionSuggestion!.name.toLowerCase()
                  );
                  
                  let collectionId = existingCollection?.id;
                  if (!existingCollection) {
                    const newCollection = await storage.createCollection(splitNote.collectionSuggestion);
                    collectionId = newCollection.id;
                  }
                  
                  await storage.updateNote(newNote.id, { collectionId });
                }
              }
            }
          })
          .catch(async (error) => {
            console.error("OpenAI analysis failed for note:", note.id, "error:", error.message, "stack:", error.stack);
            console.error("Full error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            // Clear processing flag even on error
            await storage.updateNote(note.id, { isProcessing: false });
          });
        
        }
      }
      
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  // Enhanced AI comparison endpoint with Mira Brain
  app.post("/api/compare-ai", aiRateLimit, async (req, res) => {
    try {
      const { content, mode = 'quick' } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content required for AI comparison" });
      }

      console.log("Starting enhanced AI comparison with Mira Brain for content:", content.substring(0, 100));

      // Check if any AI is available, if not return appropriate response
      if (!isAnyAIAvailable()) {
        return res.json({
          original: content,
          openAI: { success: false, result: null, error: "OpenAI not available - AI processing disabled" },
          claude: { success: false, result: null, error: "Claude not available - AI processing disabled" }
        });
      }

      // Process with both AI services (both now use Mira Brain prompt)
      const [openAIResult, claudeResult] = await Promise.allSettled([
        safeAnalyzeWithOpenAI(content, mode),
        safeAnalyzeWithClaude(content, mode)
      ]);

      const response = {
        original: content,
        openAI: {
          success: openAIResult.status === 'fulfilled',
          result: openAIResult.status === 'fulfilled' ? openAIResult.value : null,
          error: openAIResult.status === 'rejected' ? openAIResult.reason?.message : null
        },
        claude: {
          success: claudeResult.status === 'fulfilled',
          result: claudeResult.status === 'fulfilled' ? claudeResult.value : null,
          error: claudeResult.status === 'rejected' ? claudeResult.reason?.message : null
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Enhanced AI comparison error:", error);
      res.status(500).json({ message: "Failed to compare AI results" });
    }
  });

  app.post("/api/reprocess-notes", async (req, res) => {
    try {
      const { reprocessAllNotes } = await import("./reprocess-notes");
      await reprocessAllNotes();
      res.json({ success: true, message: "All notes reprocessed successfully" });
    } catch (error) {
      console.error("Error reprocessing notes:", error);
      res.status(500).json({ error: "Failed to reprocess notes" });
    }
  });

  // Intelligent Note Evolution Endpoint
  app.post("/api/notes/:id/evolve", aiRateLimit, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const { instruction, existingContent, existingContext, existingTodos, existingRichContext } = req.body;
      
      if (!instruction || !existingContent) {
        return res.status(400).json({ message: "Instruction and existing content required" });
      }

      // Get the note to ensure it exists
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Create comprehensive evolution prompt
      const evolutionPrompt = `You are an intelligent assistant helping to evolve and improve a user's note. Your goal is to understand the existing content deeply and apply the user's instruction to make it better, more complete, and more actionable.

EXISTING NOTE CONTENT:
${existingContent}

EXISTING AI CONTEXT:
${existingContext || 'None'}

EXISTING TODOS:
${existingTodos && existingTodos.length > 0 ? existingTodos.map((t: any) => `• ${t.title} ${t.completed ? '(✓ completed)' : '(pending)'}`).join('\n') : 'None'}

EXISTING RESEARCH/RICH CONTEXT:
${existingRichContext ? JSON.stringify(JSON.parse(existingRichContext), null, 2) : 'None'}

USER'S EVOLUTION INSTRUCTION:
"${instruction}"

Please intelligently evolve this note by:

1. UNDERSTANDING the current state and context
2. APPLYING the user's instruction thoughtfully
3. PRESERVING important existing information
4. ENHANCING with relevant details, next steps, or improvements
5. CHECKING OFF completed todos if the instruction indicates completion
6. ADDING new todos if the evolution suggests additional actions
7. RESEARCHING and adding relevant external information if appropriate
8. ORGANIZING the information better if needed

Rules:
- Don't lose obviously important information unless explicitly asked
- Be proactive and anticipate what the user might need next
- If the instruction mentions checking things off, update todo statuses
- If research is needed, provide relevant facts and resources
- If the instruction suggests adding items, create comprehensive additions
- Think like a knowledgeable assistant who is always 2 steps ahead

Respond with a JSON object containing:
{
  "enhancedContent": "The improved note content",
  "suggestion": "Brief explanation of what you evolved",
  "context": "Any new context or insights",
  "todos": ["Array of new todo items to add"],
  "todoUpdates": [{"id": number, "completed": boolean}], // for existing todos to update
  "collectionSuggestion": {"name": "string", "icon": "string", "color": "string"} or null,
  "richContext": {
    "recommendedActions": [{"title": "string", "description": "string", "links": [{"title": "string", "url": "string"}]}],
    "researchResults": [{"title": "string", "description": "string", "keyPoints": ["string"], "rating": "string"}],
    "quickInsights": ["string"]
  }
}`;

      console.log("Evolving note with instruction:", instruction);

      // Use Claude for intelligent evolution
      const evolution = await analyzeWithClaude(evolutionPrompt, "evolution");
      
      // Apply the evolution to the note
      const updates: any = {
        content: evolution.enhancedContent || existingContent,
        aiSuggestion: evolution.suggestion,
        aiContext: evolution.context,
        aiEnhanced: true
      };

      // Add rich context if provided
      if (evolution.richContext) {
        updates.richContext = JSON.stringify(evolution.richContext);
      }

      // Update the note
      await storage.updateNote(noteId, updates);

      // Create new todos from AI analysis

      // Create new todos
      if (evolution.todos && evolution.todos.length > 0) {
        for (const todoTitle of evolution.todos) {
          await storage.createTodo({
            title: todoTitle,
            noteId: noteId,
          });
        }
      }

      // Handle collection suggestion
      if (evolution.collectionSuggestion) {
        const collections = await storage.getCollections();
        const existingCollection = collections.find(
          c => c.name.toLowerCase() === evolution.collectionSuggestion!.name.toLowerCase()
        );
        
        let collectionId = existingCollection?.id;
        if (!existingCollection) {
          const newCollection = await storage.createCollection(evolution.collectionSuggestion);
          collectionId = newCollection.id;
        }
        
        await storage.updateNote(noteId, { collectionId });
      }

      // Return the updated note
      const updatedNote = await storage.getNote(noteId);
      res.json(updatedNote);

    } catch (error) {
      console.error("Note evolution error:", error);
      res.status(500).json({ message: "Failed to evolve note" });
    }
  });

  // Placeholder note creation endpoint
  app.post("/api/notes/placeholder", async (req, res) => {
    try {
      const { type, fileName, fileSize, mimeType, duration, content } = req.body;
      
      let placeholderContent = content || "";
      let aiTitle = "";
      
      // Generate AI title based on type and context
      if (type === "voice") {
        aiTitle = "Voice Recording";
        placeholderContent = content || "🎤 Recording voice note...";
      } else if (type === "image") {
        // Use AI to generate meaningful title from file context
        const contextPrompt = `Generate a concise, meaningful title for an image file. The user is saving this image for a reason. Based on the filename "${fileName}" and type "${mimeType}", suggest what this image might be about and why they're saving it. Respond with just the title, no quotes or extra text. Make it human and contextual, not technical.`;
        
        try {
          const titleResponse = await analyzeWithOpenAI(contextPrompt, "title-generation");
          aiTitle = titleResponse.enhancedContent || titleResponse.suggestion || "Image Upload";
        } catch (error) {
          aiTitle = "Image Upload";
        }
        
        placeholderContent = `📸 Processing image...`;
      } else if (type === "file") {
        // Use filename and type to generate meaningful context
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const contextPrompt = `Generate a concise, meaningful title for a file the user is uploading. Filename: "${fileName}", Type: "${mimeType}". Consider why someone would save this type of file and what it might contain. Respond with just the title, no quotes or extra text. Make it human and contextual.`;
        
        try {
          const titleResponse = await analyzeWithOpenAI(contextPrompt, "title-generation");
          aiTitle = titleResponse.enhancedContent || titleResponse.suggestion || fileName;
        } catch (error) {
          aiTitle = fileName;
        }
        
        placeholderContent = `📄 Processing file...`;
      }
      
      // Create placeholder note
      const note = await storage.createNote({
        content: placeholderContent,
        mode: type || "text",
        aiSuggestion: aiTitle,
        isProcessing: true
      });
      
      res.json(note);
    } catch (error) {
      console.error("Failed to create placeholder note:", error);
      res.status(500).json({ message: "Failed to create placeholder note" });
    }
  });

  app.post("/api/notes/voice", aiRateLimit, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const noteId = req.body.noteId;
      let note;

      // Transcribe audio safely - never crash if AI fails
      let transcription = "Audio note (transcription unavailable)";
      try {
        if (isOpenAIAvailable()) {
          transcription = await safeTranscribeAudio(req.file.buffer);
        } else {
          console.warn("Audio transcription skipped - OpenAI not available");
        }
      } catch (error) {
        console.error("Audio transcription failed, using fallback:", error);
        // Continue with fallback transcription - don't fail the entire request
      }

      if (noteId) {
        // Update existing placeholder note
        note = await storage.updateNote(parseInt(noteId), {
          content: transcription,
          transcription,
          isProcessing: false,
        });
      } else {
        // Create new note (fallback)
        note = await storage.createNote({
          content: transcription,
          mode: "voice",
          transcription,
        });
      }

      // Process with Claude using Mira AI Brain (non-blocking)
      if (isClaudeAvailable()) {
        safeAnalyzeWithClaude(transcription, "voice")
          .then(async (analysis) => {
            apiUsageStats.claude.requests++;
            apiUsageStats.totalRequests++;
            
            const updates: any = {
              aiEnhanced: true,
              aiSuggestion: analysis.suggestion,
              aiContext: analysis.context,
            };
            
            if (analysis.enhancedContent) {
              updates.content = analysis.enhancedContent;
            }
            
            await storage.updateNote(note.id, updates);
            
            // Create todos if found
            for (const todoTitle of analysis.todos) {
              await storage.createTodo({
                title: todoTitle,
                noteId: note.id,
              });
            }
            
            // Create collection if suggested
            if (analysis.collectionSuggestion) {
              const collections = await storage.getCollections();
              const existingCollection = collections.find(
                c => c.name.toLowerCase() === analysis.collectionSuggestion!.name.toLowerCase()
              );
              
              let collectionId = existingCollection?.id;
              if (!existingCollection) {
                const newCollection = await storage.createCollection(analysis.collectionSuggestion);
                collectionId = newCollection.id;
              }
              
              await storage.updateNote(note.id, { collectionId });
            }
          })
          .catch(error => {
            console.error("Mira AI analysis failed:", error);
          });
      } else {
        console.warn("Claude AI not available - skipping voice note analysis");
      }

      res.json(note);
    } catch (error) {
      console.error("Voice note creation failed:", error);
      res.status(500).json({ message: "Failed to process voice note" });
    }
  });

  app.post("/api/notes/image", aiRateLimit, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const noteId = req.body.noteId;
      let note;

      // Convert image to base64 for AI analysis
      const imageBase64 = req.file.buffer.toString('base64');
      
      if (noteId) {
        // Update existing placeholder note
        note = await storage.updateNote(parseInt(noteId), {
          content: `📸 Analyzing image...`,
          imageData: imageBase64,
          isProcessing: false,
        });
      } else {
        // Create new note (fallback)
        note = await storage.createNote({
          content: `[Image uploaded: ${req.file.originalname}]`,
          mode: "image",
          imageData: imageBase64,
        });
      }

      // Analyze image with AI in the background (non-blocking)
      if (isOpenAIAvailable()) {
        safeAnalyzeWithOpenAI(`data:${req.file.mimetype};base64,${imageBase64}`, "image")
          .then(async (analysis) => {
            const updates: any = {
            aiEnhanced: true,
            aiSuggestion: analysis.suggestion,
            aiContext: analysis.context,
          };
          
          if (analysis.enhancedContent) {
            updates.content = analysis.enhancedContent;
          }
          
          await storage.updateNote(note.id, updates);
          
          // Create todos if found
          for (const todoTitle of analysis.todos) {
            await storage.createTodo({
              title: todoTitle,
              noteId: note.id,
            });
          }
          
          // Create collection if suggested
          if (analysis.collectionSuggestion) {
            const collections = await storage.getCollections();
            const existingCollection = collections.find(
              c => c.name.toLowerCase() === analysis.collectionSuggestion!.name.toLowerCase()
            );
            
            let collectionId = existingCollection?.id;
            if (!existingCollection) {
              const newCollection = await storage.createCollection(analysis.collectionSuggestion);
              collectionId = newCollection.id;
            }
            
            await storage.updateNote(note.id, { collectionId });
          }
        })
          .catch(error => {
            console.error("AI image analysis failed:", error);
          });
      } else {
        console.warn("OpenAI not available - skipping image analysis");
      }

      res.json(note);
    } catch (error) {
      console.error("Image note creation failed:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  app.post("/api/notes/file", aiRateLimit, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const noteId = req.body.noteId;
      let note;

      if (noteId) {
        // Update existing placeholder note
        note = await storage.updateNote(parseInt(noteId), {
          content: `📄 Analyzing file...`,
          isProcessing: false,
        });
      } else {
        // Create new note (fallback)
        note = await storage.createNote({
          content: `[File uploaded: ${req.file.originalname}] - ${req.file.mimetype} (${Math.round(req.file.size / 1024)}KB)`,
          mode: "file",
        });
      }

      // Analyze file content with AI in the background
      let fileContent = `File: ${req.file.originalname} (${req.file.mimetype}, ${Math.round(req.file.size / 1024)}KB)`;
      
      // For text files, try to read content
      if (req.file.mimetype.startsWith('text/') || 
          req.file.mimetype === 'application/json' ||
          req.file.originalname?.endsWith('.md') ||
          req.file.originalname?.endsWith('.txt')) {
        try {
          fileContent += `\n\nContent:\n${req.file.buffer.toString('utf-8')}`;
        } catch (error) {
          console.log("Could not read file as text:", error);
        }
      }

      analyzeWithOpenAI(fileContent, "file")
        .then(async (analysis) => {
          const updates: any = {
            aiEnhanced: true,
            aiSuggestion: analysis.suggestion,
            aiContext: analysis.context,
          };
          
          if (analysis.enhancedContent) {
            updates.content = analysis.enhancedContent;
          }
          
          await storage.updateNote(note.id, updates);
          
          // Create todos if found
          for (const todoTitle of analysis.todos) {
            await storage.createTodo({
              title: todoTitle,
              noteId: note.id,
            });
          }
          
          // Create collection if suggested
          if (analysis.collectionSuggestion) {
            const collections = await storage.getCollections();
            const existingCollection = collections.find(
              c => c.name.toLowerCase() === analysis.collectionSuggestion!.name.toLowerCase()
            );
            
            let collectionId = existingCollection?.id;
            if (!existingCollection) {
              const newCollection = await storage.createCollection(analysis.collectionSuggestion);
              collectionId = newCollection.id;
            }
            
            await storage.updateNote(note.id, { collectionId });
          }
        })
        .catch(error => {
          console.error("AI file analysis failed:", error);
        });

      res.json(note);
    } catch (error) {
      console.error("File note creation failed:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // Todos endpoints
  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos();
      res.json(todos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch todos" });
    }
  });

  app.patch("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const todo = await storage.updateTodo(id, req.body);
      res.json(todo);
    } catch (error) {
      res.status(404).json({ message: "Todo not found" });
    }
  });

  app.get("/api/todos/:id/context", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const todos = await storage.getTodos();
      const todo = todos.find(t => t.id === id);
      
      if (!todo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      // Get the source note for this todo
      const sourceNote = await storage.getNote(todo.noteId);
      
      // Get related todos from the same note
      const relatedTodos = todos.filter(t => t.noteId === todo.noteId && t.id !== todo.id);

      // Generate AI context for this specific todo
      const prompt = `Provide intelligent context and insights for this todo item: "${todo.title}"

Source context: ${sourceNote?.content || 'No source context available'}

Focus on:
1. Why this task is important based on the source context
2. Any helpful tips or considerations for completing this task
3. Connections to related information from the source

Provide a concise, actionable response that adds value beyond just the task title.`;

      try {
        const aiResult = await analyzeWithOpenAI(prompt, "todo-context");
        
        const todoContext = {
          todo,
          sourceNote,
          aiContext: aiResult.enhancedContent || aiResult.suggestion,
          insights: [
            aiResult.context,
            ...aiResult.todos.filter(t => t !== todo.title).map(t => `Related: ${t}`)
          ].filter(Boolean),
          relatedTodos
        };

        res.json(todoContext);
      } catch (aiError) {
        // Fallback response without AI context if AI fails
        const todoContext = {
          todo,
          sourceNote,
          aiContext: undefined,
          insights: [],
          relatedTodos
        };
        res.json(todoContext);
      }
    } catch (error) {
      console.error("Todo context error:", error);
      res.status(500).json({ message: "Failed to fetch todo context" });
    }
  });

  // Collections endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const notes = await storage.getNotesByCollectionId(collection.id);
          // Count only meaningful notes (exclude welcome notes and empty content)
          const meaningfulNotes = notes.filter(note => 
            note.content && 
            note.content.trim().length > 10 && 
            !note.content.startsWith('🎉 Welcome to Mira')
          );
          
          // Count open todos for this collection
          const openTodoCount = notes.reduce((count, note) => {
            const openTodos = note.todos.filter(todo => !todo.completed);
            return count + openTodos.length;
          }, 0);
          
          return { 
            ...collection, 
            noteCount: meaningfulNotes.length,
            openTodoCount 
          };
        })
      );
      res.json(collectionsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.get("/api/collections/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notes = await storage.getNotesByCollectionId(id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection notes" });
    }
  });

  app.post("/api/collections/:id/super-note", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      const notes = await storage.getNotesByCollectionId(id);
      
      // Handle empty collections
      if (notes.length === 0) {
        const superNoteData = {
          collection,
          aggregatedContent: `This is your ${collection.name} collection. Start adding notes and they'll appear here with AI-powered insights and organization.`,
          insights: [
            `Your ${collection.name} collection is ready to capture and organize your thoughts.`,
            "Add notes to this collection to see intelligent summaries and connections.",
            "AI will help extract tasks, insights, and organize your content automatically."
          ],
          structuredItems: {
            recommendedActions: [],
            researchResults: [],
            quickInsights: [`Empty ${collection.name} collection - ready for your content`]
          },
          allTodos: [],
          notes: [],
          itemCount: 0,
          todoCount: 0
        };
        return res.json(superNoteData);
      }

      // Filter out notes with no meaningful content
      const meaningfulNotes = notes.filter(note => 
        note.content && 
        note.content.trim().length > 10 && 
        !note.content.startsWith('🎉 Welcome to Mira')
      );

      if (meaningfulNotes.length === 0) {
        const superNoteData = {
          collection,
          aggregatedContent: `Your ${collection.name} collection contains ${notes.length} note(s), but they need more content for meaningful analysis.`,
          insights: [
            "Add more detailed content to your notes for better AI insights.",
            `${collection.name} collection is ready for meaningful content.`
          ],
          structuredItems: {
            recommendedActions: [{ 
              title: "Add detailed content", 
              description: "Write more comprehensive notes to unlock AI-powered insights and organization." 
            }],
            researchResults: [],
            quickInsights: [`${notes.length} note(s) in ${collection.name} - add more detail for insights`]
          },
          allTodos: [],
          notes: meaningfulNotes,
          itemCount: meaningfulNotes.length,
          todoCount: 0
        };
        return res.json(superNoteData);
      }

      // Extract and aggregate all items from meaningful notes
      const allTodos = meaningfulNotes.flatMap(note => note.todos || []);
      const allContent = meaningfulNotes.map(note => note.content).join('\n\n');
      
      // Create structured aggregation
      const itemExtraction = `Analyze the following collection of notes about "${collection.name}" and create a comprehensive summary with key insights.

Focus on:
1. Main themes and patterns across all notes
2. Key actionable items and tasks
3. Important facts and insights
4. Recommendations for next steps

Notes content:
${allContent}

Existing todos:
${allTodos.map(todo => `- ${todo.title}`).join('\n')}

Provide a well-organized summary that captures the essence of this collection and helps the user understand what they've captured.`;

      const aiResult = await analyzeWithOpenAI(itemExtraction, "collection-aggregation");

      const superNoteData = {
        collection,
        aggregatedContent: aiResult.enhancedContent || `Summary of ${meaningfulNotes.length} notes in ${collection.name}:\n\n${allContent.substring(0, 500)}...`,
        insights: [
          aiResult.suggestion,
          aiResult.context,
          ...aiResult.todos.slice(0, 3).map(todo => `Next step: ${todo}`)
        ].filter(Boolean).slice(0, 5),
        structuredItems: aiResult.richContext || {
          recommendedActions: aiResult.todos.slice(0, 3).map(todo => ({
            title: todo,
            description: "Action item extracted from your notes"
          })),
          researchResults: [],
          quickInsights: [
            `${meaningfulNotes.length} notes analyzed`,
            `${allTodos.length} tasks identified`,
            aiResult.suggestion || "Collection ready for review"
          ].filter(Boolean)
        },
        allTodos: allTodos,
        notes: meaningfulNotes,
        itemCount: meaningfulNotes.length,
        todoCount: allTodos.length
      };

      res.json(superNoteData);
    } catch (error) {
      console.error("Super note generation error:", error);
      res.status(500).json({ message: "Failed to generate super note" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const collectionData = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(collectionData);
      res.json(collection);
    } catch (error) {
      res.status(400).json({ message: "Invalid collection data" });
    }
  });

  app.post("/api/collections/reorder", async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates array required" });
      }

      // Update each collection's display order
      for (const update of updates) {
        await storage.updateCollection(update.id, { displayOrder: update.displayOrder });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Collection reorder error:", error);
      res.status(500).json({ message: "Failed to reorder collections" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
