// Clean routes.ts replacement - removing all bash script corruption
import express from 'express';
import { storage } from './storage';
import { makeTitle } from './utils/title-governor';

const router = express.Router();

// POST /api/notes - Create new note
router.post('/notes', async (req, res) => {
  try {
    const { content, mode = 'text', mediaUrl, audioUrl, transcription } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: "Content is required" });
    }

    // Create note first
    const note = await storage.createNote({
      content: content.trim(),
      mode,
      mediaUrl: mediaUrl || null,
      audioUrl: audioUrl || null,
      transcription: transcription || null,
      aiEnhanced: false,
      isProcessing: true
    });

    // Return note immediately
    res.json(note);

    // Process with AI asynchronously
    setTimeout(async () => {
      try {
        const userProfile = await storage.getUser("demo");
        const miraModule = await import('./brain/miraAIProcessing');
        
        const miraInput = {
          id: note.id.toString(),
          content: note.content,
          mode: note.mode,
          userProfile: userProfile || { personalBio: "" }
        };

        const analysis = await miraModule.processNote(miraInput);
        
        await storage.updateNote(note.id, {
          aiGeneratedTitle: analysis.title || makeTitle(note.content),
          richContext: JSON.stringify(analysis.richContext || {}),
          aiEnhanced: true,
          isProcessing: false,
          aiSuggestion: analysis.summary || '',
          aiContext: "AI processing completed"
        });

        // Create todos if any
        if (analysis.todos && analysis.todos.length > 0) {
          for (const todo of analysis.todos) {
            await storage.createTodo({
              title: todo.title,
              noteId: note.id,
              priority: todo.priority || 'medium'
            });
          }
        }

        console.log(`Note ${note.id} processed successfully`);
      } catch (error) {
        console.error(`Failed to process note ${note.id}:`, error);
        await storage.updateNote(note.id, {
          isProcessing: false,
          aiEnhanced: false
        });
      }
    }, 100);

  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// GET /api/notes - Get all notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await storage.getAllNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/notes/:id', async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const note = await storage.getNoteWithTodos(noteId);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Failed to fetch note' });
  }
});

// POST /api/notes/:id/reprocess - Reprocess a note
router.post('/notes/:id/reprocess', async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const note = await storage.getNote(noteId);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await storage.updateNote(noteId, { isProcessing: true });
    res.json({ message: 'Reprocessing started' });

    // Reprocess asynchronously
    setTimeout(async () => {
      try {
        const userProfile = await storage.getUser("demo");
        const miraModule = await import('./brain/miraAIProcessing');
        
        const analysis = await miraModule.processNote({
          id: noteId.toString(),
          content: note.content,
          mode: note.mode,
          userProfile: userProfile || { personalBio: "" }
        });

        await storage.updateNote(noteId, {
          aiGeneratedTitle: analysis.title || makeTitle(note.content),
          richContext: JSON.stringify(analysis.richContext || {}),
          aiEnhanced: true,
          isProcessing: false,
          aiSuggestion: analysis.summary || '',
          aiContext: "Reprocessed"
        });

        console.log(`Note ${noteId} reprocessed successfully`);
      } catch (error) {
        console.error(`Reprocessing failed for note ${noteId}:`, error);
        await storage.updateNote(noteId, { isProcessing: false });
      }
    }, 100);

  } catch (error) {
    console.error('Error reprocessing note:', error);
    res.status(500).json({ message: 'Failed to reprocess note' });
  }
});

// GET /api/todos - Get all todos
router.get('/todos', async (req, res) => {
  try {
    const todos = await storage.getAllTodos();
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// GET /api/collections - Get all collections  
router.get('/collections', async (req, res) => {
  try {
    const collections = await storage.getAllCollections();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Failed to fetch collections' });
  }
});

export default router;