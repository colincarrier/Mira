import { db } from '../db';
import { notes } from '../../shared/schema';
import { eq, isNull, sql } from 'drizzle-orm';

async function main() {
  console.log('Starting backfill of doc_json...');
  
  // Get all notes without doc_json
  const notesToBackfill = await db
    .select()
    .from(notes)
    .where(isNull(notes.doc_json));
  
  console.log(`Found ${notesToBackfill.length} notes to backfill`);
  
  for (const note of notesToBackfill) {
    try {
      // Extract title (first line or AI generated title)
      const title = note.aiGeneratedTitle || 
        note.content.split('\n')[0].slice(0, 100) || 
        'Untitled';
      
      // Create TipTap document structure
      const docJson = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: title }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: note.content }]
          }
        ]
      };
      
      // Update the note
      await db
        .update(notes)
        .set({ doc_json: docJson })
        .where(eq(notes.id, note.id));
      
      console.log(`✓ Backfilled note ${note.id}`);
    } catch (error) {
      console.error(`✗ Error backfilling note ${note.id}:`, error);
    }
  }
  
  console.log('Backfill complete!');
}

main().catch(e => {
  console.error('Backfill failed:', e);
  process.exit(1);
});