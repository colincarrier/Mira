import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoteSchema, insertTodoSchema, insertCollectionSchema } from "@shared/schema";
import { analyzeNote as analyzeWithOpenAI, transcribeAudio } from "./openai";
import { analyzeNote as analyzeWithClaude } from "./anthropic";
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
      
      // Create the note first
      const note = await storage.createNote(noteData);
      
      // Create dual AI processing for comparison
      if (noteData.content) {
        console.log("Starting dual AI analysis for note:", note.id, "content length:", noteData.content.length);
        
        // Create a second note for Claude processing
        const claudeNote = await storage.createNote({
          ...noteData,
          content: `[Claude] ${noteData.content}`
        });
        
        // Process original note with OpenAI
        analyzeWithOpenAI(noteData.content, noteData.mode)
          .then(async (analysis) => {
            console.log("AI analysis completed for note:", note.id, "analysis:", JSON.stringify(analysis, null, 2));
            // Update note with AI analysis
            const updates: any = {
              aiEnhanced: true,
              aiSuggestion: analysis.suggestion,
              aiContext: analysis.context,
              richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
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
          .catch(error => {
            console.error("OpenAI analysis failed for note:", note.id, "error:", error.message, "stack:", error.stack);
          });
        
        // Process Claude note with Claude AI
        analyzeWithClaude(noteData.content, noteData.mode)
          .then(async (analysis) => {
            console.log("Claude analysis completed for note:", claudeNote.id, "analysis:", JSON.stringify(analysis, null, 2));
            // Update Claude note with AI analysis
            const updates: any = {
              aiEnhanced: true,
              aiSuggestion: analysis.suggestion,
              aiContext: analysis.context,
              richContext: analysis.richContext ? JSON.stringify(analysis.richContext) : null,
            };
            
            if (analysis.enhancedContent) {
              updates.content = `[Claude] ${analysis.enhancedContent}`;
            }
            
            await storage.updateNote(claudeNote.id, updates);
            console.log("Claude note updated with AI analysis:", claudeNote.id);
            
            // Create todos for Claude note if found
            for (const todoTitle of analysis.todos) {
              await storage.createTodo({
                title: todoTitle,
                noteId: claudeNote.id,
              });
            }
            
            // Create collection for Claude note if suggested
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
              
              await storage.updateNote(claudeNote.id, { collectionId });
            }
          })
          .catch(error => {
            console.error("Claude analysis failed for note:", claudeNote.id, "error:", error.message, "stack:", error.stack);
          });
      }
      
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  // Dual AI comparison endpoint
  app.post("/api/compare-ai", async (req, res) => {
    try {
      const { content, mode = 'quick' } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content required for AI comparison" });
      }

      console.log("Starting dual AI comparison for content:", content.substring(0, 100));

      // Process with both AI services in parallel
      const [openAIResult, claudeResult] = await Promise.allSettled([
        analyzeWithOpenAI(content, mode),
        analyzeWithClaude(content, mode)
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
      console.error("Dual AI comparison error:", error);
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
      analyzeWithOpenAI(transcription, "voice")
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
          return { ...collection, noteCount: notes.length };
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
      if (notes.length === 0) {
        return res.status(400).json({ message: "No notes in collection" });
      }

      // Extract and aggregate all items from notes
      const allTodos = notes.flatMap(note => note.todos || []);
      const allContent = notes.map(note => note.content).join('\n\n');
      
      // Create structured aggregation
      const itemExtraction = `Analyze the following collection of notes about "${collection.name}" and extract all individual items, tasks, facts, recommendations, and actionable elements.

Create a structured list that includes:
1. All tasks and action items (deduplicated)
2. Key facts and information points
3. Important recommendations or insights
4. Any specific details, numbers, or data points
5. Resources, links, or references mentioned

Notes content:
${allContent}

Existing todos:
${allTodos.map(todo => `- ${todo.title}`).join('\n')}

Provide a comprehensive, organized list that serves as a master reference for this collection. Group similar items together and remove duplicates.`;

      const aiResult = await analyzeWithOpenAI(itemExtraction, "collection-aggregation");
      
      // Parse rich context if available for better structure
      let structuredItems = {};
      if (aiResult.richContext) {
        try {
          const richContext = typeof aiResult.richContext === 'string' 
            ? JSON.parse(aiResult.richContext) 
            : aiResult.richContext;
          structuredItems = richContext;
        } catch (e) {
          console.log("Could not parse rich context");
        }
      }

      const superNoteData = {
        collection,
        aggregatedContent: aiResult.enhancedContent || allContent,
        insights: [
          aiResult.suggestion,
          aiResult.context,
          ...aiResult.todos.map(todo => `Action item: ${todo}`)
        ].filter(Boolean),
        structuredItems,
        allTodos: allTodos,
        notes,
        itemCount: notes.length,
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

  const httpServer = createServer(app);
  return httpServer;
}
