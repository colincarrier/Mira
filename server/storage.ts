// Part 1: Storage helper stubs for V3 enhancement
import { Pool } from 'pg';
import crypto from "node:crypto";

// Initialize pool from environment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", async (err) => {
  console.error("[PG-POOL] unexpected error", err);
  if (process.env.SENTRY_DSN) {
    const { captureException } = await import("@sentry/node");
    captureException(err, { tags: { subsystem: "pg-pool" } });
  }
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing pg pool…");
  await pool.end();
  process.exit(0);
});

// Export a storage object for compatibility with existing imports
export const storage = {
  pool,
  // Add placeholder methods that other modules expect
  createNote: async (noteData: any) => {
    try {
      const client = await pool.connect();
      const result = await client.query(
        `INSERT INTO notes (content, user_id, collection_id, mode, is_processing) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [noteData.content, noteData.userId || 'demo', noteData.collectionId, noteData.mode || 'text', noteData.isProcessing || true]
      );
      client.release();
      return result.rows[0];
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },
  createTodo: async () => ({}),
  createReminder: async () => ({}),
  getCollections: async () => [],
  getTodos: async () => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM todos ORDER BY created_at DESC');
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  },
  getNotes: async () => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM notes ORDER BY created_at DESC');
      client.release();
      // Transform field names to match frontend expectations
      return result.rows.map(note => ({
        ...note,
        createdAt: note.created_at, // Add camelCase version
        aiGeneratedTitle: note.ai_generated_title,
        isProcessing: note.is_processing,
        audioUrl: note.audio_url,
        mediaUrl: note.media_url,
        aiEnhanced: note.ai_enhanced,
        aiSuggestion: note.ai_suggestion,
        aiContext: note.ai_context,
        richContext: note.rich_context,
        miraResponse: note.mira_response,
        collectionId: note.collection_id,
        isShared: note.is_shared,
        shareId: note.share_id,
        privacyLevel: note.privacy_level,
        userId: note.user_id,
        imageData: note.image_data,
        tokenUsage: note.token_usage,
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },
  getUsers: async () => [],
  createCollection: async () => ({}),
  getNote: async (id: number) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM notes WHERE id = $1', [id]);
      client.release();
      const note = result.rows[0];
      if (!note) return null;
      // Transform field names to match frontend expectations
      return {
        ...note,
        createdAt: note.created_at,
        aiGeneratedTitle: note.ai_generated_title,
        isProcessing: note.is_processing,
        audioUrl: note.audio_url,
        mediaUrl: note.media_url,
        aiEnhanced: note.ai_enhanced,
        aiSuggestion: note.ai_suggestion,
        aiContext: note.ai_context,
        richContext: note.rich_context,
        miraResponse: note.mira_response,
        collectionId: note.collection_id,
        isShared: note.is_shared,
        shareId: note.share_id,
        privacyLevel: note.privacy_level,
        userId: note.user_id,
        imageData: note.image_data,
        tokenUsage: note.token_usage,
      };
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  },
  getTodosByNoteId: async (noteId: number) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM todos WHERE note_id = $1 ORDER BY created_at DESC', [noteId]);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching todos for note:', error);
      return [];
    }
  },
  updateNote: async (
    id: number,
    updates: {
      ai_generated_title?: string | null;
      token_usage?: string | null;
      mira_response?: string | null;
      is_processing?: boolean;
    },
  ) => {
    return pool.query(
      `UPDATE notes
         SET updated_at        = NOW(),
             ai_generated_title = COALESCE($1, ai_generated_title),
             token_usage        = COALESCE($2, token_usage),
             mira_response      = COALESCE($3, mira_response),
             is_processing      = COALESCE($4, is_processing)
       WHERE id = $5`,
      [updates.ai_generated_title, updates.token_usage, updates.mira_response, updates.is_processing, id],
    );
  },
};

export async function getUserPatterns(userId: string): Promise<any> {
  return { 
    summary: 'active user; prefers concise answers',
    recentTopics: [],
    preferredStyle: 'practical'
  };
}

export async function getCollectionHints(text: string): Promise<any[]> {
  const lower = text.toLowerCase();
  
  if (/flight|hotel|trip|travel/i.test(lower)) {
    return [{ name: 'travel', icon: 'plane' }];
  }
  if (/ticket|game|concert|event/i.test(lower)) {
    return [{ name: 'events', icon: 'calendar' }];
  }
  if (/health|doctor|medicine|vitamins/i.test(lower)) {
    return [{ name: 'health', icon: 'heart' }];
  }
  if (/shopping|buy|purchase|store/i.test(lower)) {
    return [{ name: 'shopping', icon: 'shopping-bag' }];
  }
  
  return [{ name: 'general', icon: 'folder' }];
}

export async function getRecentNotes(userId: string, limit = 5): Promise<string[]> {
  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT content FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    client.release();
    
    return result.rows.map(row => row.content.substring(0, 100)); // Truncate for context
  } catch (error) {
    console.warn('[Storage] Failed to fetch recent notes:', error);
    return [];
  }
}