// Quick script to process notes 601 and 602 with V3
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function processWithV3(noteId) {
  console.log(`🎯 Processing note ${noteId} with V3...`);
  
  const client = await pool.connect();
  try {
    // Get note content
    const { rows: [note] } = await client.query('SELECT content FROM notes WHERE id = $1', [noteId]);
    if (!note) {
      console.log(`❌ Note ${noteId} not found`);
      return;
    }
    
    console.log(`📝 Note ${noteId} content: "${note.content}"`);
    
    // Make HTTP request to V3 queue processing
    const response = await fetch(`http://localhost:5000/api/notes/${noteId}/v3-process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instruction: "Process with V3 analysis",
        existingContent: note.content
      })
    });
    
    if (response.ok) {
      console.log(`✅ Note ${noteId} successfully processed with V3`);
      const result = await response.text();
      console.log(`📊 Response: ${result.substring(0, 200)}...`);
    } else {
      console.log(`❌ Note ${noteId} V3 processing failed: ${response.status}`);
      const error = await response.text();
      console.log(`🚨 Error: ${error.substring(0, 200)}...`);
    }
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Starting V3 processing for notes 601 and 602...');
  
  try {
    await processWithV3(601);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await processWithV3(602);
    console.log('✅ V3 processing complete!');
  } catch (error) {
    console.error('❌ V3 processing failed:', error);
  } finally {
    await pool.end();
  }
}

main();