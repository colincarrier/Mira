// ==========================================
// MIRA AI - CORE SYSTEM FILES
// ==========================================

// SERVER ENTRY POINT (server/index.ts)
// Load environment variables first
import "dotenv/config";

// Set Intelligence-V2 flags explicitly
process.env.FEATURE_INTELLIGENCE_V2 = 'true';
process.env.FEATURE_VECTOR_SEARCH = 'true';
process.env.FEATURE_RECURSIVE_REASONING = 'true';
process.env.FEATURE_RELATIONSHIP_MAPPING = 'true';
process.env.FEATURE_PROACTIVE_DELIVERY = 'true';
process.env.FEATURE_ENHANCED_COLLECTIONS = 'true';
process.env.FEATURE_ADVANCED_NOTIFICATIONS = 'true';

import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { initializeStandardCollections } from "./init-collections";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize server
(async () => {
  await initializeDatabase();
  await initializeStandardCollections();

  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, async () => {
    log(`serving on port ${port}`);

    try {
      const { initializeNotificationSystem } = await import('./notification-system');
      await initializeNotificationSystem();
    } catch (error) {
      console.error("Failed to initialize notification system:", error);
    }
  });
})();

// ==========================================
// CLIENT ENTRY POINT (client/src/main.tsx)
// ==========================================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ==========================================
// CLIENT APP COMPONENT (client/src/App.tsx)
// ==========================================
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
import Remind from "@/pages/remind";
import Profile from "@/pages/profile";
import NoteDetail from "@/pages/note-detail";
import CollectionDetail from "@/pages/collection-detail";
import TodoDetail from "@/pages/todo-detail";
import NotFound from "@/pages/not-found";

export default function App() {
  useEffect(() => {
    const initializeOfflineFeatures = async () => {
      try {
        await offlineStorage.init();
        await serviceWorkerManager.init();
        
        const interval = setInterval(() => {
          offlineStorage.clearStaleEntries();
        }, 5 * 60 * 1000);
        
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
              <Route path="/" component={Notes} />
              <Route path="/remind" component={Remind} />
              <Route path="/profile" component={Profile} />
              <Route path="/notes/:id" component={NoteDetail} />
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