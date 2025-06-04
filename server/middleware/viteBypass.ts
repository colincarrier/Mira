// server/middleware/viteBypass.ts
import { Request, Response, NextFunction } from "express";

export function viteBypass(req: Request, res: Response, next: NextFunction) {
  const url = req.originalUrl;

  // If URL is requesting Vite's HMR client or any .js/.css/.map modules…
  if (
    url.startsWith("/@vite/") ||
    url.endsWith(".js") ||
    url.endsWith(".ts") ||
    url.endsWith(".tsx") ||
    url.endsWith(".jsx") ||
    url.endsWith(".css") ||
    url.endsWith(".map") ||
    url.endsWith(".json")
  ) {
    // Skip ahead to Vite's middleware without hitting the HTML fallback
    return next("route");
  }

  // Otherwise, proceed normally (will eventually hit Vite's index.html fallback)
  return next();
}