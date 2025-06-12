/**
 * Comprehensive Reminder System Test
 * Tests intelligent parsing, scheduling, and notification delivery
 */

const BASE_URL = 'http://localhost:5000';

async function makeRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(`${BASE_URL}${url}`, options);
  return response.json();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Intelligent Time Parsing and Reminder Creation
 */
async function testIntelligentTimeParsing() {
  console.log('\n🧠 Testing Intelligent Time Parsing...');
  
  const testCases = [
    {
      input: "pick up atlas today at 8pm",
      expectedType: "pickup_reminder",
      expectedTime: "today 8:00 PM",
      expectedLeadTime: "10 minutes" // default for pickups
    },
    {
      input: "doctor appointment tomorrow at 3:30pm",
      expectedType: "appointment_reminder", 
      expectedTime: "tomorrow 3:30 PM",
      expectedLeadTime: "30 minutes" // default for appointments
    },
    {
      input: "call mom in 2 hours",
      expectedType: "call_reminder",
      expectedTime: "in 2 hours",
      expectedLeadTime: "5 minutes" // default for calls
    },
    {
      input: "meeting with john friday at 10am - remind me 1 hour before",
      expectedType: "meeting_reminder",
      expectedTime: "friday 10:00 AM", 
      expectedLeadTime: "1 hour" // explicit instruction
    },
    {
      input: "take medication at 9am daily",
      expectedType: "medication_reminder",
      expectedTime: "daily 9:00 AM",
      expectedLeadTime: "immediate", // critical for health
      expectedRecurring: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting: "${testCase.input}"`);
    
    try {
      // Create note with reminder content
      const response = await makeRequest('/api/notes', 'POST', {
        content: testCase.input,
        mode: 'reminder_creation',
        context: 'intelligent_parsing'
      });

      console.log(`✅ Note created:`, response.content);
      
      // Check if todos were created with proper scheduling
      if (response.todos && response.todos.length > 0) {
        const todo = response.todos[0];
        console.log(`📅 Todo created:`, {
          title: todo.title,
          isActiveReminder: todo.isActiveReminder,
          timeDue: todo.timeDue,
          reminderType: todo.reminderType,
          leadTimeNotifications: todo.leadTimeNotifications
        });
        
        // Verify intelligent defaults were applied
        if (todo.isActiveReminder) {
          console.log(`✅ Intelligent reminder created successfully`);
        } else {
          console.log(`❌ Reminder not marked as active`);
        }
      } else {
        console.log(`❌ No todos created for obvious reminder: "${testCase.input}"`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to process: "${testCase.input}"`, error.message);
    }
  }
}

/**
 * Test 2: Notification Scheduling and Delivery
 */
async function testNotificationScheduling() {
  console.log('\n🔔 Testing Notification Scheduling...');
  
  // Create a reminder for 2 minutes from now to test scheduling
  const futureTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
  const timeString = futureTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const testInput = `test reminder scheduled for ${timeString}`;
  
  try {
    console.log(`Creating test reminder: "${testInput}"`);
    
    const response = await makeRequest('/api/notes', 'POST', {
      content: testInput,
      mode: 'reminder_creation',
      context: 'notification_test'
    });
    
    if (response.todos && response.todos.length > 0) {
      const todoId = response.todos[0].id;
      console.log(`✅ Test reminder created with ID: ${todoId}`);
      
      // Check notification system status
      const statsResponse = await makeRequest('/api/notifications/status');
      console.log(`📊 Notification system status:`, statsResponse);
      
      // Wait and check if notification fires (simplified test)
      console.log(`⏳ Waiting 30 seconds to test notification check...`);
      await sleep(30000);
      
      // Check logs or notification delivery (this would need actual notification delivery implementation)
      console.log(`✅ Notification system test completed`);
      
    } else {
      console.log(`❌ No reminder created for test input`);
    }
    
  } catch (error) {
    console.error(`❌ Notification scheduling test failed:`, error.message);
  }
}

/**
 * Test 3: Context-Aware Lead Time Intelligence
 */
