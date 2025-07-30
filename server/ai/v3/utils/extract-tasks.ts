// Part 1: Enhanced task extraction utility
import type { Task } from '../../../../shared/types';

export function extractTasks(markdown: string): Task[] {
  const tasks: Task[] = [];
  const patterns = [
    /[☐□✓✗]\s*(.+)/g,                     // Markdown checkboxes
    /^(?:TODO|Task|Action):\s*(.+)$/gmi,  // TODO: format
    /^[-*]\s*(.+)$/gm,                    // Bullet points that look like tasks
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(markdown)) && tasks.length < 3) {
      const title = match[1].trim().slice(0, 80); // Reasonable limit
      
      // Skip if already have this task
      if (tasks.some(t => t.title === title)) continue;
      
      // Determine priority based on keywords
      let priority: 'low' | 'normal' | 'high' = 'normal';
      if (/urgent|asap|critical|important/i.test(title)) {
        priority = 'high';
      } else if (/later|eventually|someday|maybe/i.test(title)) {
        priority = 'low';
      }
      
      tasks.push({ title, priority });
    }
  }
  
  return tasks;
}