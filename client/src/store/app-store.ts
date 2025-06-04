import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Note, Todo, Collection, NoteWithTodos } from '@shared/schema';

// IndexedDB Schema
interface MiraDB extends DBSchema {
  notes: {
    key: number;
    value: Note;
    indexes: { 'by-updated': string };
  };
  todos: {
    key: number;
    value: Todo;
    indexes: { 'by-note': number };
  };
  collections: {
    key: number;
    value: Collection;
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      table: 'notes' | 'todos' | 'collections';
      data: any;
      timestamp: number;
    };
  };
}

// Application State Interface
interface AppState {
  notes: NoteWithTodos[];
  todos: Todo[];
  collections: Collection[];
  isOffline: boolean;
  isLoading: boolean;
  lastSync: number;
  syncQueue: any[];
  
  setNotes: (notes: NoteWithTodos[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: number, updates: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: number, updates: Partial<Todo>) => void;
  deleteTodo: (id: number) => void;
  
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: number, updates: Partial<Collection>) => void;
  
  queueSync: (operation: any) => void;
  processSyncQueue: () => Promise<void>;
  setOfflineStatus: (isOffline: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

// Local storage operations
class LocalDB {
  private db: IDBPDatabase<MiraDB> | null = null;

  async init() {
    this.db = await openDB<MiraDB>('mira-db', 1, {
      upgrade(db) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-updated', 'updatedAt');

        const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
        todosStore.createIndex('by-note', 'noteId');

        db.createObjectStore('collections', { keyPath: 'id' });
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      },
    });
  }

  async saveNotes(notes: Note[]) {
    if (!this.db) return;
    const tx = this.db.transaction('notes', 'readwrite');
    await Promise.all(notes.map(note => tx.store.put(note)));
  }

  async getNotes(): Promise<Note[]> {
    if (!this.db) return [];
    return await this.db.getAll('notes');
  }

  async saveTodos(todos: Todo[]) {
    if (!this.db) return;
    const tx = this.db.transaction('todos', 'readwrite');
    await Promise.all(todos.map(todo => tx.store.put(todo)));
  }

  async getTodos(): Promise<Todo[]> {
    if (!this.db) return [];
    return await this.db.getAll('todos');
  }

  async saveCollections(collections: Collection[]) {
    if (!this.db) return;
    const tx = this.db.transaction('collections', 'readwrite');
    await Promise.all(collections.map(collection => tx.store.put(collection)));
  }

  async getCollections(): Promise<Collection[]> {
    if (!this.db) return [];
    return await this.db.getAll('collections');
  }
}

const localDB = new LocalDB();
localDB.init().catch(console.error);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      notes: [],
      todos: [],
      collections: [],
      isOffline: false,
      isLoading: false,
      lastSync: 0,
      syncQueue: [],

      setNotes: (notes) => {
        set({ notes });
        localDB.saveNotes(notes.map(n => ({ ...n, todos: undefined })));
      },

      addNote: (note) => {
        const notes = [...get().notes, { ...note, todos: [] }];
        set({ notes });
        localDB.saveNotes([note]);
      },

      updateNote: (id, updates) => {
        const notes = get().notes.map(note => 
          note.id === id ? { ...note, ...updates } : note
        );
        set({ notes });
      },

      deleteNote: (id) => {
        const notes = get().notes.filter(note => note.id !== id);
        set({ notes });
      },

      setTodos: (todos) => {
        set({ todos });
        localDB.saveTodos(todos);
      },

      addTodo: (todo) => {
        const todos = [...get().todos, todo];
        set({ todos });
        localDB.saveTodos([todo]);
      },

      updateTodo: (id, updates) => {
        const todos = get().todos.map(todo => 
          todo.id === id ? { ...todo, ...updates } : todo
        );
        set({ todos });
      },

      deleteTodo: (id) => {
        const todos = get().todos.filter(todo => todo.id !== id);
        set({ todos });
      },

      setCollections: (collections) => {
        set({ collections });
        localDB.saveCollections(collections);
      },

      addCollection: (collection) => {
        const collections = [...get().collections, collection];
        set({ collections });
        localDB.saveCollections([collection]);
      },

      updateCollection: (id, updates) => {
        const collections = get().collections.map(collection => 
          collection.id === id ? { ...collection, ...updates } : collection
        );
        set({ collections });
      },

      queueSync: (operation) => {
        const syncQueue = [...get().syncQueue, operation];
        set({ syncQueue });
      },

      processSyncQueue: async () => {
        const { syncQueue } = get();
        if (syncQueue.length === 0) return;

        try {
          for (const operation of syncQueue) {
            console.log('Processing sync operation:', operation);
          }
          
          set({ syncQueue: [], lastSync: Date.now() });
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },

      setOfflineStatus: (isOffline) => set({ isOffline }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mira-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const initializeStore = async () => {
  try {
    const [notes, todos, collections] = await Promise.all([
      localDB.getNotes(),
      localDB.getTodos(),
      localDB.getCollections(),
    ]);

    const notesWithTodos = notes.map(note => ({
      ...note,
      todos: todos.filter(todo => todo.noteId === note.id),
    }));

    useAppStore.getState().setNotes(notesWithTodos);
    useAppStore.getState().setTodos(todos);
    useAppStore.getState().setCollections(collections);
  } catch (error) {
    console.error('Failed to initialize store:', error);
  }
};

export const setupNetworkMonitoring = () => {
  const updateOnlineStatus = () => {
    useAppStore.getState().setOfflineStatus(!navigator.onLine);
    
    if (navigator.onLine) {
      useAppStore.getState().processSyncQueue();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
};