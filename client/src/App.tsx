import React from "react";
import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import DevCacheDebugger from "@/components/dev-cache-debugger";
import { offlineStorage, serviceWorkerManager } from "@/store/offline-storage";
import { useEffect } from "react";

// Import pages
import Notes from "@/pages/notes";
import DebugNotes from "@/pages/debug-notes";
import Remind from "@/pages/remind";

import Profile from "@/pages/profile";
import NoteDetailSimple from "@/components/NoteDetailSimple";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import NotFound from "@/pages/not-found";

export default function App() {
  // Initialize offline storage and service worker (conditional for production)
  useEffect(() => {
    const initializeOfflineFeatures = async () => {
      try {
        // Always initialize offline storage (used for caching)
        await offlineStorage.init();
        
        // Only initialize service worker in production
        if (import.meta.env.PROD) {
          await serviceWorkerManager.init();
          console.log('Service Worker initialized in production mode');
        } else {
          // In development, unregister any existing service workers
          // This prevents caching issues and improves HMR
          console.log('Service Worker disabled in development mode');
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log('Unregistered service worker:', registration.scope);
            }
          }
        }
        
        // Clean stale cache entries periodically
        const interval = setInterval(() => {
          offlineStorage.clearStaleEntries();
        }, 5 * 60 * 1000); // Every 5 minutes
        
        return () => clearInterval(interval);
      } catch (error) {
        console.warn('Failed to initialize offline features:', error);
      }
    };
    
    initializeOfflineFeatures();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-[#f1efe8]">
            <Switch>
              <Route path="/debug" component={DebugNotes} />
              <Route path="/" component={Notes} />
              <Route path="/remind" component={Remind} />
              <Route path="/profile" component={Profile} />
              <Route path="/notes/:id">{(params) => <NoteDetail />}</Route>
              <Route path="/collection/:id" component={CollectionDetail} />
              <Route path="/todo/:id" component={TodoDetail} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}