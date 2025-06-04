import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NoteWithTodos, Todo, Collection } from '@shared/schema';

export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  type: 'note' | 'todo' | 'collection';
  data: any;
  timestamp: number;
  retries: number;
}

interface AppState {
  // Data
  notes: NoteWithTodos[];
  todos: Todo[];
  collections: Collection[];
  
  // App State
  isOffline: boolean;
  isLoading: boolean;
  lastSync: number;
  syncQueue: SyncOperation[];
  
  // UI State
  activeTab: 'activity' | 'todos' | 'collections' | 'settings';
  showCapture: boolean;
  selectedNote: number | null;
  
  // Actions
  setNotes: (notes: NoteWithTodos[]) => void;
  addNote: (note: NoteWithTodos) => void;
  updateNote: (id: number, updates: Partial<NoteWithTodos>) => void;
  deleteNote: (id: number) => void;
  
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: number, updates: Partial<Todo>) => void;
  deleteTodo: (id: number) => void;
  
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: number, updates: Partial<Collection>) => void;
  deleteCollection: (id: number) => void;
  
  // Sync operations
  setOfflineStatus: (isOffline: boolean) => void;
  setLoading: (loading: boolean) => void;
  addToSyncQueue: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>) => void;
  processSyncQueue: () => Promise<void>;
  clearSyncQueue: () => void;
  updateLastSync: () => void;
  
  // UI actions
  setActiveTab: (tab: 'activity' | 'todos' | 'collections' | 'settings') => void;
  setShowCapture: (show: boolean) => void;
  setSelectedNote: (id: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      todos: [],
      collections: [],
      isOffline: !navigator.onLine,
      isLoading: false,
      lastSync: 0,
      syncQueue: [],
      activeTab: 'activity',
      showCapture: false,
      selectedNote: null,

      // Data actions
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => {
        set((state) => ({ notes: [...state.notes, note] }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'create', type: 'note', data: note });
        }
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map(note => 
            note.id === id ? { ...note, ...updates } : note
          )
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'update', type: 'note', data: { id, updates } });
        }
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          todos: state.todos.filter(todo => todo.noteId !== id)
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'delete', type: 'note', data: { id } });
        }
      },

      setTodos: (todos) => set({ todos }),
      
      addTodo: (todo) => {
        set((state) => ({ todos: [...state.todos, todo] }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'create', type: 'todo', data: todo });
        }
      },
      
      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map(todo => 
            todo.id === id ? { ...todo, ...updates } : todo
          )
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'update', type: 'todo', data: { id, updates } });
        }
      },
      
      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter(todo => todo.id !== id)
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'delete', type: 'todo', data: { id } });
        }
      },

      setCollections: (collections) => set({ collections }),
      
      addCollection: (collection) => {
        set((state) => ({ collections: [...state.collections, collection] }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'create', type: 'collection', data: collection });
        }
      },
      
      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map(collection => 
            collection.id === id ? { ...collection, ...updates } : collection
          )
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'update', type: 'collection', data: { id, updates } });
        }
      },
      
      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter(collection => collection.id !== id)
        }));
        if (!get().isOffline) {
          get().addToSyncQueue({ operation: 'delete', type: 'collection', data: { id } });
        }
      },

      // Sync operations
      setOfflineStatus: (isOffline) => set({ isOffline }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      addToSyncQueue: (operation) => {
        const syncOp: SyncOperation = {
          ...operation,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          retries: 0
        };
        set((state) => ({ 
          syncQueue: [...state.syncQueue, syncOp] 
        }));
      },
      
      processSyncQueue: async () => {
        const { syncQueue } = get();
        if (syncQueue.length === 0) return;

        set({ isLoading: true });
        
        for (const operation of syncQueue) {
          try {
            const response = await fetch(`/api/${operation.type}s${operation.operation === 'create' ? '' : `/${operation.data.id}`}`, {
              method: operation.operation === 'create' ? 'POST' : 
                     operation.operation === 'update' ? 'PATCH' : 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: operation.operation === 'delete' ? undefined : JSON.stringify(operation.data)
            });

            if (response.ok) {
              // Remove successful operation from queue
              set((state) => ({
                syncQueue: state.syncQueue.filter(op => op.id !== operation.id)
              }));
            } else {
              // Increment retry count
              set((state) => ({
                syncQueue: state.syncQueue.map(op => 
                  op.id === operation.id ? { ...op, retries: op.retries + 1 } : op
                )
              }));
            }
          } catch (error) {
            console.error('Sync operation failed:', error);
            // Increment retry count
            set((state) => ({
              syncQueue: state.syncQueue.map(op => 
                op.id === operation.id ? { ...op, retries: op.retries + 1 } : op
              )
            }));
          }
        }
        
        set({ isLoading: false });
        get().updateLastSync();
      },
      
      clearSyncQueue: () => set({ syncQueue: [] }),
      
      updateLastSync: () => set({ lastSync: Date.now() }),

      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowCapture: (show) => set({ showCapture: show }),
      setSelectedNote: (id) => set({ selectedNote: id })
    }),
    {
      name: 'mira-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notes: state.notes,
        todos: state.todos,
        collections: state.collections,
        lastSync: state.lastSync,
        syncQueue: state.syncQueue,
        activeTab: state.activeTab
      })
    }
  )
);

// Network monitoring setup
export const setupNetworkMonitoring = () => {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    useAppStore.getState().setOfflineStatus(!isOnline);
    
    if (isOnline) {
      // Process sync queue when coming back online
      useAppStore.getState().processSyncQueue();
    }
  };
  
  // Set initial status
  updateOnlineStatus();
  
  // Listen for network changes
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Cleanup function
  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
};