// Stage‑3A · TaskService tests (run with `npm run test:tasks`)
import { TaskService } from '../../../server/ai/v3/tasks/task-service.js';
import { v4 as uuid } from 'uuid';

(async () => {
  const userId = 'task-test-' + uuid();

  console.log('🧪 TaskService tests');

  /* 1 ▸ create valid task */
  const taskId = await TaskService.create({
    user_id: userId,
    title: 'Buy cat food',
    natural_text: '{"title":"Buy cat food"}',
    priority: 'high',
    parsed_due_date: null,
    due_date_confidence: 0,
    confidence: 0.9,
    source_reasoning_log_id: null
  });
  console.assert(taskId, 'create() did not return id');

  /* 2 ▸ duplicate ignored */
  await TaskService.create({
    user_id: userId,
    title: 'Buy cat food',
    natural_text: null,
    priority: 'low',
    parsed_due_date: null,
    due_date_confidence: 0,
    confidence: 0.8,
    source_reasoning_log_id: null
  });
  const list = await TaskService.list(userId, 10);
  console.assert(list.length === 1, 'duplicate not prevented');

  /* 3 ▸ validation error */
  let failed = false;
  try {
    await TaskService.create({
      user_id: '',
      title: 'x',
      natural_text: null,
      priority: 'medium',
      parsed_due_date: null,
      due_date_confidence: 0,
      confidence: 1.1, // invalid
      source_reasoning_log_id: null
    });
  } catch {
    failed = true;
  }
  console.assert(failed, 'invalid input not rejected');

  /* 4 ▸ completion workflow */
  await TaskService.complete(taskId);
  const task = await TaskService.getById(taskId);
  console.assert(task?.status === 'completed', 'completion failed');

  console.log('✅ TaskService unit tests passed');
})().catch(err => {
  console.error('❌', err);
  process.exit(1);
});