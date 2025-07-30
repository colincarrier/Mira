// Part 1: Storage helper stubs for V3 enhancement
import { Pool } from 'pg';

// Initialize pool from environment
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export a storage object for compatibility with existing imports
export const storage = {
  pool,
  // Add placeholder methods that other modules expect
  createNote: async () => ({}),
  updateNote: async () => ({}),
  createTodo: async () => ({}),
  createReminder: async () => ({}),
  getCollections: async () => [],
  getTodos: async () => [],
  getNotes: async () => [],
  getUsers: async () => [],
  createCollection: async () => ({}),
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