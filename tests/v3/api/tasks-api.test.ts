import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

import { TaskService } from '../../../server/ai/v3/tasks/task-service.js';
import tasksRouter from '../../../server/api/v3/tasks/router.js';

const app = express();
app.use(bodyParser.json());
app.use('/api/v3/tasks', tasksRouter);

const testUser = 'api-test-' + Date.now();

beforeAll(async () => {
  // seed three tasks
  await TaskService.create({
    user_id: testUser,
    title: 'High priority pending task',
    natural_text: null,
    priority: 'high',
    parsed_due_date: null,
    due_date_confidence: 0,
    confidence: 0.95,
    source_reasoning_log_id: null
  });
  await TaskService.create({
    user_id: testUser,
    title: 'Medium completed task',
    natural_text: null,
    priority: 'medium',
    parsed_due_date: null,
    due_date_confidence: 0,
    confidence: 0.8,
    source_reasoning_log_id: null
  });
  
  // mark second task completed
  const tasks = await TaskService.list(testUser, 2);
  if (tasks.length > 1) {
    await TaskService.complete(tasks[1].id);
  }
});

describe('GET /api/v3/tasks', () => {
  it('returns tasks (happy path)', async () => {
    const r = await request(app)
      .get('/api/v3/tasks')
      .set('x-user-id', testUser)
      .expect(200);
    expect(r.body.tasks.length).toBeGreaterThan(0);
    expect(r.body.total).toBeGreaterThan(0);
  });

  it('filters by status', async () => {
    const r = await request(app)
      .get('/api/v3/tasks?status=completed')
      .set('x-user-id', testUser)
      .expect(200);
    r.body.tasks.forEach((t: any) => expect(t.status).toBe('completed'));
  });

  it('filters by priority', async () => {
    const r = await request(app)
      .get('/api/v3/tasks?priority=high')
      .set('x-user-id', testUser)
      .expect(200);
    r.body.tasks.forEach((t: any) => expect(t.priority).toBe('high'));
  });

  it('paginates correctly', async () => {
    const r = await request(app)
      .get('/api/v3/tasks?limit=1&offset=0')
      .set('x-user-id', testUser)
      .expect(200);
    expect(r.body.tasks).toHaveLength(1);
    expect(typeof r.body.nextOffset).toBe('number');
  });

  it('rejects invalid limit', async () => {
    await request(app)
      .get('/api/v3/tasks?limit=500')
      .set('x-user-id', testUser)
      .expect(400);
  });

  it('returns empty list for unknown user', async () => {
    const r = await request(app)
      .get('/api/v3/tasks')
      .set('x-user-id', 'unknown-user')
      .expect(200);
    expect(r.body.total).toBe(0);
  });
});