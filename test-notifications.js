
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testNotificationSystem() {
  console.log('🔔 Testing Notification System\n');

  try {
    // Test 1: Create a reminder for 2 minutes from now
    console.log('⏰ Test 1: Creating immediate reminder...');
    const futureTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
    
    const createReminderResponse = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `Remind me to test notifications at ${futureTime.toLocaleTimeString()}`,
        mode: 'text',
        context: 'reminder_creation'
      })
    });
    
    const reminderNote = await createReminderResponse.json();
    console.log('Created reminder note:', reminderNote.id);
    
    // Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Create manual reminder with specific time
    console.log('\n📅 Test 2: Creating manual reminder with notification structure...');
    const manualReminderResponse = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Manual Test Reminder',
        mode: 'text'
      })
    });
    
    const manualNote = await manualReminderResponse.json();
    
    // Create todo with proper notification structure
    const todoResponse = await fetch(`${BASE_URL}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Notification Reminder - Check in 1 minute',
        noteId: manualNote.id,
        isActiveReminder: true,
        timeDue: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // 1 minute from now
        priority: 'high',
        completed: false,
        plannedNotificationStructure: {
          enabled: true,
          reminderCategory: "today",
          repeatPattern: "none",
          leadTimeNotifications: ["30 seconds before"]
        }
      })
    });
    
    if (todoResponse.ok) {
      const manualTodo = await todoResponse.json();
      console.log('Manual reminder created:', manualTodo.title);
    }
    
    // Test 3: Check notification system status
    console.log('\n📊 Test 3: Checking notification system status...');
    const statusResponse = await fetch(`${BASE_URL}/api/notifications/status`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Notification system status:');
      console.log('- Active reminders:', status.activeReminders);
      console.log('- Total scheduled notifications:', status.totalScheduledNotifications);
      if (status.nextNotification) {
        console.log('- Next notification:', status.nextNotification.title, 'at', new Date(status.nextNotification.scheduledTime).toLocaleString());
      }
    } else {
      console.log('Failed to get notification status');
    }
    
    // Test 4: Refresh notifications
    console.log('\n🔄 Test 4: Refreshing notification system...');
    const refreshResponse = await fetch(`${BASE_URL}/api/notifications/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (refreshResponse.ok) {
      const refreshResult = await refreshResponse.json();
      console.log('Refresh successful:', refreshResult.message);
      console.log('New status:', refreshResult.status);
    }
    
    // Test 5: Wait and check for notifications
    console.log('\n⏳ Test 5: Waiting 90 seconds to see notifications fire...');
    console.log('Watch the server console for notification messages...');
    
    // Monitor for 2 minutes
    for (let i = 0; i < 12; i++) { // 12 * 10 seconds = 2 minutes
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      
      const currentStatusResponse = await fetch(`${BASE_URL}/api/notifications/status`);
      if (currentStatusResponse.ok) {
        const currentStatus = await currentStatusResponse.json();
        console.log(`${new Date().toLocaleTimeString()} - Active: ${currentStatus.activeReminders}, Scheduled: ${currentStatus.totalScheduledNotifications}`);
        
        if (currentStatus.nextNotification) {
          const nextTime = new Date(currentStatus.nextNotification.scheduledTime);
          const timeToNext = Math.round((nextTime.getTime() - Date.now()) / 1000);
          console.log(`  Next: "${currentStatus.nextNotification.title}" in ${timeToNext}s`);
        }
      }
    }
    
    console.log('\n✅ Notification test completed. Check server console for notification firing logs.');
    
  } catch (error) {
    console.error('❌ Notification test failed:', error.message);
  }
}

// Run the test
testNotificationSystem();
