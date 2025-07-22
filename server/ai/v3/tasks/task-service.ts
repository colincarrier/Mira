// Stage‑3A • TaskService
import { v4 as uuid } from 'uuid';
import { contextPool as pool } from '../context/db-pool.js';
import { Task } from './types.js';

// Stage-3C Types (extend Stage-3B types for scheduler support)
export type TaskStatus = 'pending' | 'scheduled' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  limit: number;
  offset: number;
}

export interface CountFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

export class TaskService {
  /** Validate & insert; returns task id (or existing id if duplicate) */
  static async create(t: Omit<Task,
      'id' | 'status' | 'created_at' | 'completed_at'
    >): Promise<string> {

    // -------- validation --------
    assert(t.user_id?.trim().length > 0, 'user_id required');
    const title = t.title?.trim();
    assert(!!(title && title.length >= 2 && title.length <= 200),
           `title must be 2‑200 chars, got: "${title?.slice(0,50)}..."`);
    assert(t.confidence >= 0 && t.confidence <= 1, 'confidence 0‑1');

    const taskId = uuid();
    const { rows } = await pool.query(
      `INSERT INTO memory.tasks
       (id,user_id,title,natural_text,priority,parsed_due_date,
        due_date_confidence,confidence,status,source_reasoning_log_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9)
       ON CONFLICT (user_id,title) DO UPDATE
         SET confidence = GREATEST(memory.tasks.confidence, EXCLUDED.confidence)
       RETURNING id`,
      [
        taskId, t.user_id.trim(), title, t.natural_text ?? null,
        t.priority ?? 'medium', t.parsed_due_date ?? null,
        t.due_date_confidence ?? 0, t.confidence,
        t.source_reasoning_log_id ?? null
      ]
    );

    console.log(`[TaskService] Created task "${title}" for user ${t.user_id} (confidence: ${t.confidence})`);
    return rows[0].id as string;
  }

  static async complete(taskId: string): Promise<void> {
    await pool.query(
      `UPDATE memory.tasks
         SET status='completed', completed_at = NOW()
       WHERE id = $1`,
      [taskId]
    );
  }

  static async getById(taskId: string): Promise<Task | null> {
    const { rows } = await pool.query(
      `SELECT * FROM memory.tasks WHERE id = $1 LIMIT 1`,
      [taskId]
    );
    return rows[0] ?? null;
  }

  // ---- Stage-3C Scheduler Methods ----

  /** fetch up to <limit> pending tasks that have *no* parsed_due_date yet */
  static async fetchUnscheduled(limit = 200): Promise<Task[]> {
    const { rows } = await pool.query(
      `SELECT * FROM memory.tasks
         WHERE status = 'pending'
           AND parsed_due_date IS NULL
         ORDER BY created_at
         LIMIT $1`,
      [limit]
    );
    return rows as Task[];
  }

  /** mark a task scheduled + persist its parsed date */
  static async markScheduled(taskId: string, dt: Date, conf = 0.9): Promise<void> {
    await pool.query(
      `UPDATE memory.tasks
         SET parsed_due_date = $1,
             due_date_confidence = $2,
             status = 'scheduled'
         WHERE id = $3`,
      [dt, conf, taskId]
    );
  }

  static async list(userId: string, limit = 20): Promise<Task[]> {
    const { rows } = await pool.query(
      `SELECT * FROM memory.tasks
        WHERE user_id = $1
     ORDER BY created_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return rows as Task[];
  }

  static async getPending(userId: string, limit = 20): Promise<Task[]> {
    const { rows } = await pool.query(
      `SELECT * FROM memory.tasks
        WHERE user_id = $1 AND status='pending'
     ORDER BY created_at DESC
        LIMIT $2`,
      [userId, limit]
    );
    return rows as Task[];
  }

  // Stage-3B Filter Helper
  static buildFilterClause(
    baseParams: any[],
    filter: { status?: TaskStatus; priority?: TaskPriority }
  ): { whereSql: string; params: any[] } {
    const conds: string[] = [];
    if (filter.status) {
      conds.push(`status = $${baseParams.length + conds.length + 1}`);
      baseParams.push(filter.status);
    }
    if (filter.priority) {
      conds.push(`priority = $${baseParams.length + conds.length + 1}`);
      baseParams.push(filter.priority);
    }
    return {
      whereSql: conds.length ? ' AND ' + conds.join(' AND ') : '',
      params: baseParams
    };
  }

  /** list tasks with limit/offset & optional filters */
  static async listByFilter(
    userId: string,
    { status, priority, limit, offset }: TaskFilter
  ): Promise<Task[]> {

    const baseParams: any[] = [userId];
    const { whereSql, params } = TaskService.buildFilterClause(baseParams, { status, priority });

    const { rows } = await pool.query(
      `SELECT id,user_id,title,natural_text,priority,status,
              parsed_due_date,due_date_confidence,confidence,created_at
         FROM memory.tasks
        WHERE user_id = $1${whereSql}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return rows as Task[];
  }

  /** count tasks for pagination */
  static async countByFilter(userId: string, filter: CountFilter): Promise<number> {
    const baseParams: any[] = [userId];
    const { whereSql, params } = TaskService.buildFilterClause(baseParams, filter);

    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
         FROM memory.tasks
        WHERE user_id = $1${whereSql}`,
      params
    );
    return Number(rows[0]?.total || 0);
  }
}