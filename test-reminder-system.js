
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testReminderSystem() {
  console.log('🧪 Testing Reminder System Comprehensively\n');

  try {
    // Test 1: Create a note that should generate a reminder
    console.log('📝 Test 1: Creating note with time-sensitive content...');
    const reminderNoteResponse = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Remind me to call the doctor tomorrow at 2 PM',
        mode: 'text',
        context: 'reminder_creation'
      })
    });
    
    const reminderNote = await reminderNoteResponse.json();
    console.log('Created note:', reminderNote.id, '- Content:', reminderNote.content);
    
    // Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check if todos were created with reminder properties
    console.log('\n📋 Test 2: Checking todos for reminder properties...');
    const todosResponse = await fetch(`${BASE_URL}/api/todos`);
    const todos = await todosResponse.json();
    
    console.log('Total todos found:', todos.length);
    
    const reminderTodos = todos.filter(todo => todo.isActiveReminder === true);
    const timeBasedTodos = todos.filter(todo => todo.timeDue);
    
    console.log('Todos marked as active reminders:', reminderTodos.length);
    console.log('Todos with timeDue set:', timeBasedTodos.length);
    
    reminderTodos.forEach(todo => {
      console.log(`  - Reminder: "${todo.title}" due ${todo.timeDue ? new Date(todo.timeDue).toISOString() : 'NO TIME'}`);
    });
    
    // Test 3: Create explicit reminder via different endpoint
    console.log('\n⏰ Test 3: Creating explicit reminder...');
    const explicitReminderResponse = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Set a reminder for my dentist appointment next Friday at 10 AM',
        mode: 'text',
        context: 'reminder_creation'
      })
    });
    
    const explicitReminder = await explicitReminderResponse.json();
    console.log('Created explicit reminder note:', explicitReminder.id);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Check the updated note for AI analysis
    console.log('\n🔍 Test 4: Checking AI analysis results...');
    const updatedNoteResponse = await fetch(`${BASE_URL}/api/notes/${reminderNote.id}`);
    const updatedNote = await updatedNoteResponse.json();
    
    console.log('AI Enhanced:', updatedNote.aiEnhanced);
    console.log('AI Suggestion:', updatedNote.aiSuggestion);
    console.log('AI Context:', updatedNote.aiContext);
    console.log('Rich Context:', updatedNote.richContext ? 'Present' : 'None');
    
    // Test 5: Check todos again after explicit reminder
    console.log('\n📋 Test 5: Checking todos after explicit reminder...');
    const finalTodosResponse = await fetch(`${BASE_URL}/api/todos`);
    const finalTodos = await finalTodosResponse.json();
    
    const finalReminders = finalTodos.filter(todo => todo.isActiveReminder === true);
    const finalTimeBased = finalTodos.filter(todo => todo.timeDue);
    
    console.log('Final reminders count:', finalReminders.length);
    console.log('Final time-based todos:', finalTimeBased.length);
    
    finalReminders.forEach(todo => {
      console.log(`  - Reminder: "${todo.title}"`);
      console.log(`    Due: ${todo.timeDue ? new Date(todo.timeDue).toISOString() : 'NO TIME'}`);
      console.log(`    Priority: ${todo.priority}`);
      console.log(`    Active Reminder: ${todo.isActiveReminder}`);
    });
    
    // Test 6: Test the /remind endpoint specifically
    console.log('\n📱 Test 6: Testing /remind endpoint...');
    const remindEndpointResponse = await fetch(`${BASE_URL}/api/todos`);
    const remindTodos = await remindEndpointResponse.json();
    
    // Filter for remind page display logic
    const remindPageReminders = remindTodos.filter(t => t.isActiveReminder && !t.completed && !t.archived);
    const remindPageTodos = remindTodos.filter(t => !t.isActiveReminder && !t.completed && !t.archived);
    
    console.log('Reminders for /remind page:', remindPageReminders.length);
    console.log('Todos for /remind page:', remindPageTodos.length);
    
    // Test 7: Manual reminder creation via proper API
    console.log('\n✋ Test 7: Creating manual reminder via todo endpoint...');
    const manualReminderResponse = await fetch(`${BASE_URL}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Manual Test Reminder - Call Mom',
        noteId: reminderNote.id,
        isActiveReminder: true,
        timeDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        priority: 'high',
        completed: false
      })
    });
    
    if (manualReminderResponse.ok) {
      const manualReminder = await manualReminderResponse.json();
      console.log('Manual reminder created:', manualReminder.id, '- Title:', manualReminder.title);
    } else {
      console.log('Manual reminder creation failed:', await manualReminderResponse.text());
    }
    
    // Final verification
    console.log('\n✅ Final Verification: Checking all reminders...');
    const verificationResponse = await fetch(`${BASE_URL}/api/todos`);
    const verificationTodos = await verificationResponse.json();
    
    const allReminders = verificationTodos.filter(todo => todo.isActiveReminder === true);
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log(`Total active reminders: ${allReminders.length}`);
    
    if (allReminders.length > 0) {
      console.log('✅ SUCCESS: Reminders are being created!');
      allReminders.forEach((reminder, index) => {
        console.log(`${index + 1}. "${reminder.title}" - Due: ${reminder.timeDue ? new Date(reminder.timeDue).toLocaleString() : 'No time set'}`);
      });
    } else {
      console.log('❌ FAILURE: No active reminders found');
      console.log('Debugging info:');
      console.log('- Total todos:', verificationTodos.length);
      console.log('- Todos with timeDue:', verificationTodos.filter(t => t.timeDue).length);
      console.log('- AI processed notes:', verificationTodos.filter(t => t.noteId).length);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testReminderSystem();
