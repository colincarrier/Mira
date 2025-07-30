// ---------- server/ai/v3/utils/task-extractor.ts ------------
// Task extraction utility for V3 processing

export interface Task {
  title: string;
  priority: 'low' | 'normal' | 'high';
}

export function extractTasks(markdown: string): Task[] {
  const tasks: Task[] = [];
  const patterns = [
    /[☐□]\s*(.+)/g,                           // markdown checkboxes
    /-\s+\[\s\]\s*(.+)/g,                     // unchecked task lists
    /^(?:TODO|Task)\s*[:\-]\s*(.+)$/gmi       // TODO: .... / Task: ...
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(markdown)) && tasks.length < 3) {
      const title = m[1].trim().slice(0, 60);
      if (title.length) {
        tasks.push({ title, priority: 'normal' });
      }
    }
  }
  return tasks;
}