import { Task } from '../../../../shared/types';

export function extractTasks(markdown: string): Task[] {
  const tasks: Task[] = [];
  const patterns = [
    /(?:\[ \]|\[☐]|[□☐])\s+(.+)/g,              // markdown checkbox
    /^(?:TODO|Task):\s*(.+)$/gmi                 // explicit label
  ];
  for (const rx of patterns) {
    let m;
    while ((m = rx.exec(markdown)) && tasks.length < 3) {
      tasks.push({ title: m[1].trim().slice(0, 60), priority: 'normal' });
    }
  }
  return tasks;
}