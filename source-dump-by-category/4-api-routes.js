// ==========================================
// MIRA AI - API ROUTES & BACKEND LOGIC
// ==========================================

// ROUTES REGISTRATION (server/routes.ts)
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema, insertItemSchema } from "@shared/schema";
import { saveAudioFile } from "./file-storage";
import { processNote, type MiraAIInput, type MiraAIResult } from "./brain/miraAIProcessing";
import { FEATURE_FLAGS } from "./feature-flags-runtime";

// AI module initialization
let analyzeWithOpenAI = null;
let transcribeAudio = null;
let analyzeImageContent = null;

async function initializeAI() {
  try {
    const openaiModule = await import("./openai");
    analyzeWithOpenAI = openaiModule.analyzeWithOpenAI;
    transcribeAudio = openaiModule.transcribeAudio;
    analyzeImageContent = openaiModule.analyzeImageContent;
    console.log("OpenAI module loaded successfully");
  } catch (error) {
    console.warn("OpenAI module failed to load - AI features disabled:", error);
  }
}

export function registerRoutes(app) {
  initializeAI();

  // ==========================================
  // NOTE CREATION WITH V2 INTELLIGENCE
  // ==========================================
  app.post("/api/notes", async (req, res) => {
    try {
      const { content, mode = "text", imageData, userId } = req.body;
      
      // CRITICAL GAP: User profile not loaded for AI context
      // const userProfile = await storage.getUser(userId || "demo");
      
      const note = await storage.createNote({
        content,
        mode,
        imageData,
        isProcessing: true
      });
      
      res.json(note);
      
      // Process with V2 intelligence
      if (FEATURE_FLAGS.INTELLIGENCE_V2_ENABLED) {
        try {
          const v2Input = {
            content,
            mode,
            noteId: note.id.toString(),
            // MISSING: userId, userProfile for personalization
          };
          
          const v2Result = await processNote(v2Input);
          
          // Update note with V2 results
          await storage.updateNote(note.id, {
            aiGeneratedTitle: v2Result.title,
            aiEnhanced: true,
            aiSuggestion: v2Result.summary,
            aiContext: v2Result.enhancedContent,
            richContext: JSON.stringify({
              entities: v2Result.entities || [],
              suggestedLinks: v2Result.suggestedLinks || [],
              nextSteps: v2Result.nextSteps || [],
              microQuestions: v2Result.microQuestions || [],
              fromTheWeb: v2Result.fromTheWeb || [],
              timeInstructions: v2Result.timeInstructions || {
                hasTimeReference: false,
                extractedTimes: [],
                scheduledItems: []
              }
            }),
            processingPath: v2Result.processingPath || "memory",
            classificationScores: v2Result.classificationScores || { memory: 1 },
            isProcessing: false
          });
          
          console.log('✅ V2 processing completed for note', note.id);
        } catch (error) {
          console.error('V2 processing failed:', error);
          await storage.updateNote(note.id, { isProcessing: false });
        }
      } else {
        await storage.updateNote(note.id, { isProcessing: false });
      }
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // ==========================================
  // USER PROFILE MANAGEMENT (BIO SYSTEM)
  // ==========================================
  
  // Quick Profile Generation - OPERATIONAL
  app.post("/api/profile/quick", async (req, res) => {
    try {
      const { profileData, userId } = req.body;

      // Generate comprehensive bio from quick profile data
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
      res.status(500).json({ error: "Failed to process profile" });
    }
  });

  // Get User Profile
  app.get("/api/profile", async (req, res) => {
    try {
      const userId = req.query.userId || "demo";
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // ==========================================
  // STANDARD CRUD OPERATIONS
  // ==========================================

  // Get all notes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // Get single note
  app.get("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  // Update note
  app.put("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const note = await storage.updateNote(id, updates);
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Delete note
  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNote(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // ==========================================
  // COLLECTIONS MANAGEMENT
  // ==========================================

  // Get all collections
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  // Create collection
  app.post("/api/collections", async (req, res) => {
    try {
      const result = insertCollectionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid collection data" });
      }
      const collection = await storage.createCollection(result.data);
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  // ==========================================
  // TODOS MANAGEMENT
  // ==========================================

  // Get all todos
  app.get("/api/todos", async (req, res) => {
    try {
      const todos = await storage.getTodos();
      res.json(todos);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // Create todo
  app.post("/api/todos", async (req, res) => {
    try {
      const result = insertTodoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid todo data" });
      }
      const todo = await storage.createTodo(result.data);
      res.json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  // Update todo
  app.put("/api/todos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const todo = await storage.updateTodo(id, updates);
      res.json(todo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  // ==========================================
  // REMINDERS SYSTEM
  // ==========================================

  // Get reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  // Create reminder
  app.post("/api/reminders", async (req, res) => {
    try {
      const reminder = await storage.createReminder(req.body);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  return createServer(app);
}