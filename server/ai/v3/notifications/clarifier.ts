import { sendPush } from './channel-push.js';
import { TaskService } from '../tasks/task-service.js';
import type { Task } from '../tasks/types.js';
import { v4 as uuid } from 'uuid';

export async function requestClarification(task: Task): Promise<void> {
  const payload = {
    title: 'Quick clarification',
    body: `When should I remind you about "${task.title}"?`,
    data: { taskId: task.id, explanation: 'timing unclear' },
    actions: [
      { action: 'in1h',  title: 'In 1 h' },
      { action: 'tonight', title: 'Tonight' },
      { action: 'tomorrow', title: 'Tomorrow' },
      { action: 'custom',  title: 'Specify…' }
    ]
  };
  await sendPush(task.user_id, payload);
  await TaskService.markClarifying(task.id);
}