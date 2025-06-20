import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBManager } from '@/lib/indexeddb';
import { syncService } from '@/lib/sync-service';
import type { NoteWithTodos, Todo, Collection } from '@shared/schema';

interface OfflineState {
  // Data
  notes: NoteWithTodos[];
  collections: Collection[];
  pendingChanges: any[];
  
  // Sync status
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
  conflictItems: number;
  
  // Actions
  loadFromIndexedDB: () => Promise<void>;
  
  // Notes actions
  createNote: (note: Omit<NoteWithTodos, 'id'>) => Promise<NoteWithTodos>;
  updateNote: (id: number, updates: Partial<NoteWithTodos>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  
  // Todo actions
  createTodo: (todo: Omit<Todo, 'id'>) => Promise<Todo>;
  updateTodo: (id: number, updates: Partial<Todo>) => Promise<void>;
  
  // Collection actions
  createCollection: (collection: Omit<Collection, 'id'>) => Promise<Collection>;
  updateCollection: (id: number, updates: Partial<Collection>) => Promise<void>;
  
  // Sync actions
  syncWithServer: () => Promise<void>;
  updateSyncStatus: (status: Partial<OfflineState>) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      collections: [],
      pendingChanges: [],
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      pendingItems: 0,
      conflictItems: 0,

      // Load data from IndexedDB
      loadFromIndexedDB: async () => {
        try {
          await indexedDBManager.initialize();
          const [notes, collections] = await Promise.all([
            indexedDBManager.getNotes(),
            indexedDBManager.getCollections()
          ]);
          
          set({ notes, collections });
        } catch (error) {
          console.error('Failed to load from IndexedDB:', error);
        }
      },

      // Notes actions
      createNote: async (noteData) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            // Try online first
            const response = await fetch('/api/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(noteData),
            });
            
