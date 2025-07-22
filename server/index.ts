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

(async () => {
  // Initialize database with default collections
  await initializeDatabase();
  await initializeStandardCollections();

  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Stage-3B Task Retrieval API
  const tasksRouter = await import('./api/v3/tasks/router.js');
  app.use('/api/v3/tasks', tasksRouter.default);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Use Replit's assigned PORT for preview pane compatibility, fallback to 5000
  const port = Number(process.env.PORT) || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, async () => {
    log(`serving on port ${port}`);

    // Initialize notification system
    try {
      const { initializeNotificationSystem } = await import('./notification-system');
      await initializeNotificationSystem();
    } catch (error) {
      console.error("Failed to initialize notification system:", error);
    }
  });
})();