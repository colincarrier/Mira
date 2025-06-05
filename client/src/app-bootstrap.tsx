import React, { useEffect, useState, ReactNode } from 'react';
import { useAppStore, setupNetworkMonitoring } from './store/app-store';
import { indexedDB } from './store/indexeddb';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';

interface AppBootstrapProps {
  children: ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { 
    isOffline, 
    isLoading, 
    syncQueue, 
    setNotes, 
    setTodos, 
    setCollections 
  } = useAppStore();

  useEffect(() => {
    let networkCleanup: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        // Initialize IndexedDB
        await indexedDB.init();
        
        // Load data from IndexedDB first (for offline-first experience)
        const [notes, todos, collections] = await Promise.all([
          indexedDB.getAllNotes(),
          indexedDB.getAllTodos(),
          indexedDB.getAllCollections()
        ]);

        // Update store with local data
        setNotes(notes);
        setTodos(todos);
        setCollections(collections);

        // Setup network monitoring
        networkCleanup = setupNetworkMonitoring();

        // If online, sync with server
        if (navigator.onLine) {
          try {
            // Fetch latest data from server
            const [serverNotes, serverTodos, serverCollections] = await Promise.all([
              fetch('/api/notes').then(r => r.json()),
              fetch('/api/todos').then(r => r.json()),
              fetch('/api/collections').then(r => r.json())
            ]);

            // Update both local storage and store
            await Promise.all([
              ...serverNotes.map((note: any) => indexedDB.saveNote(note)),
              ...serverTodos.map((todo: any) => indexedDB.saveTodo(todo)),
              ...serverCollections.map((collection: any) => indexedDB.saveCollection(collection))
            ]);

            setNotes(serverNotes);
            setTodos(serverTodos);
            setCollections(serverCollections);
          } catch (serverError) {
            console.warn('Server sync failed, using local data:', serverError);
            // Continue with local data
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
      }
    };

    initializeApp();

    return () => {
      if (networkCleanup) {
        networkCleanup();
      }
    };
  }, [setNotes, setTodos, setCollections]);



  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Initialization Failed
            </h2>
          </div>
          
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            {initError}
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Initializing Mira...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}