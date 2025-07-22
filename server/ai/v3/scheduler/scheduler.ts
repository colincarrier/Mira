import { TaskService } from '../tasks/task-service.js';
import { Task } from '../tasks/types.js';
import { SCHEDULER_CFG }   from './config.js';
import { parse as chronoParse } from 'chrono-node';
import { v4 as uuid } from 'uuid';

/* ---------- internal job model & queue (binary heap) ---------- */
interface Job { id: string; taskId: string; when: number; }

class MinHeap {
  private h: Job[] = [];
  size() { return this.h.length; }
  peek() { return this.h[0] ?? null; }
  push(j: Job) {
    this.h.push(j); this.bubbleUp(this.h.length - 1);
  }
  pop(): Job | null {
    if (!this.h.length) return null;
    const top = this.h[0];
    const last = this.h.pop()!;
    if (this.h.length) { this.h[0] = last; this.bubbleDown(0); }
    return top;
  }
  private bubbleUp(i: number) {
    while (i) {
      const p = (i - 1) >> 1;
      if (this.h[i].when >= this.h[p].when) break;
      [this.h[i], this.h[p]] = [this.h[p], this.h[i]];
      i = p;
    }
  }
  private bubbleDown(i: number) {
    while (true) {
      const l = 2 * i + 1, r = l + 1;
      let smallest = i;
      if (l < this.h.length && this.h[l].when < this.h[smallest].when) smallest = l;
      if (r < this.h.length && this.h[r].when < this.h[smallest].when) smallest = r;
      if (smallest === i) break;
      [this.h[i], this.h[smallest]] = [this.h[smallest], this.h[i]];
      i = smallest;
    }
  }
}

const heap = new MinHeap();

/* ---------- failure counter / circuit breaker ---------- */
let consecutiveFailures = 0;

/* ---------- bootstrap ---------- */
async function bootstrap(): Promise<void> {
  const tasks = await TaskService.fetchUnscheduled(SCHEDULER_CFG.bootstrapLimit);
  console.log(`[Scheduler] bootstrap loaded ${tasks.length} tasks`);
  tasks.forEach(t => tryParseAndQueue(t));
}

function tryParseAndQueue(task: Task): void {
  if (heap.size() >= SCHEDULER_CFG.maxQueueSize) return;
  const parsed = chronoParse(task.natural_text ?? '', new Date(), { forwardDate: true })[0];
  if (!parsed) return;

  const due = parsed.date();
  const confidence = parsed.tags ? 0.9 : 0.8;

  heap.push({ id: uuid(), taskId: task.id, when: due.getTime() });
  TaskService.markScheduled(task.id, due, confidence)
    .catch(e => console.error('[Scheduler] markScheduled failed', e));
}

/* ---------- periodic scan ---------- */
async function scanAndSchedule(): Promise<void> {
  if (consecutiveFailures >= SCHEDULER_CFG.maxFailures) {
    console.warn('[Scheduler] circuit open – backing off');
    return;
  }
  try {
    const tasks = await TaskService.fetchUnscheduled(100);
    tasks.forEach(tryParseAndQueue);
    consecutiveFailures = 0;
  } catch (e: any) {
    consecutiveFailures++;
    console.error('[Scheduler] scan failed:', e.message);
  }
}

/* ---------- tick loop ---------- */
function tick(): void {
  const now = Date.now();
  let job: Job | null;
  while ((job = heap.peek()) && job.when <= now) {
    heap.pop();
    console.log(`[Scheduler] 🔔 Task ${job.taskId} is due – emit event here`);
    // Stage‑3D will emit actual notifications
  }
}

/* ---------- public control ---------- */
let scanTimer: NodeJS.Timeout, tickTimer: NodeJS.Timeout;

export async function startScheduler(): Promise<void> {
  await bootstrap();
  scanTimer = setInterval(scanAndSchedule, SCHEDULER_CFG.scanIntervalMs).unref();
  tickTimer = setInterval(tick, 1000).unref();
  console.log('[Scheduler] started');
}

export function stopScheduler(): void {
  clearInterval(scanTimer);
  clearInterval(tickTimer);
  console.log('[Scheduler] stopped');
}

/* ---------- auto‑start when imported in prod ---------- */
if (process.env.NODE_ENV === 'production') {
  startScheduler().catch(e => console.error('[Scheduler] failed to start', e));
}