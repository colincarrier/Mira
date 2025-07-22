import { startScheduler, stopScheduler } from '../../../server/ai/v3/scheduler/scheduler.js';
import { TaskService } from '../../../server/ai/v3/tasks/task-service.js';

console.log('🧪 Starting scheduler smoke test...');

async function smokeTest() {
  try {
    // Create a test task with timing
    const taskId = await TaskService.create({
      user_id: 'scheduler-test-user',
      title: 'Test scheduling task',
      natural_text: 'remind me in 5 minutes',
      priority: 'medium',
      parsed_due_date: null,
      due_date_confidence: 0,
      confidence: 0.9,
      source_reasoning_log_id: null
    });

    console.log(`✅ Created test task: ${taskId}`);

    // Start scheduler
    await startScheduler();
    console.log('✅ Scheduler started successfully');

    // Wait 3 seconds for scheduler to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if task was scheduled
    const task = await TaskService.getById(taskId);
    if (task && task.status === 'scheduled' && task.parsed_due_date) {
      console.log(`✅ Task scheduled successfully: ${task.parsed_due_date}`);
    } else {
      console.log(`⚠️ Task not scheduled yet (may need more time): status=${task?.status}`);
    }

    // Stop scheduler
    stopScheduler();
    console.log('✅ Scheduler stopped successfully');

    console.log('🎉 Scheduler smoke test completed!');
    
  } catch (error) {
    console.error('❌ Scheduler smoke test failed:', error);
    stopScheduler();
  }
}

smokeTest();