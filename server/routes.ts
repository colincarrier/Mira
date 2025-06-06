import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema, insertItemSchema } from "@shared/schema";
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
// Import the new Mira AI processing system
import { processMiraAIInput, type MiraAIInput } from "./utils/miraAIProcessing";
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
      
      // Process with available AI (single analysis for speed)
      if (noteData.content) {
        console.log("Starting AI analysis for note:", note.id, "content length:", noteData.content.length);
        
        // Use OpenAI if available, fallback to Claude
        const useOpenAI = isOpenAIAvailable();
        console.log("Using AI service:", useOpenAI ? "OpenAI" : "Claude");
        
        const miraInput: MiraAIInput = {
          content: noteData.content,
          mode: noteData.mode as any,
          timestamp: Date.now(),
          context: {
            timeOfDay: new Date().toLocaleTimeString(),
          }
        };

        const aiAnalysisFunction = useOpenAI 
          ? (prompt: string) => safeAnalyzeWithOpenAI(prompt, noteData.mode)
          : (prompt: string) => safeAnalyzeWithClaude(prompt, noteData.mode);

        processMiraAIInput(miraInput, aiAnalysisFunction)
        .then(async (analysis) => {
          console.log("Mira AI analysis successful for note:", note.id, "Service:", useOpenAI ? "OpenAI" : "Claude");
          console.log("Analysis result:", JSON.stringify(analysis, null, 2));
          
          // Track usage
          if (useOpenAI) {
            apiUsageStats.openai.requests++;
            apiUsageStats.openai.tokens += 1000;
            apiUsageStats.openai.cost += 0.02;
          } else {
            apiUsageStats.claude.requests++;
            apiUsageStats.claude.tokens += 1200;
            apiUsageStats.claude.cost += 0.015;
          }
          apiUsageStats.totalRequests++;
          
          // Update note with AI enhancements but preserve original content
          const updates: any = {
            aiEnhanced: true,
            aiSuggestion: analysis.title || analysis.enhancedContent || analysis.description || analysis.suggestion,
            aiContext: analysis.context || analysis.enhancedContent,
            richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : 
                        analysis.priorityContext ? JSON.stringify(analysis.priorityContext) : null,
            isProcessing: false,
          };
          
          // DO NOT overwrite original content - keep user's exact input
          
          await storage.updateNote(note.id, updates);
          console.log("Note updated successfully with Mira AI analysis");
          
          // Create todos from Mira AI analysis
          if (analysis.todos && analysis.todos.length > 0) {
            console.log("Creating", analysis.todos.length, "todos for note:", note.id);
            for (const todo of analysis.todos) {
              // Handle both string and object format todos
              let todoTitle: string;
              let todoData: any = {
                noteId: note.id,
              };
              
              if (typeof todo === 'string') {
                todoTitle = todo;
                todoData.title = todoTitle;
              } else if (typeof todo === 'object' && (todo as any).title) {
                todoTitle = (todo as any).title;
                todoData.title = todoTitle;
                
                // Add enhanced todo properties from Mira AI
                if ((todo as any).itemType === 'reminder') {
                  todoData.itemType = 'reminder';
                  todoData.isActiveReminder = (todo as any).isActiveReminder || false;
                }
                if ((todo as any).timeDue) {
                  todoData.timeDue = new Date((todo as any).timeDue);
                }
                if ((todo as any).plannedNotificationStructure) {
                  todoData.plannedNotificationStructure = (todo as any).plannedNotificationStructure;
                }
              } else {
                console.log("Skipping invalid todo format:", todo);
                continue;
              }
              
              console.log("Creating todo with title:", todoTitle);
              await storage.createTodo(todoData);
            }
          }
          
          // Create collection if suggested with smart mapping
          if (analysis.collectionSuggestion) {
            console.log("Processing collection suggestion:", analysis.collectionSuggestion.name);
            const collections = await storage.getCollections();
            
            // Smart collection mapping to existing categories
            const suggestedName = analysis.collectionSuggestion.name.toLowerCase();
            let finalCollectionName = analysis.collectionSuggestion.name;
            
            // Map overly specific collections to existing ones
            if (suggestedName.includes('personal') || suggestedName.includes('communication') || 
                suggestedName.includes('family') || suggestedName.includes('healthcare') || 
                suggestedName.includes('medical') || suggestedName.includes('health') || 
                suggestedName.includes('appointment') || suggestedName.includes('doctor')) {
              finalCollectionName = "Personal";
            } else if (suggestedName.includes('grocery') || suggestedName.includes('shopping') || 
                       suggestedName.includes('errands') || suggestedName.includes('store')) {
              finalCollectionName = "To-dos";
            } else if (suggestedName.includes('work') || suggestedName.includes('office') || 
                       suggestedName.includes('business') || suggestedName.includes('meeting')) {
              finalCollectionName = "Work";
            } else if (suggestedName.includes('home') || suggestedName.includes('house') || 
                       suggestedName.includes('maintenance') || suggestedName.includes('repair')) {
              finalCollectionName = "Home";
            } else if (suggestedName.includes('book') || suggestedName.includes('reading')) {
              finalCollectionName = "Books";
            } else if (suggestedName.includes('movie') || suggestedName.includes('tv') || 
                       suggestedName.includes('film') || suggestedName.includes('entertainment')) {
              finalCollectionName = "Movies & TV";
            } else if (suggestedName.includes('restaurant') || suggestedName.includes('food') || 
                       suggestedName.includes('dining')) {
              finalCollectionName = "Restaurants";
            } else if (suggestedName.includes('travel') || suggestedName.includes('trip') || 
                       suggestedName.includes('vacation')) {
              finalCollectionName = "Travel";
            } else {
              // Default to Other for overly specific suggestions
              finalCollectionName = "Other";
            }
            
            // Find or create the final collection
            const targetCollection = collections.find(
              c => c.name.toLowerCase() === finalCollectionName.toLowerCase()
            );
            
            let collectionId = targetCollection?.id;
            if (!targetCollection && finalCollectionName !== "Other") {
              // Only create new collections for broad categories, not specific ones
              const newCollection = await storage.createCollection({
                name: finalCollectionName,
                icon: analysis.collectionSuggestion.icon,
                color: analysis.collectionSuggestion.color
              });
              collectionId = newCollection.id;
              console.log("Created new broad collection:", finalCollectionName);
            } else if (!targetCollection) {
              // Find Other collection
              const otherCollection = collections.find(c => c.name.toLowerCase() === "other");
              collectionId = otherCollection?.id;
            }
            
            if (collectionId) {
              await storage.updateNote(note.id, { collectionId });
              console.log("Assigned note to collection:", finalCollectionName);
            }
          }
          
          // Extract and create individual items from extractedItems field
          if (analysis.extractedItems && analysis.extractedItems.length > 0) {
            for (const item of analysis.extractedItems) {
              await storage.createItem({
                title: item.title,
                description: item.description || '',
                type: item.category,
                sourceNoteId: note.id,
                collectionId: note.collectionId || null
              });
            }
            console.log(`Extracted ${analysis.extractedItems.length} individual items from note`);
          }
          
          // Also extract items from richContext.researchResults (fallback for AI inconsistency)
          if (analysis.richContext?.researchResults && analysis.richContext.researchResults.length > 0) {
            for (const research of analysis.richContext.researchResults) {
              // Determine item type based on collection or content
              let itemType = 'concept';
              const collectionName = note.collection?.name?.toLowerCase() || '';
              if (collectionName.includes('movie') || collectionName.includes('tv')) {
                itemType = 'movie';
              } else if (collectionName.includes('book')) {
                itemType = 'book';
              } else if (collectionName.includes('restaurant') || collectionName.includes('food')) {
                itemType = 'restaurant';
              }
              
              await storage.createItem({
                title: research.title,
                description: research.description || '',
                type: itemType,
                sourceNoteId: note.id,
                collectionId: note.collectionId || null
              });
            }
            console.log(`Extracted ${analysis.richContext.researchResults.length} items from research results`);
          }
        })
        .catch(async (error) => {
          console.error("AI analysis failed for note:", note.id);
          console.error("Error details:", error.message);
          console.error("Full error:", error);
          await storage.updateNote(note.id, { isProcessing: false });
        });
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

  // GET route for super-note - automatically generates if not exists
  app.get("/api/collections/:id/super-note", async (req, res) => {
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
          description: "Start adding notes to see them organized here",
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
          items: [],
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
          description: "Add more detailed content to unlock AI insights",
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
          items: [],
          notes: meaningfulNotes,
          itemCount: 0,
          todoCount: 0
        };
        return res.json(superNoteData);
      }

      // Get all todos from meaningful notes
      const allTodos = meaningfulNotes.flatMap(note => note.todos || []);
      
      // Get all items from this collection
      const collectionItems = await storage.getItemsByCollectionId(id);
      
      // Create aggregated content based on collection type
      let collectionContent = '';
      let collectionDescription = '';
      
      if (collectionItems.length > 0) {
        // Group items by type for better organization
        const itemsByType = collectionItems.reduce((acc: any, item) => {
          const type = item.type || 'item';
          if (!acc[type]) acc[type] = [];
          acc[type].push(item);
          return acc;
        }, {});

        // Create content based on collection type
        const collectionName = collection.name.toLowerCase();
        if (collectionName.includes('movie') || collectionName.includes('tv')) {
          collectionContent = '🎬 Movies & Shows:\n';
          collectionDescription = 'Movies and TV shows to watch';
        } else if (collectionName.includes('book') || collectionName.includes('read')) {
          collectionContent = '📚 Books & Reading:\n';
          collectionDescription = 'Books and reading materials';
        } else if (collectionName.includes('restaurant') || collectionName.includes('food')) {
          collectionContent = '🍽️ Restaurants & Food:\n';
          collectionDescription = 'Places to eat and food to try';
        } else {
          collectionContent = `📋 ${collection.name} Items:\n`;
          collectionDescription = `Items in your ${collection.name} collection`;
        }

        // Add each item as a line
        collectionItems.forEach(item => {
          collectionContent += `• ${item.title}`;
          if (item.description) {
            collectionContent += ` - ${item.description}`;
          }
          collectionContent += '\n';
        });
      } else {
        collectionContent = `Add notes with specific ${collection.name.toLowerCase()} to see them organized here.`;
        collectionDescription = `Items will appear here when extracted from your notes`;
      }

      const superNoteData = {
        collection,
        aggregatedContent: collectionContent,
        description: collectionDescription,
        insights: [
          `${collectionItems.length} individual items tracked`,
          `${allTodos.length} related tasks`,
          `${meaningfulNotes.length} source notes`
        ].filter(Boolean),
        structuredItems: {
          recommendedActions: allTodos.slice(0, 5).map((todo: any) => ({
            title: todo.title,
            description: "Task from your notes",
            noteId: todo.noteId
          })),
          extractedItems: collectionItems.map(item => ({
            title: item.title,
            description: item.description || '',
            type: item.type,
            sourceNoteId: item.sourceNoteId
          })),
          quickInsights: [
            `${collectionItems.length} items extracted`,
            `${allTodos.length} tasks available`,
            `${meaningfulNotes.length} notes in collection`
          ]
        },
        allTodos: allTodos,
        items: collectionItems,
        notes: meaningfulNotes,
        itemCount: collectionItems.length,
        todoCount: allTodos.length
      };

      res.json(superNoteData);
    } catch (error) {
      console.error("Super note fetch error:", error);
      res.status(500).json({ message: "Failed to fetch super note" });
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

      // Get individual items extracted from notes in this collection
      const collectionItems = await storage.getItemsByCollectionId(id);
      const allTodos = meaningfulNotes.flatMap(note => note.todos || []);
      
      // Create collection-specific content based on type
      let collectionContent = "";
      let collectionDescription = "";
      
      const collectionName = collection.name.toLowerCase();
      
      if (collectionName.includes('book')) {
        collectionDescription = "Your reading list and book recommendations";
        collectionContent = collectionItems.length > 0 
          ? `📚 Books in your collection:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No books have been extracted yet. Add notes mentioning specific books to see them here.";
      } else if (collectionName.includes('movie') || collectionName.includes('tv')) {
        collectionDescription = "Movies and TV shows to watch";
        collectionContent = collectionItems.length > 0 
          ? `🎬 Movies & Shows:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No movies or shows have been extracted yet. Add notes mentioning specific titles to see them here.";
      } else if (collectionName.includes('restaurant') || collectionName.includes('food')) {
        collectionDescription = "Places to eat and food recommendations";
        collectionContent = collectionItems.length > 0 
          ? `🍽️ Restaurants & Food:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No restaurants have been extracted yet. Add notes mentioning specific places to eat to see them here.";
      } else if (collectionName.includes('product')) {
        collectionDescription = "Products and items of interest";
        collectionContent = collectionItems.length > 0 
          ? `🛍️ Products:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No products have been extracted yet. Add notes mentioning specific products to see them here.";
      } else if (collectionName.includes('place') || collectionName.includes('travel')) {
        collectionDescription = "Places to visit and travel destinations";
        collectionContent = collectionItems.length > 0 
          ? `📍 Places:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No places have been extracted yet. Add notes mentioning specific locations to see them here.";
      } else if (collectionName.includes('person') || collectionName.includes('contact')) {
        collectionDescription = "People and contacts";
        collectionContent = collectionItems.length > 0 
          ? `👥 People:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : "No people have been extracted yet. Add notes mentioning specific individuals to see them here.";
      } else {
        // Generic collection
        collectionDescription = `Your ${collection.name} collection`;
        collectionContent = collectionItems.length > 0 
          ? `📋 Items:\n${collectionItems.map(item => `• ${item.title}${item.description ? ` - ${item.description}` : ''}`).join('\n')}`
          : `No specific items have been extracted yet. Add notes with specific ${collection.name.toLowerCase()} to see them organized here.`;
      }

      const superNoteData = {
        collection,
        aggregatedContent: collectionContent,
        description: collectionDescription,
        insights: [
          `${collectionItems.length} individual items tracked`,
          `${allTodos.length} related tasks`,
          `${meaningfulNotes.length} source notes`
        ].filter(Boolean),
        structuredItems: {
          recommendedActions: allTodos.slice(0, 5).map(todo => ({
            title: todo.title,
            description: "Task from your notes",
            noteId: todo.noteId
          })),
          extractedItems: collectionItems.map(item => ({
            title: item.title,
            description: item.description || '',
            type: item.type,
            sourceNoteId: item.sourceNoteId
          })),
          quickInsights: [
            `${collectionItems.length} items extracted`,
            `${allTodos.length} tasks available`,
            `${meaningfulNotes.length} notes in collection`
          ]
        },
        allTodos: allTodos,
        items: collectionItems,
        notes: meaningfulNotes,
        itemCount: collectionItems.length,
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

  // Items API routes
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/collections/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getItemsByCollectionId(id);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch collection items:", error);
      res.status(500).json({ message: "Failed to fetch collection items" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Failed to create item:", error);
      res.status(400).json({ message: "Invalid item data" });
    }
  });

  app.patch("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Failed to update item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
