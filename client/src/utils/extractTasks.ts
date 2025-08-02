interface Task { title: string; priority: 'low' | 'normal' | 'high'; }

export function extractTasks(md: string): Task[] {
  const out: Task[] = [];
  const patterns = [
    /[-*]\s+\[.\]\s+(.+)/g,               // - [ ] Task title
    /(?:^|\n)(?:TODO|Task):\s*(.+)/gi,
    /^(?:[-*])\s+(.+)/gm,                 // bullet w/o checkbox
  ];

  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(md)) && out.length < 5) {
      const title = m[1].trim().slice(0, 120);
      if (out.some(t => t.title === title)) continue;

      const priority: Task['priority'] =
        /urgent|critical|asap/i.test(title) ? 'high' :
        /later|someday|eventually/i.test(title) ? 'low' : 'normal';

      out.push({ title, priority });
    }
  }
  return out;
}