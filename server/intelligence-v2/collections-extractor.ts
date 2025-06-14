import { storage } from '../storage.js';

export class CollectionsExtractor {
  static async extract(noteId: number, text: string) {
    // naive list detector (bullets or "X, Y, Z")
    const bulletMatch = text.match(/-\s(.+)/g);
    const inlineList = text.includes(',') ? text.split(',') : [];
    const items = bulletMatch ? bulletMatch.map(l => l.replace(/-\s/, '')) : inlineList;

    if (!items.length) return;

    // simple "Books" heuristic – refine in later iterations
    const title = 'Untitled Collection';
    
    try {
      const collection = await storage.createCollection({
        name: title,
        icon: 'folder',
        collectionType: 'generic'
      });

      for (const [i, raw] of items.entries()) {
        // Store collection items - would need to implement in storage if needed
        console.log(`Collection item ${i}: ${raw.trim()}`);
      }
    } catch (error) {
      console.warn('Collection extraction failed:', error);
    }
  }
}
