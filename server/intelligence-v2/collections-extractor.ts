import { db } from '../storage.js';
import { collections, collectionItems } from '@shared/schema';

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
      const [{ id: collectionId }] = await db
        .insert(collections)
        .values({ name: title, collectionType: 'generic' })
        .returning();

      for (let i = 0; i < items.length; i++) {
        const raw = items[i];
        await db.insert(collectionItems).values({
          collectionId: collectionId,
          sourceNoteId: noteId,
          rawText: raw.trim(),
          position: i
        });
      }
    } catch (error) {
      console.warn('Collection extraction failed:', error);
    }
  }
}
