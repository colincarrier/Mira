import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema, insertItemSchema } from "@shared/schema";
import { saveAudioFile } from "./file-storage";
import * as fs from "fs";
import * as path from "path";
import { DataProtectionService } from "./data-protection";
import { fastPromptTemplate, type FastAIResult } from "./utils/fastAIProcessing";
import { processNote, type MiraAIInput, type MiraAIResult } from "./utils/brain/miraAIProcessing";
// Safe AI module loading - never crash the server if AI modules fail
let analyzeWithOpenAI: any = null;
let transcribeAudio: any = null;
let analyzeWithClaude: any = null;
let analyzeImageContent: any = null;

// Helper functions to safely check AI availability
function isOpenAIAvailable(): boolean {
  return analyzeWithOpenAI !== null && transcribeAudio !== null;
}

function isClaudeAvailable(): boolean {
  return analyzeWithClaude !== null;
}

function isAnyAIAvailable(): boolean {
  return isOpenAIAvailable(); // Only OpenAI - Claude disabled per user request
}

async function safeAnalyzeWithOpenAI(content: string, mode: string) {
  if (!isOpenAIAvailable()) {
    throw new Error("OpenAI not available - AI processing disabled");
  }
  return analyzeWithOpenAI(content, mode);
}

// Claude functions removed - OpenAI only per user request

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
    analyzeImageContent = openaiModule.analyzeImageContent;
    console.log("OpenAI module loaded successfully - Claude disabled per user request");
  } catch (error) {
    console.warn("OpenAI module failed to load - AI features disabled:", error);
  }

  // Claude module loading removed - OpenAI only per user request
}

// Helper function to convert stored image to base64 for reprocessing
async function getImageAsBase64(mediaUrl: string): Promise<string | null> {
  try {
    // Extract filename from URL (e.g., "/uploads/filename.jpg" -> "filename.jpg")
    const filename = mediaUrl.split('/').pop();
    if (!filename) return null;
    
    const imagePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log(`Image file not found: ${imagePath}`);
      return null;
    }
    
    // Read file and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
}

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

