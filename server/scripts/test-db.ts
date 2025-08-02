import { db } from '../db';
import { notes } from '../../shared/schema';

async function test() {
  try {
    const testNotes = await db.select().from(notes).limit(1);
    console.log('Sample note columns:', Object.keys(testNotes[0] || {}));
    console.log('doc_json exists:', 'doc_json' in (testNotes[0] || {}));
    console.log('doc_json value:', testNotes[0]?.doc_json);
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

test();