            if (response.ok) {
              const newNote = await response.json();
              await indexedDBManager.saveNote(newNote, 'synced');
              set(state => ({ notes: [...state.notes, newNote] }));
              return newNote;
            }
          } catch (error) {
            console.warn('Online creation failed, falling back to offline:', error);
          }
        }
        
        // Offline creation
        const newNote = await syncService.createNoteOffline(noteData);
        set(state => ({ notes: [...state.notes, newNote] }));
        return newNote;
      },

      updateNote: async (id, updates) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch(`/api/notes/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (response.ok) {
              const updatedNote = await response.json();
              await indexedDBManager.saveNote(updatedNote, 'synced');
              set(state => ({
                notes: state.notes.map(note => 
                  note.id === id ? updatedNote : note
                )
              }));
              return;
            }
          } catch (error) {
            console.warn('Online update failed, falling back to offline:', error);
          }
        }
        
        // Offline update
        await syncService.updateNoteOffline(id, updates);
        set(state => ({
          notes: state.notes.map(note => 
            note.id === id ? { ...note, ...updates } : note
          )
        }));
      },

      deleteNote: async (id) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch(`/api/notes/${id}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              await indexedDBManager.deleteNote(id);
              set(state => ({
                notes: state.notes.filter(note => note.id !== id)
              }));
              return;
            }
          } catch (error) {
            console.warn('Online deletion failed, falling back to offline:', error);
          }
        }
        
        // Offline deletion
        await syncService.deleteNoteOffline(id);
        set(state => ({
          notes: state.notes.filter(note => note.id !== id)
        }));
      },

      // Todo actions
      createTodo: async (todoData) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch('/api/todos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(todoData),
            });
            
            if (response.ok) {
              const newTodo = await response.json();
              await indexedDBManager.saveTodo(newTodo, 'synced');
              
              // Update the note with the new todo
              set(state => ({
                notes: state.notes.map(note => 
                  note.id === todoData.noteId 
                    ? { ...note, todos: [...note.todos, newTodo] }
                    : note
                )
              }));
              
              return newTodo;
            }
          } catch (error) {
            console.warn('Online todo creation failed, falling back to offline:', error);
          }
        }
        
        // Offline creation
        const newTodo = await syncService.createTodoOffline(todoData);
        set(state => ({
          notes: state.notes.map(note => 
            note.id === todoData.noteId 
              ? { ...note, todos: [...note.todos, newTodo] }
              : note
          )
        }));
        
        return newTodo;
      },

      updateTodo: async (id, updates) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch(`/api/todos/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (response.ok) {
              const updatedTodo = await response.json();
              await indexedDBManager.saveTodo(updatedTodo, 'synced');
              
              // Update the todo in the note
              set(state => ({
                notes: state.notes.map(note => ({
                  ...note,
                  todos: note.todos.map(todo => 
                    todo.id === id ? updatedTodo : todo
                  )
                }))
              }));
              
              return;
            }
          } catch (error) {
            console.warn('Online todo update failed, falling back to offline:', error);
          }
        }
        
        // Offline update
        await syncService.updateTodoOffline(id, updates);
        set(state => ({
          notes: state.notes.map(note => ({
            ...note,
            todos: note.todos.map(todo => 
              todo.id === id ? { ...todo, ...updates } : todo
            )
          }))
        }));
      },

      // Collection actions
      createCollection: async (collectionData) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch('/api/collections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(collectionData),
            });
            
            if (response.ok) {
              const newCollection = await response.json();
              await indexedDBManager.saveCollection(newCollection, 'synced');
              set(state => ({ collections: [...state.collections, newCollection] }));
              return newCollection;
            }
          } catch (error) {
            console.warn('Online collection creation failed, falling back to offline:', error);
          }
        }
        
        // Offline creation
        const offlineId = Date.now();
        const newCollection = { ...collectionData, id: offlineId } as Collection;
        await indexedDBManager.saveCollection(newCollection, 'pending');
        await indexedDBManager.addToSyncQueue('create', 'collections', newCollection);
        


// Process offline voice notes when connection is restored
async function processOfflineVoiceNotes() {
  const state = useOfflineStore.getState();
  const offlineVoiceNotes = state.notes.filter(note => 
    note.isOffline && note.mode === 'voice' && note.audioBlob
  );

  for (const note of offlineVoiceNotes) {
    try {
      // Convert to FormData and send to server
      const formData = new FormData();
      formData.append("audio", note.audioBlob, "recording.webm");
      formData.append("duration", note.recordingDuration?.toString() || "0");
      
      const response = await fetch("/api/notes/voice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (response.ok) {
        const processedNote = await response.json();
        
        // Update the note with processed content
        await state.updateNote(note.id, {
          content: processedNote.content,
          transcription: processedNote.transcription,
          audioUrl: processedNote.audioUrl,
          aiEnhanced: processedNote.aiEnhanced,
          aiSuggestion: processedNote.aiSuggestion,
          aiContext: processedNote.aiContext,
          isOffline: false,
          isProcessing: false
        });
        
        console.log(`Processed offline voice note: ${note.id}`);
      }
    } catch (error) {
      console.error(`Failed to process offline voice note ${note.id}:`, error);
    }
  }
}

        set(state => ({ collections: [...state.collections, newCollection] }));
        return newCollection;
      },

      updateCollection: async (id, updates) => {
        const state = get();
        
        if (state.isOnline) {
          try {
            const response = await fetch(`/api/collections/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });
            
            if (response.ok) {
              const updatedCollection = await response.json();
              await indexedDBManager.saveCollection(updatedCollection, 'synced');
              set(state => ({
                collections: state.collections.map(collection => 
                  collection.id === id ? updatedCollection : collection
                )
              }));
              return;
            }
          } catch (error) {
            console.warn('Online collection update failed, falling back to offline:', error);
          }
        }
        
        // Offline update
        const existingCollection = state.collections.find(c => c.id === id);
        if (existingCollection) {
          const updatedCollection = { ...existingCollection, ...updates };
          await indexedDBManager.saveCollection(updatedCollection, 'pending');
          await indexedDBManager.addToSyncQueue('update', 'collections', updatedCollection);
          
          set(state => ({
            collections: state.collections.map(collection => 
              collection.id === id ? updatedCollection : collection
            )
          }));
        }
      },

      // Sync actions
      syncWithServer: async () => {
        await syncService.syncWithServer();
        
        // Process offline voice notes
        await processOfflineVoiceNotes();
        
        // Reload data after sync
        const { loadFromIndexedDB } = get();
        await loadFromIndexedDB();
      },

      updateSyncStatus: (status) => {
        set(status);
      },
    }),
    {
      name: 'mira-offline-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist the sync status, not the actual data
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Initialize the store and sync service
export const initializeOfflineStore = async () => {
  const store = useOfflineStore.getState();
  
  // Load initial data from IndexedDB
  await store.loadFromIndexedDB();
  
  // Set up sync service status updates
  syncService.onStatusChange((status) => {
    store.updateSyncStatus({
      isOnline: status.isOnline,
      isSyncing: status.isSyncing,
      lastSyncTime: status.lastSyncTime,
      pendingItems: status.pendingItems,
      conflictItems: status.conflictItems,
    });
  });
  
  // Initial sync if online
  if (navigator.onLine) {
    await store.syncWithServer();
  }
};