import { indexedDBManager } from './indexeddb';
import { apiRequest } from './queryClient';
import type { NoteWithTodos, Todo, Collection } from '@shared/schema';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingItems: number;
  conflictItems: number;
}

class SyncService {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private syncCallbacks: Set<(status: SyncStatus) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyStatusChange();
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange();
    });
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncWithServer();
      }
    }, 30000);
  }

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.syncCallbacks.delete(callback);
  }

  private async notifyStatusChange(): Promise<void> {
    const status = await this.getStatus();
    this.syncCallbacks.forEach(callback => callback(status));
  }

  async getStatus(): Promise<SyncStatus> {
    const syncQueue = await indexedDBManager.getSyncQueue();
    const conflictItems = await indexedDBManager.getConflictItems();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.getLastSyncTime(),
      pendingItems: syncQueue.length,
      conflictItems: conflictItems.length,
    };
  }

  private getLastSyncTime(): number | null {
    const lastSync = localStorage.getItem('mira-last-sync');
    return lastSync ? parseInt(lastSync) : null;
  }

  private setLastSyncTime(): void {
    localStorage.setItem('mira-last-sync', Date.now().toString());
  }

  async syncWithServer(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    await this.notifyStatusChange();

    try {
      // Step 1: Pull changes from server
      await this.pullFromServer();
      
      // Step 2: Push local changes to server
      await this.pushToServer();
      
      this.setLastSyncTime();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      await this.notifyStatusChange();
    }
  }

  private async pullFromServer(): Promise<void> {
    try {
      // Fetch latest data from server
      const [notesResponse, collectionsResponse] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/collections')
      ]);

      if (notesResponse.ok && collectionsResponse.ok) {
        const serverNotes: NoteWithTodos[] = await notesResponse.json();
        const serverCollections: Collection[] = await collectionsResponse.json();

        // Save server data to IndexedDB with 'synced' status
        await Promise.all([
          ...serverNotes.map(note => indexedDBManager.saveNote(note, 'synced')),
          ...serverCollections.map(collection => indexedDBManager.saveCollection(collection, 'synced'))
        ]);
      }
    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }

  private async pushToServer(): Promise<void> {
    const syncQueue = await indexedDBManager.getSyncQueue();

    for (const item of syncQueue) {
      try {
        await this.processSyncItem(item);
        await indexedDBManager.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item, error);
        // Increment retry count or handle conflict
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount > 3) {
          // Mark as conflict for manual resolution
          await this.markAsConflict(item);
        }
      }
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    const { type, table, data } = item;
    
    switch (table) {
      case 'notes':
        await this.syncNote(type, data);
        break;
      case 'todos':
        await this.syncTodo(type, data);
        break;
      case 'collections':
        await this.syncCollection(type, data);
        break;
    }
  }

  private async syncNote(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiRequest('POST', '/api/notes', data);
        break;
      case 'update':
        await apiRequest('PATCH', `/api/notes/${data.id}`, data);
        break;
      case 'delete':
        await apiRequest('DELETE', `/api/notes/${data.id}`);
        break;
    }
    
    if (data.id) {
      await indexedDBManager.markAsSynced('notes', data.id);
    }
  }

  private async syncTodo(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiRequest('POST', '/api/todos', data);
        break;
      case 'update':
        await apiRequest('PATCH', `/api/todos/${data.id}`, data);
        break;
      case 'delete':
        await apiRequest('DELETE', `/api/todos/${data.id}`);
        break;
    }
    
    if (data.id) {
      await indexedDBManager.markAsSynced('todos', data.id);
    }
  }

  private async syncCollection(type: string, data: any): Promise<void> {
    switch (type) {
      case 'create':
        await apiRequest('POST', '/api/collections', data);
        break;
      case 'update':
        await apiRequest('PATCH', `/api/collections/${data.id}`, data);
        break;
      case 'delete':
        await apiRequest('DELETE', `/api/collections/${data.id}`);
        break;
    }
    
    if (data.id) {
      await indexedDBManager.markAsSynced('collections', data.id);
    }
  }

  private async markAsConflict(item: any): Promise<void> {
    // Mark the item as having a conflict for manual resolution
    console.warn('Item marked as conflict:', item);
    // Implementation would depend on conflict resolution UI
  }

  // Manual operations for offline mode
  async createNoteOffline(note: Omit<NoteWithTodos, 'id'>): Promise<NoteWithTodos> {
    const offlineId = Date.now(); // Temporary ID for offline
    const noteWithId = { ...note, id: offlineId } as NoteWithTodos;
    
    await indexedDBManager.saveNote(noteWithId, 'pending');
    await indexedDBManager.addToSyncQueue('create', 'notes', noteWithId);
    
    return noteWithId;
  }

  async updateNoteOffline(id: number, updates: Partial<NoteWithTodos>): Promise<void> {
    const existingNote = await indexedDBManager.getNote(id);
    if (existingNote) {
      const updatedNote = { ...existingNote, ...updates };
      await indexedDBManager.saveNote(updatedNote, 'pending');
      await indexedDBManager.addToSyncQueue('update', 'notes', updatedNote);
    }
  }

  async deleteNoteOffline(id: number): Promise<void> {
    await indexedDBManager.deleteNote(id);
    // Sync queue item is added automatically in deleteNote method
  }

  async createTodoOffline(todo: Omit<Todo, 'id'>): Promise<Todo> {
    const offlineId = Date.now();
    const todoWithId = { ...todo, id: offlineId } as Todo;
    
    await indexedDBManager.saveTodo(todoWithId, 'pending');
    await indexedDBManager.addToSyncQueue('create', 'todos', todoWithId);
    
    return todoWithId;
  }

  async updateTodoOffline(id: number, updates: Partial<Todo>): Promise<void> {
    // Get existing todo from IndexedDB and update
    const todos = await indexedDBManager.getTodosByNoteId(updates.noteId || 0);
    const existingTodo = todos.find(t => t.id === id);
    
    if (existingTodo) {
      const updatedTodo = { ...existingTodo, ...updates };
      await indexedDBManager.saveTodo(updatedTodo, 'pending');
      await indexedDBManager.addToSyncQueue('update', 'todos', updatedTodo);
    }
  }

  async getNotesOffline(): Promise<NoteWithTodos[]> {
    return indexedDBManager.getNotes();
  }

  async getCollectionsOffline(): Promise<Collection[]> {
    return indexedDBManager.getCollections();
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncCallbacks.clear();
  }
}

export const syncService = new SyncService();