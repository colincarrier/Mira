import express from "express";
import { createServer } from "vite";
import path from "path";

export async function createSimpleDevServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(".", "client"),
    build: {
      outDir: path.resolve(".", "dist/public"),
    },
  });

  // Use Vite's middleware
  app.use(vite.middlewares);

  return { app, vite };
}