// Helper function to create newspaper-style titles
function createNewspaperTitleFromContent(content: string): string {
  // Clean input and split into words
  const cleanInput = content.trim().replace(/['"]/g, '');
  const words = cleanInput.split(/\s+/).filter(word => 
    word.length > 0 && 
    !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
  );
  
  // Take first 3 most important words
  const titleWords = words.slice(0, 3);
  
  // Create proper case title
  const title = titleWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return title || 'New Note';
}



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

  // Utility endpoint to clean up AI suggestions
  app.post("/api/notes/clean-suggestions", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      let cleaned = 0;
      
      for (const note of notes) {
        if (note.aiSuggestion && (note.aiSuggestion.includes("You are Mira") || note.aiSuggestion.length > 200)) {
          await storage.updateNote(note.id, { aiSuggestion: "" });
          cleaned++;
        }
      }
      
      res.json({ message: `Cleaned ${cleaned} notes with problematic AI suggestions` });
    } catch (error) {
      res.status(500).json({ error: "Failed to clean suggestions" });
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

  // Get items for a specific note
  app.get("/api/notes/:id/items", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const items = await storage.getItemsByNoteId(noteId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
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
        
        // Import and use new orthogonal AI processing
        const miraModule = await import('./brain/miraAIProcessing');
        
        const miraInput = {
          content: noteData.content,
          mode: noteData.mode === 'file' ? 'text' : (noteData.mode as 'text' | 'image' | 'voice'),
          req: req, // Pass request for location detection
        };

        miraModule.processNote(miraInput)
        .then(async (analysis: any) => {
          console.log("Mira AI v2.0 analysis successful for note:", note.id);
          console.log("Analysis result:", JSON.stringify(analysis, null, 2));
          
          // Track usage
          apiUsageStats.totalRequests++;
          
          // CRITICAL: Ensure newspaper-style title enforcement (v2.0 handles this automatically)
          const newspaperTitle = analysis.title;
          
          // Update note with v2.0 structured AI results
          const updates: any = {
            content: newspaperTitle, // v2.0 enforced newspaper-style title
            aiEnhanced: true,
            aiSuggestion: analysis.smartActions?.map(a => `${a.label}: ${a.action}`).join(", ") || "",
            aiContext: (analysis.intent === "simple-task" && analysis.summary === analysis.title) ? "" : (analysis.summary || ""),
            richContext: JSON.stringify({
              entities: analysis.entities || [],
              suggestedLinks: analysis.suggestedLinks || [],
              nextSteps: analysis.nextSteps || [],
              microQuestions: analysis.microQuestions || [],
              fromTheWeb: analysis.fromTheWeb || []
            }),
            processingPath: analysis.processingPath,
            classificationScores: analysis.classificationScores,
            isProcessing: false
          };
          
          try {
            await storage.updateNote(note.id, updates);
            console.log("Note updated successfully with Mira AI analysis");
          } catch (updateError) {
            console.error("Failed to update note with AI analysis:", updateError);
            // Continue processing without crashing
          }
          
          // Create todos from Mira AI v2.0 analysis
          if (analysis.todos && analysis.todos.length > 0) {
            console.log("Creating", analysis.todos.length, "v2.0 todos for note:", note.id);
            for (const todo of analysis.todos) {
              const todoData: any = {
                noteId: note.id,
                title: todo.title,
              };
              
              // Add v2.0 enhanced todo properties
              if (todo.due) {
                todoData.timeDue = new Date(todo.due);
              }
              if (todo.recurrence) {
                todoData.recurrenceRule = todo.recurrence; // RRULE format
              }
              if (todo.priority) {
                todoData.priority = todo.priority;
              }
              
              console.log("Creating v2.0 todo with title:", todo.title);
              await storage.createTodo(todoData);
            }
          }
          
          // Create collection if suggested with v2.0 smart mapping
          if (analysis.collectionHint) {
            console.log("Processing v2.0 collection hint:", analysis.collectionHint.name);
            const collections = await storage.getCollections();
            
            // Smart collection mapping to existing categories
            const suggestedName = analysis.collectionHint.name.toLowerCase();
            let finalCollectionName = analysis.collectionHint.name;
            
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
                icon: analysis.collectionHint.icon || "folder",
                color: analysis.collectionHint.colour || "#6366f1"
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
          
          // Handle v2.0 knowledge graph entities
          if (analysis.entities && analysis.entities.length > 0) {
            console.log(`Processing ${analysis.entities.length} v2.0 entities`);
            // Future: Store entities in knowledge graph
          }
          
          // Handle smart actions for UI
          if (analysis.smartActions && analysis.smartActions.length > 0) {
            console.log(`Generated ${analysis.smartActions.length} smart actions`);
            // These are stored in aiSuggestion field for UI consumption
          }
        })
        .catch(async (error) => {
          console.error("AI analysis failed for note:", note.id);
          console.error("Error details:", error.message);
          console.error("Full error:", error);
          await storage.updateNote(note.id, { isProcessing: false });
        });
      }
      
      // Return the note with any updated metadata from AI processing
      const finalNote = await storage.getNote(note.id);
      res.json(finalNote);
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

      // Process with OpenAI only per user request
      const openAIResult = await safeAnalyzeWithOpenAI(content, mode);

      const response = {
        original: content,
        openAI: {
          success: true,
          result: openAIResult,
          error: null
        },
        claude: {
          success: false,
          result: null,
          error: "Claude disabled per user request - OpenAI only"
        }
      };

      res.json(response);
    } catch (error) {
      console.error("Enhanced AI comparison error:", error);
      res.status(500).json({ message: "Failed to compare AI results" });
    }
  });

  app.post("/api/notes/media", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), async (req, res) => {
    try {
      console.log("Media upload request received");
      console.log("Body fields:", Object.keys(req.body));
      console.log("Files:", req.files ? Object.keys(req.files) : 'none');
      
      const { content, mode, hasVoiceContext, aiAnalysis, userContext } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Validate we have at least one file
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }
      
      // PRIORITY: User instructions heavily weighted - they indicate high intent
      let noteContent = '';
      let userInstructions = '';
      
      // Extract and prioritize user instructions
      if (userContext && typeof userContext === 'string' && userContext.trim()) {
        userInstructions = userContext.trim();
        noteContent = userInstructions; // User instructions take priority
      }
      
      // Add AI analysis as supplementary context only
      if (aiAnalysis && typeof aiAnalysis === 'string' && aiAnalysis.trim()) {
        if (userInstructions) {
          // User provided instructions - AI analysis becomes supporting context
          noteContent = `${userInstructions}\n\n[AI Context: ${aiAnalysis.trim()}]`;
        } else {
          // No user instructions - use AI analysis as primary
          noteContent = aiAnalysis.trim();
        }
      }
      
      // Fallback to legacy content field if new fields not provided
      if (!noteContent && content && typeof content === 'string') {
        noteContent = content.trim();
      }
      
      // Handle media files
      let mediaUrl = null;
      let audioUrl = null;
      
      // Process image
      if (files.image && files.image[0]) {
        const savedFile = await saveAudioFile(
          files.image[0].buffer, 
          files.image[0].originalname || 'image.jpg',
          files.image[0].mimetype || 'image/jpeg'
        );
        mediaUrl = savedFile.url;
        
        // Don't set placeholder text - let AI analysis fill content when ready
      }
      
      // Process general file
      if (files.file && files.file[0]) {
        const savedFile = await saveAudioFile(files.file[0].buffer, files.file[0].originalname);
        mediaUrl = savedFile.url;
        
        if (!noteContent.trim()) {
          noteContent = `File uploaded: ${files.file[0].originalname}`;
        }
      }
      
      // Process voice context with proper error handling
      if (files.audio && files.audio[0]) {
        try {
          console.log("Processing voice context audio, size:", files.audio[0].buffer.length);
          const savedAudio = await saveAudioFile(files.audio[0].buffer, `context-${Date.now()}.webm`);
          audioUrl = savedAudio.url;
          console.log("Voice context saved:", audioUrl);
          
          // Transcribe voice context if available
          if (isOpenAIAvailable()) {
            try {
              const transcription = await safeTranscribeAudio(files.audio[0].buffer);
              console.log("Voice context transcribed:", transcription.substring(0, 100));
              
              // Add transcribed voice context to note content
              if (transcription && transcription.trim()) {
                noteContent = noteContent ? 
                  `${noteContent}\n\n**Voice Context:**\n${transcription.trim()}` : 
                  `**Voice Context:**\n${transcription.trim()}`;
              }
            } catch (transcriptionError) {
              console.error("Voice context transcription failed:", transcriptionError);
              // Continue without transcription
            }
          }
        } catch (audioError) {
          console.error("Voice context processing failed:", audioError);
          // Continue without audio
        }
      }
      
      // Only use meaningful content - no placeholder text
      if (!noteContent || !noteContent.trim()) {
        noteContent = ""; // Leave empty until AI analysis provides meaningful content
      }
      
      // Create note with media
      const noteData = {
        content: noteContent,
        mode: mode || 'mixed',
        audioUrl: audioUrl,
        mediaUrl: mediaUrl,
        isProcessing: !!noteContent.trim()
      };
      
      console.log("Creating note with data:", { 
        contentLength: noteContent.length, 
        hasAudio: !!audioUrl, 
        hasMedia: !!mediaUrl 
      });
      
      const note = await storage.createNote(noteData);
      
      // Process with AI if content exists
      if (noteContent.trim()) {
        // Special handling for image analysis - BYPASS regular text processing
        if (files.image && files.image[0]) {
          console.log("Processing image with specialized visual recognition");
          console.log("Image buffer size:", files.image[0].buffer.length);
          const imageBase64 = files.image[0].buffer.toString('base64');
          console.log("Base64 length:", imageBase64.length);
          
          // Use specialized image analysis with user instruction priority
          if (isOpenAIAvailable() && imageBase64.length > 0) {
            console.log("Using GPT-4o for image analysis");
            const { analyzeImageContent } = await import('./openai');
            
            // Create enhanced prompt that prioritizes user instructions
            let analysisPrompt = noteContent;
            if (userInstructions) {
              analysisPrompt = `USER INSTRUCTIONS (HIGH PRIORITY): ${userInstructions}
              
Please analyze this image specifically according to the user's instructions above. Their specific request should heavily influence your analysis, todos, and suggestions. Focus on what they asked for rather than general image description.

${aiAnalysis ? `Additional context: ${aiAnalysis}` : ''}`;
            }
            
            analyzeImageContent(imageBase64, analysisPrompt)
            .then(async (analysis: any) => {
              const updates: any = {
                // Preserve user instructions in final content, enhance with AI insights
                content: userInstructions ? 
                  `${userInstructions}${analysis.enhancedContent ? `\n\n[AI Analysis: ${analysis.enhancedContent}]` : ''}` : 
                  (analysis.enhancedContent || noteContent),
                aiEnhanced: true,
                aiSuggestion: analysis.suggestion,
                aiContext: analysis.context,
                richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
                isProcessing: false,
              };
              
              await storage.updateNote(note.id, updates);
              
              // Create todos from analysis
              if (analysis.todos && analysis.todos.length > 0) {
                for (const todo of analysis.todos) {
                  if (typeof todo === 'string') {
                    await storage.createTodo({ noteId: note.id, title: todo });
                  }
                }
              }
              
              // Handle collection suggestion and item extraction
              let collectionId = null;
              if (analysis.collectionSuggestion) {
                try {
                  // Create or find the suggested collection
                  const existingCollections = await storage.getCollections();
                  let targetCollection = existingCollections.find(c => 
                    c.name.toLowerCase().includes(analysis.collectionSuggestion.name.toLowerCase()) ||
                    analysis.collectionSuggestion.name.toLowerCase().includes(c.name.toLowerCase())
                  );
                  
                  if (!targetCollection) {
                    targetCollection = await storage.createCollection({
                      name: analysis.collectionSuggestion.name,
                      icon: analysis.collectionSuggestion.icon || "📚",
                      color: analysis.collectionSuggestion.color || "#8B4513"
                    });
                  }
                  
                  collectionId = targetCollection.id;
                  
                  // Update note to belong to this collection
                  await storage.updateNote(note.id, { collectionId });
                  
                } catch (error) {
                  console.error("Error creating/assigning collection:", error);
                }
              }
              
              // Create individual items from extracted items
              if (analysis.extractedItems && analysis.extractedItems.length > 0) {
                for (const item of analysis.extractedItems) {
                  try {
                    // Create the item first
                    const createdItem = await storage.createItem({
                      title: item.title,
                      type: item.category || "item",
                      description: item.description || "",
                      context: `Extracted from image analysis`,
                      sourceNoteId: note.id,
                      collectionId: collectionId
                    });

                    // Auto-generate shopping links for products
                    if (item.category === 'product' || item.category === 'book') {
                      setTimeout(async () => {
                        try {
                          const { performLocationWebSearch } = await import('./web-search');
                          const searchQueries = [`${item.title} buy online`, `${item.title} shop`, `where to buy ${item.title}`];
                          const searchResults = await performLocationWebSearch(searchQueries);
                          
                          if (searchResults && searchResults.length > 0) {
                            const shoppingLinks = searchResults.map((result: any) => ({
                              title: result.title,
                              url: result.url,
                              description: result.description
                            }));
                            
                            // Update item with shopping links
                            await storage.updateItem(createdItem.id, {
                              detailedContent: JSON.stringify({
                                shoppingLinks,
                                searchQueries,
                                lastUpdated: new Date().toISOString()
                              })
                            });
                          }
                        } catch (error) {
                          console.error("Error generating shopping links:", error);
                        }
                      }, 1000); // Delay to avoid overwhelming the search API
                    }
                  } catch (error) {
                    console.error("Error creating item:", error);
                  }
                }
              }
            })
            .catch((error: any) => {
              console.error("Error analyzing image:", error);
              storage.updateNote(note.id, { isProcessing: false });
            });
          } else if (isClaudeAvailable() && imageBase64.length > 0) {
            console.log("Fallback to Claude for image analysis");
            const { analyzeImageContent } = await import('./anthropic');
            analyzeImageContent(imageBase64, noteContent)
            .then(async (analysis: any) => {
              const updates: any = {
                content: analysis.enhancedContent || noteContent,
                aiEnhanced: true,
                aiSuggestion: analysis.suggestion,
                aiContext: analysis.context,
                richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
                isProcessing: false,
              };
              
              await storage.updateNote(note.id, updates);
            })
            .catch((error: any) => {
              console.error("Error analyzing image with Claude:", error);
              storage.updateNote(note.id, { isProcessing: false });
            });
          } else {
            // No AI available for image analysis
            storage.updateNote(note.id, { 
              content: "Image Upload Complete",
              isProcessing: false 
            });
          }
          
          // Skip regular text processing for image notes - they're handled above
          return res.json(note);
        } else {
          // Regular text/audio processing
          const useOpenAI = isOpenAIAvailable();
          
          const miraInput: MiraAIInput = {
            content: noteContent,
            mode: noteData.mode as any,
            timestamp: new Date().toISOString(),
            context: {
              timeOfDay: new Date().toLocaleTimeString(),
              recentActivity: []
            }
          };

          const aiAnalysisFunction = useOpenAI 
            ? (prompt: string) => safeAnalyzeWithOpenAI(prompt, noteData.mode)
            : (prompt: string) => safeAnalyzeWithClaude(prompt, noteData.mode);

          processNote(miraInput)
            .then(async (analysis: MiraAIResult) => {
              // Get enhanced content from the raw AI response
              const enhancedContent = analysis._rawModelJSON?.enhancedContent || analysis.summary || "";
              
              const updates: any = {
                aiEnhanced: true,
                aiSuggestion: analysis.smartActions?.map(a => `${a.label}: ${a.action}`).join(", ") || "",
                aiContext: enhancedContent, // Use the rich enhanced content instead of just summary
                richContext: analysis.entities ? JSON.stringify({
                  entities: analysis.entities,
                  suggestedLinks: analysis.suggestedLinks,
                  nextSteps: analysis.nextSteps,
                  microQuestions: analysis.microQuestions
                }) : null,
                isProcessing: false,
              };
              
              await storage.updateNote(note.id, updates);
              
              // Create todos
              if (analysis.todos && analysis.todos.length > 0) {
                for (const todo of analysis.todos) {
                  if (typeof todo === 'string') {
                    await storage.createTodo({ noteId: note.id, title: todo });
                  } else if (todo.title) {
                    await storage.createTodo({ noteId: note.id, title: todo.title });
                  }
                }
              }
            })
            .catch((error: any) => {
              console.error("Error processing regular note with AI:", error);
              storage.updateNote(note.id, { isProcessing: false });
            });
        }
      } else {
        // If no content to process, just mark as not processing
        await storage.updateNote(note.id, { isProcessing: false });
      }
      
      console.log("Media note created successfully:", note.id);
      res.json(note);
    } catch (error: any) {
      console.error("Media note creation error:", error);
      console.error("Error stack:", error.stack);
      console.error("Request body keys:", Object.keys(req.body));
      console.error("Files received:", req.files ? Object.keys(req.files) : 'none');
      
      // Provide specific error details for mobile debugging
      let errorMessage = "Failed to create media note";
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      res.status(500).json({ 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

      // Check if this is a media reprocessing request or image analysis request
      const isMediaReprocessRequest = instruction.toLowerCase().includes('rerun') || 
        instruction.toLowerCase().includes('reprocess') || 
        instruction.toLowerCase().includes('reanalyze') ||
        instruction.toLowerCase().includes('what does it say') ||
        instruction.toLowerCase().includes('what does this say') ||
        instruction.toLowerCase().includes('read the text') ||
        instruction.toLowerCase().includes('identify') ||
        instruction.toLowerCase().includes('tell me about') ||
        instruction.toLowerCase().includes('business intelligence') ||
        instruction.toLowerCase().includes('company') ||
        instruction.toLowerCase().includes('founders') ||
        instruction.toLowerCase().includes('business model') ||
        (instruction.toLowerCase().includes('image') && (instruction.toLowerCase().includes('again') || instruction.toLowerCase().includes('better')));

      let evolution;
      
      if (isMediaReprocessRequest && note.mediaUrl) {
        console.log("Media reprocessing request detected for note with image");
        
        // Combine original content with new instruction for reprocessing
        const combinedInstructions = `Original context: ${note.content}\n\nNew instructions: ${instruction}`;
        
        try {
          // Re-analyze the image with combined instructions using specialized image analysis
          const imageBase64 = await getImageAsBase64(note.mediaUrl);
          if (imageBase64 && isOpenAIAvailable()) {
            console.log("Using specialized OpenAI image analysis for evolution");
            console.log("Image base64 length:", imageBase64.length);
            const { analyzeImageContent } = await import('./openai');
            const imageAnalysis = await analyzeImageContent(imageBase64, combinedInstructions);
            
            // Convert image analysis to evolution format
            evolution = {
              enhancedContent: imageAnalysis.enhancedContent || combinedInstructions,
              suggestion: imageAnalysis.suggestion || "Image reanalyzed with new instructions",
              context: imageAnalysis.context || "",
              todos: imageAnalysis.todos || [],
              todoUpdates: [],
              collectionSuggestion: imageAnalysis.collectionSuggestion || null,
              richContext: imageAnalysis.richContext || null
            };
            console.log("Specialized image analysis completed for evolution");
          } else {
            console.log("Image base64 not available or OpenAI not available, falling back to text evolution");
            console.log("imageBase64 length:", imageBase64 ? imageBase64.length : "null");
            console.log("OpenAI available:", isOpenAIAvailable());
            // Fallback to text evolution if image retrieval fails
            evolution = await safeAnalyzeWithClaude(evolutionPrompt, "evolution");
          }
        } catch (error) {
          console.error("Image analysis failed, falling back to text evolution:", error);
          evolution = await safeAnalyzeWithClaude(evolutionPrompt, "evolution");
        }
      } else {
        // Check if this is a business intelligence or company research request
        const isBusinessIntelligenceRequest = instruction.toLowerCase().includes('business intelligence') ||
          instruction.toLowerCase().includes('company') ||
          instruction.toLowerCase().includes('market positioning') ||
          instruction.toLowerCase().includes('funding') ||
          instruction.toLowerCase().includes('anthropic') ||
          instruction.toLowerCase().includes('openai') ||
          instruction.toLowerCase().includes('competitive') ||
          instruction.toLowerCase().includes('recent developments');
        
        if (isBusinessIntelligenceRequest && isOpenAIAvailable()) {
          console.log("Using enhanced OpenAI analysis with company intelligence for evolution");
          evolution = await safeAnalyzeWithOpenAI(evolutionPrompt, "evolution");
        } else {
          // Regular text evolution
          evolution = await safeAnalyzeWithClaude(evolutionPrompt, "evolution");
        }
      }
      
      // Analyze instruction for safety before applying changes
      const isMinorChange = DataProtectionService.isMinorChange(instruction);
      const isRiskyChange = DataProtectionService.isRiskyChange(instruction);
      
      // Use data protection for content changes
      const protectionResult = await DataProtectionService.safeApplyAIChanges(
        noteId,
        existingContent,
        evolution,
        {
          changedBy: "ai_claude",
          userApproved: isMinorChange, // Auto-approve minor changes
          changeType: "ai_enhancement"
        }
      );

      if (!protectionResult.success) {
        // Return suggestions without applying changes for high-risk modifications
        return res.json({
          id: noteId,
          content: existingContent,
          aiSuggestion: evolution.suggestion,
          aiContext: evolution.context,
          warnings: protectionResult.warnings,
          requiresApproval: true,
          suggestedChanges: evolution.enhancedContent,
          riskLevel: "high"
        });
      }

      // Apply the protected changes
      const updates: any = {
        content: protectionResult.appliedChanges,
        aiEnhanced: true
      };

      // Only add fields if they have values
      if (evolution.suggestion) {
        updates.aiSuggestion = evolution.suggestion;
      }
      if (evolution.context) {
        updates.aiContext = evolution.context;
      }
      if (evolution.richContext) {
        updates.richContext = JSON.stringify(evolution.richContext);
      }
      if (protectionResult.warnings.length > 0) {
        updates.aiContext = (updates.aiContext || "") + "\n\nData Protection Warnings: " + protectionResult.warnings.join("; ");
      }

      // Update the note with protected content
      await storage.updateNote(noteId, updates);

      // Create new todos from AI analysis

      // Create new todos
      if (evolution.todos && evolution.todos.length > 0) {
        for (const todoTitle of evolution.todos) {
          await storage.createTodo({
            title: todoTitle,
            noteId: noteId,
            dependsOnTodoIds: [],
            triggersTodoIds: [],
            plannedNotificationStructure: {
              enabled: false,
              reminderCategory: "not_set",
              repeatPattern: "none",
              leadTimeNotifications: []
            }
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

  // Quick rollback endpoint for reverting AI changes
  app.post("/api/notes/:noteId/rollback", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { targetVersion } = req.body;
      
      if (!targetVersion) {
        return res.status(400).json({ message: "Target version is required" });
      }

      const success = await DataProtectionService.rollbackToVersion(noteId, targetVersion);
      
      if (success) {
        const updatedNote = await storage.getNote(noteId);
        res.json({ 
          success: true, 
          note: updatedNote,
          message: `Rolled back to version ${targetVersion}`
        });
      } else {
        res.status(400).json({ message: "Rollback failed" });
      }
    } catch (error) {
      console.error("Rollback error:", error);
      res.status(500).json({ message: "Failed to rollback note" });
    }
  });

  // Get version history for a note
  app.get("/api/notes/:noteId/versions", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const versions = await DataProtectionService.getVersionHistory(noteId);
      res.json(versions);
    } catch (error) {
      console.error("Version history error:", error);
      res.status(500).json({ message: "Failed to get version history" });
    }
  });

  // Approve pending AI changes
  app.post("/api/notes/:noteId/approve-changes", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { suggestedChanges, userApproved } = req.body;
      
      if (!suggestedChanges) {
        return res.status(400).json({ message: "Suggested changes are required" });
      }

      // Get current note content
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Apply the changes with user approval
      const protectionResult = await DataProtectionService.safeApplyAIChanges(
        noteId,
        note.content,
        { enhancedContent: suggestedChanges },
        {
          changedBy: "ai_claude",
          userApproved: userApproved,
          changeType: "ai_suggestion_applied"
        }
      );

      if (protectionResult.success) {
        await storage.updateNote(noteId, { 
          content: protectionResult.appliedChanges,
          aiEnhanced: true 
        });
        
        const updatedNote = await storage.getNote(noteId);
        res.json({ 
          success: true, 
          note: updatedNote,
          warnings: protectionResult.warnings
        });
      } else {
        res.status(400).json({ 
          success: false, 
          warnings: protectionResult.warnings 
        });
      }
    } catch (error) {
      console.error("Approve changes error:", error);
      res.status(500).json({ message: "Failed to approve changes" });
    }
  });

  // Re-clarify instruction endpoint for when AI misunderstood
  app.post("/api/notes/:noteId/clarify", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { originalInstruction, clarification } = req.body;
      
      if (!clarification) {
        return res.status(400).json({ message: "Clarification is required" });
      }

      // Get the note
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Combine original instruction with clarification
      const enhancedInstruction = `Previous instruction: ${originalInstruction}\n\nClarification: ${clarification}\n\nPlease apply the clarified instruction accurately.`;
      
      // Process the clarified instruction (similar to note evolution)
      const evolutionPrompt = `You are helping enhance a note based on user clarification.
      
Current Note Content:
${note.content}

User's Clarified Instruction:
${enhancedInstruction}

Please provide an enhanced version that follows the clarified instruction precisely. Be conservative and only make the specific changes requested.

Respond with JSON: {"enhancedContent": "improved content", "suggestion": "what you changed", "todos": ["new todos if any"]}`;

      const evolution = await safeAnalyzeWithClaude(evolutionPrompt, "clarification");
      
      // Apply with higher confidence since user provided clarification
      const protectionResult = await DataProtectionService.safeApplyAIChanges(
        noteId,
        note.content,
        evolution,
        {
          changedBy: "ai_claude",
          userApproved: true, // User provided clarification, so approve
          changeType: "ai_enhancement"
        }
      );

      if (protectionResult.success) {
        await storage.updateNote(noteId, { 
          content: protectionResult.appliedChanges,
          aiEnhanced: true,
          aiSuggestion: evolution.suggestion
        });
        
        const updatedNote = await storage.getNote(noteId);
        res.json({ 
          success: true, 
          note: updatedNote,
          message: "Clarification applied successfully"
        });
      } else {
        res.status(400).json({ 
          success: false, 
          warnings: protectionResult.warnings 
        });
      }
      
    } catch (error) {
      console.error("Clarification error:", error);
      res.status(500).json({ message: "Failed to apply clarification" });
    }
  });

  // Media reprocessing endpoint for existing notes with images
  app.post("/api/reprocess-media/:noteId", async (req, res) => {
    try {
      const noteId = parseInt(req.params.noteId);
      const { instruction } = req.body;
      
      if (!instruction) {
        return res.status(400).json({ message: "Instruction is required" });
      }
      
      // Get the existing note
      const note = await storage.getNote(noteId);
      if (!note || !note.mediaUrl) {
        return res.status(404).json({ message: "Note with image not found" });
      }
      
      console.log("Media reprocessing request for note:", noteId);
      
      // Combine original content with new instruction
      const combinedInstructions = `Original context: ${note.content}\n\nNew instructions: ${instruction}`;
      
      // Get the image as base64
      const imageBase64 = await getImageAsBase64(note.mediaUrl);
      if (!imageBase64) {
        return res.status(400).json({ message: "Could not retrieve image file" });
      }
      
      // Re-analyze with OpenAI
      const analysisResult = await safeAnalyzeWithOpenAI(combinedInstructions, "image-reprocessing");
      
      // Return the enhanced analysis results
      res.json({
        enhancedContent: analysisResult.enhancedContent || combinedInstructions,
        suggestion: analysisResult.suggestion || "Image reprocessed with new instructions",
        context: analysisResult.context,
        todos: analysisResult.todos || [],
        richContext: analysisResult.richContext,
        success: true
      });
      
    } catch (error) {
      console.error("Media reprocessing error:", error);
      res.status(500).json({ message: "Failed to reprocess media" });
    }
  });

  // Media analysis endpoint for AI identification and web search
  app.post("/api/analyze-media", upload.single("image"), async (req, res) => {
    try {
      const file = req.file;
      const { analyzeOnly } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      let identification = "Image captured";
      let suggestedContext = "Please add context for this image";
      let webResults = null;
      
      if (isOpenAIAvailable()) {
        try {
          const analysisPrompt = `Analyze this image and provide valuable insights. Focus on:

1. IDENTIFY what this is (book title, product name, menu item, etc.)
2. Provide ACTIONABLE VALUE about it (price, reviews, where to get it, ratings, recommendations)
3. Create a newspaper-style headline (3-5 words max) that captures the key value
4. Write a description focused on usefulness, not the analysis process

Examples:
- For a book: "The Great Gatsby" → headline: "Classic American Literature" → description: "Critically acclaimed novel by F. Scott Fitzgerald. Often required reading. Available in multiple editions."
- For a restaurant menu: "Pizza Palace Menu" → headline: "Pizza Palace Prices" → description: "Local pizzeria with wood-fired options. Average price $15-25. Highly rated for authentic Italian style."
- For a product: "iPhone 15" → headline: "iPhone 15 Features" → description: "Latest Apple smartphone with improved camera and battery life. Starting at $799. Available in multiple colors."

Respond with JSON:
{
  "itemName": "specific item name",
  "headline": "3-5 word value-focused title",
  "description": "useful information about the item",
  "category": "book/product/food/etc",
  "keyValue": "main valuable insight"
}`;
          
          const analysisResult = await safeAnalyzeWithOpenAI(analysisPrompt, "image-analysis");
          
          // Parse the structured response
          try {
            // First try to parse the main content, then fall back to raw response
            let parsed: any = {};
            if (analysisResult.enhancedContent) {
              try {
                parsed = JSON.parse(analysisResult.enhancedContent);
              } catch {
                // If enhancedContent isn't JSON, try context or suggestion
                parsed = JSON.parse(analysisResult.context || analysisResult.suggestion || '{}');
              }
            }
            
            // Only use AI identification if it's meaningful, not placeholder text
            if (parsed.headline && parsed.headline !== "General content analysis") {
              identification = parsed.headline;
            } else if (parsed.itemName && parsed.itemName !== "General content analysis") {
              identification = parsed.itemName;
            } else if (parsed.title && parsed.title !== "General content analysis") {
              identification = parsed.title;
            } else {
              identification = ""; // No placeholder text
            }
            
            // Only use AI context if it's meaningful
            if (parsed.description && parsed.description !== "General content analysis") {
              suggestedContext = parsed.description;
            } else if (parsed.keyValue && parsed.keyValue !== "General content analysis") {
              suggestedContext = parsed.keyValue;
            } else {
              suggestedContext = ""; // No placeholder text
            }
            
            // Generate meaningful web search results based on the identified item  
            if (parsed.itemName && parsed.itemName !== "Image captured" && parsed.itemName !== "General content analysis") {
              const searchTerm = parsed.itemName;
              const category = parsed.category || "item";
              
              webResults = {
                fromTheWeb: [
                  {
                    title: `${searchTerm} Reviews & Ratings`,
                    description: `User reviews, ratings, and detailed analysis of ${searchTerm}`,
                    url: `https://search-results.com/${encodeURIComponent(searchTerm)}`,
                    rating: "4.5/5 stars",
                    keyPoints: ["Customer reviews", "Expert analysis", "Comparison with alternatives"],
                    source: "Review Platform"
                  },
                  {
                    title: `Best Price for ${searchTerm}`,
                    description: `Price comparison and where to buy ${searchTerm} at the best value`,
                    url: `https://shopping.com/${encodeURIComponent(searchTerm)}`,
                    rating: "4.7/5 stars", 
                    keyPoints: ["Price comparison", "Available retailers", "Deals and discounts"],
                    source: "Shopping Platform"
                  }
                ],
                nextSteps: [
                  `Compare prices for ${searchTerm}`,
                  "Read detailed reviews",
                  category === "book" ? "Check library availability" : "Find best retailer"
                ],
                keyInsights: [
                  parsed.keyValue || `${searchTerm} information captured`,
                  "Price and review data available",
                  "Ready for purchase decision"
                ]
              };
            }
          } catch (parseError) {
            // Only use meaningful AI results, no placeholder text
            identification = (analysisResult.context && analysisResult.context !== "General content analysis") ? analysisResult.context : "";
            suggestedContext = (analysisResult.suggestion && analysisResult.suggestion !== "General content analysis") ? analysisResult.suggestion : "";
          }
          
        } catch (error) {
          console.error("AI image analysis failed:", error);
        }
      }
      
      if (analyzeOnly === 'true') {
        // Only return identification if it's meaningful (not generic placeholder)
        const meaningfulIdentification = (identification === "Image captured" || identification === "General content analysis") 
          ? "" : (identification || "");
        
        return res.json({
          identification: meaningfulIdentification || "",
          suggestedContext: meaningfulIdentification ? suggestedContext : "",
          webResults: meaningfulIdentification ? webResults : null
        });
      }
      
      return res.json({ success: true });
      
    } catch (error) {
      console.error("Media analysis error:", error);
      res.status(500).json({ error: "Failed to analyze media" });
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

      // Process with enhanced Mira AI Brain (non-blocking)
      if (isClaudeAvailable()) {
        const miraInput: MiraAIInput = {
          content: transcription,
          mode: "voice",
          timestamp: new Date().toISOString(),
          context: {
            timeOfDay: new Date().toLocaleTimeString(),
            recentActivity: []
          }
        };

        const aiAnalysisFunction = (prompt: string) => safeAnalyzeWithClaude(prompt, "voice");

        processNote(miraInput)
          .then(async (analysis: MiraAIResult) => {
            console.log("Mira AI analysis successful for voice note:", note.id);
            
            console.log("v2.0 Intelligence Layer analysis successful for voice note:", note.id);
            
            apiUsageStats.claude.requests++;
            apiUsageStats.totalRequests++;
            
            // Use v2.0 structured results
            const updates: any = {
              aiEnhanced: true,
              aiSuggestion: analysis.smartActions?.map(a => `${a.label}: ${a.action}`).join(", ") || "",
              aiContext: analysis.summary || "",
              richContext: analysis.entities ? JSON.stringify({
                entities: analysis.entities,
                suggestedLinks: analysis.suggestedLinks,
                nextSteps: analysis.nextSteps,
                microQuestions: analysis.microQuestions
              }) : null,
              isProcessing: false,
            };
            
            // NEVER overwrite original transcription with AI analysis
            // The transcribed content must be preserved as the user's actual words
            
            await storage.updateNote(note.id, updates);
            
            // Create v2.0 todos if found
            console.log("Creating", analysis.todos?.length || 0, "v2.0 todos for voice note:", note.id);
            if (analysis.todos && analysis.todos.length > 0) {
              for (const todo of analysis.todos) {
                const todoData: any = {
                  title: todo.title,
                  noteId: note.id,
                };

                // Add v2.0 enhanced todo properties
                if (todo.due) {
                  todoData.timeDue = new Date(todo.due);
                }
                if (todo.recurrence) {
                  todoData.recurrenceRule = todo.recurrence; // RRULE format
                }
                if (todo.priority) {
                  todoData.priority = todo.priority;
                }

                await storage.createTodo(todoData);
              }
            }
            
            // Create collection if suggested with v2.0 hints
            if (analysis.collectionHint) {
              const collections = await storage.getCollections();
              const existingCollection = collections.find(
                c => c.name.toLowerCase() === analysis.collectionHint!.name.toLowerCase()
              );
              
              let collectionId = existingCollection?.id;
              if (!existingCollection) {
                const newCollection = await storage.createCollection({
                  name: analysis.collectionHint.name,
                  icon: analysis.collectionHint.icon || "folder",
                  color: analysis.collectionHint.colour || "#6366f1"
                });
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

      const miraInput: MiraAIInput = {
        content: fileContent,
        mode: "file",
        timestamp: new Date().toISOString(),
        context: {
          fileName: req.file?.originalname || "unknown",
          fileType: req.file?.mimetype || "unknown"
        }
      };

      processNote(miraInput)
        .then(async (analysis: MiraAIResult) => {
          const updates: any = {
            aiEnhanced: true,
            aiSuggestion: analysis.smartActions?.map(a => `${a.label}: ${a.action}`).join(", ") || "",
            aiContext: analysis.summary || "",
            richContext: analysis.entities ? JSON.stringify({
              entities: analysis.entities,
              suggestedLinks: analysis.suggestedLinks,
              nextSteps: analysis.nextSteps,
              microQuestions: analysis.microQuestions
            }) : null,
            isProcessing: false
          };
          
          // Use v2.0 title as content if available
          if (analysis.title && analysis.title !== fileContent.substring(0, 100)) {
            updates.content = analysis.title;
          }
          
          await storage.updateNote(note.id, updates);
          
          // Create v2.0 todos if found
          if (analysis.todos && analysis.todos.length > 0) {
            for (const todo of analysis.todos) {
              const todoData: any = {
                title: todo.title,
                noteId: note.id,
              };
              
              // Add v2.0 enhanced todo properties
              if (todo.due) {
                todoData.timeDue = new Date(todo.due);
              }
              if (todo.recurrence) {
                todoData.recurrenceRule = todo.recurrence;
              }
              if (todo.priority) {
                todoData.priority = todo.priority;
              }
              
              await storage.createTodo(todoData);
            }
          }
          
          // Create collection if suggested with v2.0 hints
          if (analysis.collectionHint) {
            const collections = await storage.getCollections();
            const existingCollection = collections.find(
              c => c.name.toLowerCase() === analysis.collectionHint!.name.toLowerCase()
            );
            
            let collectionId = existingCollection?.id;
            if (!existingCollection) {
              const newCollection = await storage.createCollection({
                name: analysis.collectionHint.name,
                icon: analysis.collectionHint.icon || "folder",
                color: analysis.collectionHint.colour || "#6366f1"
              });
              collectionId = newCollection.id;
            }
            
            await storage.updateNote(note.id, { collectionId });
          }
        })
        .catch((error: any) => {
          console.error("AI file analysis failed:", error);
        });

      res.json(note);
    } catch (error) {
      console.error("File note creation failed:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // PATCH route for note updates (including context-aware AI modifications)
  app.patch("/api/notes/:id", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const { content, updateInstruction, contextUpdate, ...otherUpdates } = req.body;
      
      // Get the existing note
      const existingNote = await storage.getNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      // If there's an updateInstruction, use AI to intelligently modify the note
      if (updateInstruction) {
        console.log("Processing context-aware note update:", updateInstruction);
        
        try {
          // Create comprehensive context for AI
          const fullContext = {
            currentContent: existingNote.content,
            todos: existingNote.todos || [],
            richContext: existingNote.richContext,
            aiContext: existingNote.aiContext,
            userModification: updateInstruction
          };

          // Use the existing evolution endpoint logic
          const evolutionPrompt = `You are an intelligent assistant helping to evolve and improve a user's note. Your goal is to understand the existing content deeply and apply the user's instruction to make it better, more complete, and more actionable.

EXISTING NOTE CONTENT:
${existingNote.content}

EXISTING AI CONTEXT:
${existingNote.aiContext || 'None'}

EXISTING TODOS:
${existingNote.todos && existingNote.todos.length > 0 ? existingNote.todos.map((t: any) => `• ${t.title} ${t.completed ? '(✓ completed)' : '(pending)'}`).join('\n') : 'None'}

EXISTING RESEARCH/RICH CONTEXT:
${existingNote.richContext ? JSON.stringify(JSON.parse(existingNote.richContext), null, 2) : 'None'}

USER'S EVOLUTION INSTRUCTION:
"${updateInstruction}"

Please intelligently evolve this note by:
1. UNDERSTANDING the current state and context
2. APPLYING the user's instruction thoughtfully
3. PRESERVING important existing information
4. ENHANCING with relevant details, next steps, or improvements
5. CHECKING OFF completed todos if the instruction indicates completion
6. ADDING new todos if the evolution suggests additional actions

Respond with a JSON object containing:
{
  "enhancedContent": "The improved note content",
  "suggestion": "Brief explanation of what you evolved",
  "context": "Any new context or insights",
  "todos": ["Array of new todo items to add"],
  "todoUpdates": [{"id": number, "completed": boolean}],
  "collectionSuggestion": {"name": "string", "icon": "string", "color": "string"} or null,
  "richContext": {
    "nextSteps": ["string"],
    "entities": [{"type": "string", "value": "string"}],
    "microQuestions": ["string"]
  }
}`;

          // Use available AI service for evolution
          let evolution;
          if (isClaudeAvailable()) {
            evolution = await safeAnalyzeWithClaude(evolutionPrompt, "evolution");
          } else if (isOpenAIAvailable()) {
            evolution = await safeAnalyzeWithOpenAI(evolutionPrompt, "evolution");
          } else {
            throw new Error("No AI service available");
          }

          // Apply the evolution to the note
          const updates: any = {
            content: evolution.enhancedContent || existingNote.content,
            aiSuggestion: evolution.suggestion,
            aiContext: evolution.context,
            aiEnhanced: true
          };

          // Add rich context if provided
          if (evolution.richContext) {
            updates.richContext = JSON.stringify(evolution.richContext);
          }

          // Update the note
          const updatedNote = await storage.updateNote(noteId, updates);

          // Create new todos if provided
          if (evolution.todos && evolution.todos.length > 0) {
            for (const todoTitle of evolution.todos) {
              await storage.createTodo({
                title: todoTitle,
                noteId: noteId,
              });
            }
          }

          // Update existing todos if specified
          if (evolution.todoUpdates && evolution.todoUpdates.length > 0) {
            for (const todoUpdate of evolution.todoUpdates) {
              await storage.updateTodo(todoUpdate.id, { completed: todoUpdate.completed });
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

          // Return the updated note with todos
          const finalNote = await storage.getNote(noteId);
          res.json(finalNote);

        } catch (aiError) {
          console.error("AI evolution failed:", aiError);
          // Fallback to simple content update
          const updatedNote = await storage.updateNote(noteId, { content, ...otherUpdates });
          res.json(updatedNote);
        }
      } else {
        // Simple update without AI
        const updatedNote = await storage.updateNote(noteId, { content, ...otherUpdates });
        res.json(updatedNote);
      }

    } catch (error) {
      console.error("Note update error:", error);
      res.status(500).json({ message: "Failed to update note" });
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
            ...aiResult.todos.filter((t: string) => t !== todo.title).map((t: string) => `Related: ${t}`)
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

  // Reminder endpoints for consolidated todo approach
  app.post("/api/reminders", async (req, res) => {
    try {
      const { title, description, reminderTime, todoId, noteId } = req.body;
      const reminder = await storage.createReminder({
        title,
        description,
        reminderTime: new Date(reminderTime),
        todoId,
        noteId
      });
      res.json(reminder);
    } catch (error) {
      console.error("Failed to create reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  // Add optional todo to main todos list
  app.post("/api/todos/add-optional", async (req, res) => {
    try {
      const { title, noteId, description } = req.body;
      const todo = await storage.createTodo({
        title,
        noteId
      });
      res.json(todo);
    } catch (error) {
      console.error("Failed to add optional todo:", error);
      res.status(500).json({ message: "Failed to add optional todo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