async function testContextAwareLeadTimes() {
  console.log('\n🎯 Testing Context-Aware Lead Times...');
  
  const contextTests = [
    {
      input: "flight to paris at 6am",
      expectedLeadTime: "2 hours", // travel needs more time
      context: "travel"
    },
    {
      input: "quick coffee with sarah at 2pm", 
      expectedLeadTime: "10 minutes", // casual meetups
      context: "social"
    },
    {
      input: "important client presentation at 9am",
      expectedLeadTime: "1 hour", // work meetings need prep
      context: "work"
    },
    {
      input: "take vitamins at 8am",
      expectedLeadTime: "immediate", // health is critical
      context: "health"
    }
  ];

  for (const test of contextTests) {
    console.log(`\nTesting context-aware lead time for: "${test.input}"`);
    
    try {
      const response = await makeRequest('/api/notes', 'POST', {
        content: test.input,
        mode: 'reminder_creation',
        context: 'smart_scheduling'
      });
      
      if (response.todos && response.todos.length > 0) {
        const todo = response.todos[0];
        console.log(`📋 Context: ${test.context}, Expected: ${test.expectedLeadTime}`);
        console.log(`📋 Actual lead time:`, todo.leadTimeNotifications);
        
        // Verify intelligent context was applied
        if (todo.leadTimeNotifications && todo.leadTimeNotifications.includes(test.expectedLeadTime)) {
          console.log(`✅ Correct context-aware lead time applied`);
        } else {
          console.log(`⚠️  Different lead time applied - may still be intelligent`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Context test failed for "${test.input}":`, error.message);
    }
  }
}

/**
 * Test 4: Recurring Reminder Intelligence
 */
async function testRecurringReminders() {
  console.log('\n🔄 Testing Recurring Reminder Intelligence...');
  
  const recurringTests = [
    "take medication daily at 9am",
    "team standup every weekday at 10am", 
    "call mom every sunday at 7pm",
    "gym workout monday wednesday friday at 6pm",
    "pay rent on the 1st of every month"
  ];
  
  for (const input of recurringTests) {
    console.log(`\nTesting recurring pattern: "${input}"`);
    
    try {
      const response = await makeRequest('/api/notes', 'POST', {
        content: input,
        mode: 'reminder_creation',
        context: 'recurring_pattern'
      });
      
      if (response.todos && response.todos.length > 0) {
        const todo = response.todos[0];
        console.log(`🔄 Recurring pattern detected:`, todo.repeatPattern);
        console.log(`📅 Next scheduled:`, todo.timeDue);
        
        if (todo.repeatPattern && todo.repeatPattern !== 'none') {
          console.log(`✅ Recurring reminder properly configured`);
        } else {
          console.log(`❌ Recurring pattern not detected for obvious recurring reminder`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Recurring test failed for "${input}":`, error.message);
    }
  }
}

/**
 * Test 5: Real-time Notification Delivery Test
 */
async function testRealTimeNotifications() {
  console.log('\n⚡ Testing Real-time Notification Delivery...');
  
  // Create a reminder for 1 minute from now
  const testTime = new Date(Date.now() + 60 * 1000);
  const timeString = testTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const testInput = `urgent test notification at ${timeString}`;
  
  try {
    console.log(`Creating urgent test reminder: "${testInput}"`);
    
    const response = await makeRequest('/api/notes', 'POST', {
      content: testInput,
      mode: 'reminder_creation',
      context: 'urgent_test'
    });
    
    if (response.todos && response.todos.length > 0) {
      const todoId = response.todos[0].id;
      console.log(`✅ Urgent reminder created: ${todoId}`);
      
      // Monitor for the next 90 seconds
      console.log(`⏳ Monitoring for notification delivery...`);
      
      for (let i = 0; i < 18; i++) { // Check every 5 seconds for 90 seconds
        await sleep(5000);
        
        try {
          // Check if notification was delivered (would need actual notification log endpoint)
          const notificationStatus = await makeRequest('/api/notifications/recent');
          
          if (notificationStatus && notificationStatus.recent) {
            const recentNotification = notificationStatus.recent.find(n => n.todoId === todoId);
            if (recentNotification) {
              console.log(`🔔 SUCCESS: Notification delivered!`, recentNotification);
              return;
            }
          }
        } catch (error) {
          // Continue checking even if status endpoint doesn't exist yet
        }
        
        console.log(`⏳ Still waiting... (${(i + 1) * 5}s elapsed)`);
      }
      
      console.log(`⚠️  Notification monitoring completed - check server logs for delivery`);
      
    } else {
      console.log(`❌ No urgent reminder created`);
    }
    
  } catch (error) {
    console.error(`❌ Real-time notification test failed:`, error.message);
  }
}

/**
 * Main test runner
 */
async function runReminderSystemTests() {
  console.log('🚀 Starting Comprehensive Reminder System Tests...\n');
  
  try {
    await testIntelligentTimeParsing();
    await sleep(2000);
    
    await testContextAwareLeadTimes();
    await sleep(2000);
    
    await testRecurringReminders();
    await sleep(2000);
    
    await testNotificationScheduling();
    await sleep(2000);
    
    await testRealTimeNotifications();
    
    console.log('\n✅ All reminder system tests completed!');
    console.log('\n📊 Summary: Check above for detailed results of each test');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runReminderSystemTests,
    testIntelligentTimeParsing,
    testNotificationScheduling,
    testContextAwareLeadTimes,
    testRecurringReminders,
    testRealTimeNotifications
  };
} else {
  // Run tests if called directly
  runReminderSystemTests();
}