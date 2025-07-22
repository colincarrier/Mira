// server/api/v3/tasks/router.ts
import { Router } from 'express';
import { TaskService, TaskPriority, TaskStatus } from '../../../ai/v3/tasks/task-service.js';
import { validateTaskQuery } from './validators.js';

const router = Router();

/**
 * GET /api/v3/tasks
 * Query params:
 *   status   = pending|completed|archived   (optional)
 *   priority = low|medium|high              (optional)
 *   limit    = 1‑100   default 20
 *   offset   = 0‑N     default 0
 * Auth: x-user-id header (same pattern as earlier APIs)
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] ?? '') as string;
    if (!userId || userId.length > 100) {
      return res.status(400).json({ error: 'Missing or invalid x-user-id header' });
    }

    const v = validateTaskQuery(req.query);
    if (!v.success) {
      return res.status(400).json({ error: v.error });
    }
    const { status, priority, limit, offset } = v.data;

    // Run the two queries in parallel – cheap and keeps latency < 50 ms
    const [tasks, total] = await Promise.all([
      TaskService.listByFilter(userId, { status, priority, limit, offset }),
      TaskService.countByFilter(userId, { status, priority })
    ]);

    const nextOffset = offset + limit < total ? offset + limit : null;
    res.json({ tasks, total, nextOffset });
  } catch (e: any) {
    console.error('[Task API] fatal:', e);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

export default router;