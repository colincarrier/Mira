import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { NoteWithTodos, Todo, Collection } from '@shared/schema';
import { SyncOperation } from './app-store';

interface MiraDB extends DBSchema {
  notes: {
    key: number;
    value: NoteWithTodos;
    indexes: { 'by-updated': string; 'by-collection': number };
  };
  todos: {
    key: number;
    value: Todo;
    indexes: { 'by-note': number; 'by-completed': boolean };
  };
  collections: {
    key: number;
    value: Collection;
    indexes: { 'by-name': string };
  };
  sync_queue: {
    key: string;
    value: SyncOperation;
    indexes: { 'by-timestamp': number };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<MiraDB> | null = null;
  private readonly DB_NAME = 'MiraDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<MiraDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Notes store
          if (!db.objectStoreNames.contains('notes')) {
            const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
            notesStore.createIndex('by-updated', 'updatedAt');
            notesStore.createIndex('by-collection', 'collectionId');
          }

          // Todos store
          if (!db.objectStoreNames.contains('todos')) {
            const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
            todosStore.createIndex('by-note', 'noteId');
            todosStore.createIndex('by-completed', 'completed');
          }

          // Collections store
          if (!db.objectStoreNames.contains('collections')) {
            const collectionsStore = db.createObjectStore('collections', { keyPath: 'id' });
            collectionsStore.createIndex('by-name', 'name');
          }

          // Sync queue store
          if (!db.objectStoreNames.contains('sync_queue')) {
            const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            syncStore.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  private ensureDB(): IDBPDatabase<MiraDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // Notes operations
  async saveNote(note: NoteWithTodos): Promise<void> {
    const db = this.ensureDB();
    await db.put('notes', note);
  }

  async getNote(id: number): Promise<NoteWithTodos | undefined> {
    const db = this.ensureDB();
    return await db.get('notes', id);
  }

  async getAllNotes(): Promise<NoteWithTodos[]> {
    const db = this.ensureDB();
    return await db.getAll('notes');
  }

  async deleteNote(id: number): Promise<void> {
    const db = this.ensureDB();
    await db.delete('notes', id);
  }

  async getNotesByCollection(collectionId: number): Promise<NoteWithTodos[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('notes', 'by-collection', collectionId);
  }

  // Todos operations
  async saveTodo(todo: Todo): Promise<void> {
    const db = this.ensureDB();
    await db.put('todos', todo);
  }

  async getTodo(id: number): Promise<Todo | undefined> {
    const db = this.ensureDB();
    return await db.get('todos', id);
  }

  async getAllTodos(): Promise<Todo[]> {
    const db = this.ensureDB();
    return await db.getAll('todos');
  }

  async deleteTodo(id: number): Promise<void> {
    const db = this.ensureDB();
    await db.delete('todos', id);
  }

  async getTodosByNote(noteId: number): Promise<Todo[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('todos', 'by-note', noteId);
  }

  async getCompletedTodos(): Promise<Todo[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('todos', 'by-completed', true);
  }

  // Collections operations
  async saveCollection(collection: Collection): Promise<void> {
    const db = this.ensureDB();
    await db.put('collections', collection);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const db = this.ensureDB();
    return await db.get('collections', id);
  }

  async getAllCollections(): Promise<Collection[]> {
    const db = this.ensureDB();
    return await db.getAll('collections');
  }

  async deleteCollection(id: number): Promise<void> {
    const db = this.ensureDB();
    await db.delete('collections', id);
  }

  // Sync queue operations
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    const db = this.ensureDB();
    await db.put('sync_queue', operation);
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    const db = this.ensureDB();
    return await db.getAll('sync_queue');
  }

  async removeSyncOperation(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('sync_queue', id);
  }

  async clearSyncQueue(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    await tx.store.clear();
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['notes', 'todos', 'collections', 'sync_queue'], 'readwrite');
    await Promise.all([
      tx.objectStore('notes').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('collections').clear(),
      tx.objectStore('sync_queue').clear(),
    ]);
  }

  async getStorageStats(): Promise<{
    notes: number;
    todos: number;
    collections: number;
    syncQueue: number;
  }> {
    const db = this.ensureDB();
    const [notes, todos, collections, syncQueue] = await Promise.all([
      db.count('notes'),
      db.count('todos'),
      db.count('collections'),
      db.count('sync_queue'),
    ]);

    return { notes, todos, collections, syncQueue };
  }
}

// Singleton instance
export const indexedDB = new IndexedDBManager();