// Stage-4A Queue Enhancement Test
const fetch = require('node-fetch');

async function testStage4AQueue() {
  try {
    console.log('🧪 Testing Stage-4A Enhancement Queue...');
    
    // 1. Create a test note via API
    const response = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Order quest chips, purple ones, need them by tomorrow for the party',
        mode: 'text'
      })
    });
    
    const note = await response.json();
    console.log('✅ Note created:', note.id);
    console.log('📝 Content:', note.content.substring(0, 50) + '...');
    
    // 2. Wait for queue processing (10 seconds)
    console.log('⏳ Waiting 10 seconds for queue worker...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 3. Check if note was enhanced
    const noteResponse = await fetch(`http://localhost:5000/api/notes/${note.id}`);
    const enhancedNote = await noteResponse.json();
    
    console.log('🔍 Enhanced note check:');
    console.log('- AI Enhanced:', enhancedNote.aiEnhanced);
    console.log('- Has Rich Context:', !!enhancedNote.richContext);
    console.log('- Processing Complete:', !enhancedNote.isProcessing);
    
    if (enhancedNote.aiEnhanced) {
      console.log('✅ SUCCESS: Note was enhanced by Stage-4A queue!');
      
      // Check for extracted tasks
      const tasksResponse = await fetch('http://localhost:5000/api/todos');
      const todos = await tasksResponse.json();
      const relatedTasks = todos.filter(t => t.noteId === note.id);
      
      console.log(`📋 Tasks extracted: ${relatedTasks.length}`);
      relatedTasks.forEach(task => {
        console.log(`  - "${task.title}" (Priority: ${task.priority || 'normal'})`);
      });
      
    } else {
      console.log('⚠️  Note not yet enhanced - queue may be processing...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStage4AQueue();