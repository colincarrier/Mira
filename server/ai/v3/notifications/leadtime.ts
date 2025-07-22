import { detectCategory } from './category.js';
import type { Task } from '../tasks/types.js';

export function computeLeadMinutes(task: Task): number {
  const base = task.priority === 'high' ? 120
             : task.priority === 'medium' ? 30
             : 10;

  const cat = detectCategory(task.title);
  const catMultiplier: Record<string, number> = {
    meeting: 2, flight: 3, travel: 2, appointment: 2
  };
  const lead = base * (catMultiplier[cat] ?? 1);

  // simple learning hook: bump if user historically late (placeholder)
  // TODO Stage‑4A: pull from profile stats
  return lead;
}