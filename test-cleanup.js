
const BASE_URL = 'http://localhost:5000';

async function testCleanup() {
  console.log('🧹 Testing Cleanup Operation...\n');

  try {
    // Get current state
    console.log('📊 Fetching current todos...');
    const todosResponse = await fetch(`${BASE_URL}/api/todos`);
    const beforeTodos = await todosResponse.json();
    
    const beforeRegularTodos = beforeTodos.filter(t => !t.isActiveReminder);
    const beforeReminders = beforeTodos.filter(t => t.isActiveReminder === true);
    
    console.log(`Before cleanup:`);
    console.log(`  - Regular todos: ${beforeRegularTodos.length}`);
    console.log(`  - Reminders: ${beforeReminders.length}`);
    console.log(`  - Total: ${beforeTodos.length}\n`);

    // Perform cleanup
    console.log('🗑️ Performing cleanup...');
    const cleanupResponse = await fetch(`${BASE_URL}/api/cleanup/old-todos-reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const cleanupResult = await cleanupResponse.json();
    console.log('Cleanup result:', cleanupResult);

    // Get state after cleanup
    console.log('\n📊 Fetching todos after cleanup...');
    const afterTodosResponse = await fetch(`${BASE_URL}/api/todos`);
    const afterTodos = await afterTodosResponse.json();
    
    const afterRegularTodos = afterTodos.filter(t => !t.isActiveReminder);
    const afterReminders = afterTodos.filter(t => t.isActiveReminder === true);
    
    console.log(`After cleanup:`);
    console.log(`  - Regular todos: ${afterRegularTodos.length}`);
    console.log(`  - Reminders: ${afterReminders.length}`);
    console.log(`  - Total: ${afterTodos.length}\n`);

    console.log('✅ Cleanup test completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup test failed:', error);
  }
}

testCleanup();
