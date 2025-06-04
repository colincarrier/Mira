import { Express } from "express";
import express from "express";
import path from "path";

/**
 * Middleware to handle Vite asset requests properly in development
 * This ensures JavaScript modules are served with correct MIME types
 */
export function setupViteAssetMiddleware(app: Express) {
  // Handle Vite dependency modules with correct MIME types
  app.use('/node_modules/.vite', express.static(path.resolve('.', 'node_modules/.vite'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));

  // Middleware to prevent catch-all from intercepting Vite requests
  app.use((req, res, next) => {
    const url = req.originalUrl;
    
    // Let Vite handle its own routes
    if (url.startsWith('/@') || 
        url.startsWith('/src/') ||
        url.startsWith('/client/') ||
        (url.startsWith('/node_modules/') && url.includes('.js')) ||
        url.includes('?v=') || // Vite version queries
        url.includes('.tsx') ||
        url.includes('.ts') ||
        url.includes('.jsx') ||
        url.includes('.css') ||
        url.includes('.map')) {
      // Skip to next middleware without interference
      return next();
    }
    
    next();
  });
}