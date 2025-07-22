// server/api/v3/tasks/validators.ts
import type { TaskPriority, TaskStatus } from '../../../ai/v3/tasks/task-service.js';

export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  limit: number;
  offset: number;
}

export function validateTaskQuery(q: any):
  | { success: true; data: TaskQueryParams }
  | { success: false; error: string } {

  const { status, priority, limit = '20', offset = '0' } = q;

  if (status && !['pending', 'completed', 'archived'].includes(status)) {
    return { success: false, error: 'Invalid status param' };
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return { success: false, error: 'Invalid priority param' };
  }
  const l = Number(limit);
  if (!Number.isInteger(l) || l < 1 || l > 100) {
    return { success: false, error: 'limit must be 1‑100' };
  }
  const o = Number(offset);
  if (!Number.isInteger(o) || o < 0) {
    return { success: false, error: 'offset must be ≥0' };
  }

  return {
    success: true,
    data: {
      status: status as TaskStatus | undefined,
      priority: priority as TaskPriority | undefined,
      limit: l,
      offset: o
    }
  };
}