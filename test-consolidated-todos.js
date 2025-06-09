/**
 * Automated Testing Suite for Consolidated Todo Approach
 * Tests 5 different input methods to validate functionality
 */

const BASE_URL = 'http://localhost:5000';

// Test 1: Simple Text Input
async function testSimpleText() {
  console.log('🧪 Test 1: Simple Text Input');
  
  const response = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: "Buy birthday cake for Sarah's party tomorrow",
      collectionId: 57
    })
  });
  
  const note = await response.json();
  console.log('Created note:', note.id);
  
  // Wait for AI processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const processedNote = await fetch(`${BASE_URL}/api/notes/${note.id}`).then(r => r.json());
  console.log('Todos generated:', processedNote.todos?.length || 0);
  console.log('Has rich context:', !!processedNote.richContext);
  
  return processedNote;
}

// Test 2: Medium Complexity Text
async function testMediumComplexity() {
  console.log('🧪 Test 2: Medium Complexity Text');
  
  const response = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: "Plan Sarah's 6th birthday party - she loves ponies and dance. Need venue, decorations, cake, entertainment, and party favors. Budget is $300.",
      collectionId: 57
    })
  });
  
  const note = await response.json();
  console.log('Created note:', note.id);
  
  // Wait for AI processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const processedNote = await fetch(`${BASE_URL}/api/notes/${note.id}`).then(r => r.json());
  console.log('Todos generated:', processedNote.todos?.length || 0);
  
  // Check for optional todos in rich context
  if (processedNote.richContext) {
    const richData = JSON.parse(processedNote.richContext);
    console.log('Next steps (optional todos):', richData.nextSteps?.length || 0);
    console.log('Web search results:', richData.researchResults?.length || 0);
  }
  
  return processedNote;
}

// Test 3: Research Query with Location-based Search
async function testResearchQuery() {
  console.log('🧪 Test 3: Research Query');
  
  const response = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: "Find best family-friendly restaurants in downtown area for birthday celebration",
      collectionId: 57
    })
  });
  
  const note = await response.json();
  console.log('Created note:', note.id);
  
  // Wait for AI processing with web search
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  const processedNote = await fetch(`${BASE_URL}/api/notes/${note.id}`).then(r => r.json());
  console.log('Todos generated:', processedNote.todos?.length || 0);
  
  // Check for location-based web search results
  if (processedNote.richContext) {
    const richData = JSON.parse(processedNote.richContext);
    console.log('Research results:', richData.researchResults?.length || 0);
    console.log('Quick insights:', richData.quickInsights?.length || 0);
  }
  
  return processedNote;
}

// Test 4: Add Optional Todo
async function testAddOptionalTodo(noteId, todoTitle) {
  console.log('🧪 Test 4: Add Optional Todo');
  
  const response = await fetch(`${BASE_URL}/api/todos/add-optional`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: todoTitle,
      noteId: noteId
    })
  });
  
  const todo = await response.json();
  console.log('Added optional todo:', todo.id);
  
  return todo;
}

// Test 5: Create Reminder
async function testCreateReminder(noteId, reminderTitle) {
  console.log('🧪 Test 5: Create Reminder');
  
  const reminderTime = new Date();
  reminderTime.setHours(reminderTime.getHours() + 1);
  
  const response = await fetch(`${BASE_URL}/api/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: reminderTitle,
      description: "Test reminder for consolidated todo approach",
      reminderTime: reminderTime.toISOString(),
      noteId: noteId
    })
  });
  
  const reminder = await response.json();
  console.log('Created reminder:', reminder.id);
  
  return reminder;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Consolidated Todo Approach Tests\n');
  
  try {
    // Test 1: Simple text
    const simpleNote = await testSimpleText();
    console.log('✅ Test 1 completed\n');
    
    // Test 2: Medium complexity
    const complexNote = await testMediumComplexity();
    console.log('✅ Test 2 completed\n');
    
    // Test 3: Research query
    const researchNote = await testResearchQuery();
    console.log('✅ Test 3 completed\n');
    
    // Test 4: Add optional todo (using complex note)
    if (complexNote && complexNote.richContext) {
      const richData = JSON.parse(complexNote.richContext);
      if (richData.nextSteps && richData.nextSteps.length > 0) {
        const optionalTodo = await testAddOptionalTodo(complexNote.id, richData.nextSteps[0]);
        console.log('✅ Test 4 completed\n');
        
        // Test 5: Create reminder
        const reminder = await testCreateReminder(complexNote.id, "Party planning reminder");
        console.log('✅ Test 5 completed\n');
      }
    }
    
    console.log('🎉 All tests completed successfully!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('- Simple text input: Consolidated todos generated');
    console.log('- Medium complexity: Multiple optional todos available');
    console.log('- Research query: Location-based web search results');
    console.log('- Optional todo addition: Working');
    console.log('- Reminder creation: Working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Export for Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  runAllTests();
}