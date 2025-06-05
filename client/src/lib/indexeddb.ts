import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { NoteWithTodos, Todo, Collection } from '@shared/schema';

interface MiraDBSchema extends DBSchema {
  notes: {
    key: number;
    value: NoteWithTodos & {
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: { 'by-sync-status': string; 'by-collection': number };
  };
  todos: {
    key: number;
    value: Todo & {
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: { 'by-note': number; 'by-sync-status': string };
  };
  collections: {
    key: number;
    value: Collection & {
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastModified: number;
    };
    indexes: { 'by-sync-status': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      table: 'notes' | 'todos' | 'collections';
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<MiraDBSchema> | null = null;
  private dbName = 'mira-offline-db';
  private version = 1;

  async initialize(): Promise<void> {
    this.db = await openDB<MiraDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Notes store
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-sync-status', 'syncStatus');
        notesStore.createIndex('by-collection', 'collectionId');

        // Todos store
        const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
        todosStore.createIndex('by-note', 'noteId');
        todosStore.createIndex('by-sync-status', 'syncStatus');

        // Collections store
        const collectionsStore = db.createObjectStore('collections', { keyPath: 'id' });
        collectionsStore.createIndex('by-sync-status', 'syncStatus');

        // Sync queue store
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      },
    });
  }

  async addToSyncQueue(type: 'create' | 'update' | 'delete', table: 'notes' | 'todos' | 'collections', data: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const queueItem = {
      id: `${table}-${type}-${data.id || Date.now()}-${Math.random()}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.db!.add('syncQueue', queueItem);
  }

  // Notes operations
  async saveNote(note: NoteWithTodos, syncStatus: 'synced' | 'pending' = 'pending'): Promise<void> {
    if (!this.db) await this.initialize();
    
    const noteWithMeta = {
      ...note,
      syncStatus,
      lastModified: Date.now(),
    };

    await this.db!.put('notes', noteWithMeta);
    
    if (syncStatus === 'pending') {
      await this.addToSyncQueue('update', 'notes', note);
    }
  }

  async getNotes(): Promise<NoteWithTodos[]> {
    if (!this.db) await this.initialize();
    
    const notes = await this.db!.getAll('notes');
    return notes.map(note => {
      const { syncStatus, lastModified, ...cleanNote } = note;
      return cleanNote as NoteWithTodos;
    });
  }

  async getNote(id: number): Promise<NoteWithTodos | undefined> {
    if (!this.db) await this.initialize();
    
    const note = await this.db!.get('notes', id);
    if (!note) return undefined;
    
    const { syncStatus, lastModified, ...cleanNote } = note;
    return cleanNote as NoteWithTodos;
  }

  async deleteNote(id: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    await this.db!.delete('notes', id);
    await this.addToSyncQueue('delete', 'notes', { id });
  }

  // Collections operations
  async saveCollection(collection: Collection, syncStatus: 'synced' | 'pending' = 'pending'): Promise<void> {
    if (!this.db) await this.initialize();
    
    const collectionWithMeta = {
      ...collection,
      syncStatus,
      lastModified: Date.now(),
    };

    await this.db!.put('collections', collectionWithMeta);
    
    if (syncStatus === 'pending') {
      await this.addToSyncQueue('update', 'collections', collection);
    }
  }

  async getCollections(): Promise<Collection[]> {
    if (!this.db) await this.initialize();
    
    const collections = await this.db!.getAll('collections');
    return collections.map(collection => {
      const { syncStatus, lastModified, ...cleanCollection } = collection;
      return cleanCollection as Collection;
    });
  }

  // Todos operations
  async saveTodo(todo: Todo, syncStatus: 'synced' | 'pending' = 'pending'): Promise<void> {
    if (!this.db) await this.initialize();
    
    const todoWithMeta = {
      ...todo,
      syncStatus,
      lastModified: Date.now(),
    };

    await this.db!.put('todos', todoWithMeta);
    
    if (syncStatus === 'pending') {
      await this.addToSyncQueue('update', 'todos', todo);
    }
  }

  async getTodosByNoteId(noteId: number): Promise<Todo[]> {
    if (!this.db) await this.initialize();
    
    const todos = await this.db!.getAllFromIndex('todos', 'by-note', noteId);
    return todos.map(todo => {
      const { syncStatus, lastModified, ...cleanTodo } = todo;
      return cleanTodo as Todo;
    });
  }

  // Sync operations
  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('syncQueue');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete('syncQueue', id);
  }

  async markAsSynced(table: 'notes' | 'todos' | 'collections', id: number): Promise<void> {
    if (!this.db) await this.initialize();
    
    const item = await this.db!.get(table, id);
    if (item) {
      item.syncStatus = 'synced';
      item.lastModified = Date.now();
      await this.db!.put(table, item);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize();
    
    const tx = this.db!.transaction(['notes', 'todos', 'collections', 'syncQueue'], 'readwrite');
    await Promise.all([
      tx.objectStore('notes').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('collections').clear(),
      tx.objectStore('syncQueue').clear(),
    ]);
  }

  // Conflict resolution
  async getConflictItems(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    const notes = await this.db!.getAllFromIndex('notes', 'by-sync-status', 'conflict');
    const todos = await this.db!.getAllFromIndex('todos', 'by-sync-status', 'conflict');
    const collections = await this.db!.getAllFromIndex('collections', 'by-sync-status', 'conflict');
    
    return [...notes, ...todos, ...collections];
  }

  async resolveConflict(table: 'notes' | 'todos' | 'collections', id: number, resolution: 'local' | 'server'): Promise<void> {
    if (!this.db) await this.initialize();
    
    const item = await this.db!.get(table, id);
    if (item && item.syncStatus === 'conflict') {
      if (resolution === 'local') {
        item.syncStatus = 'pending';
        await this.addToSyncQueue('update', table, item);
      } else {
        item.syncStatus = 'synced';
      }
      await this.db!.put(table, item);
    }
  }
}

export const indexedDBManager = new IndexedDBManager();