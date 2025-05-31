import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema } from "@shared/schema";
import { analyzeNote, transcribeAudio } from "./openai";
import multer from "multer";

const upload = multer();

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      
      // Create the note first
      const note = await storage.createNote(noteData);
      
      // Analyze with AI in the background
      if (noteData.content) {
        analyzeNote(noteData.content, noteData.mode)
          .then(async (analysis) => {
            // Update note with AI analysis
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
          .catch(error => {
            console.error("AI analysis failed:", error);
          });
      }
      
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  app.post("/api/notes/voice", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Transcribe audio
      const transcription = await transcribeAudio(req.file.buffer);
      
      if (!transcription) {
        return res.status(400).json({ message: "Failed to transcribe audio" });
      }

      // Create note with transcription
      const note = await storage.createNote({
        content: transcription,
        mode: "voice",
        transcription,
      });

      // Analyze with AI in the background
      analyzeNote(transcription, "voice")
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
          console.error("AI analysis failed:", error);
        });

      res.json(note);
    } catch (error) {
      console.error("Voice note creation failed:", error);
      res.status(500).json({ message: "Failed to process voice note" });
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

  // Collections endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getCollections();
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const notes = await storage.getNotesByCollectionId(collection.id);
          return { ...collection, noteCount: notes.length };
        })
      );
      res.json(collectionsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
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

  app.post("/api/collections", async (req, res) => {
    try {
      const collectionData = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(collectionData);
      res.json(collection);
    } catch (error) {
      res.status(400).json({ message: "Invalid collection data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
