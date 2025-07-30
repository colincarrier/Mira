import { MiraTask } from '../../../../shared/types';

export function extractTasks(md: string): MiraTask[] {
  const tasks: MiraTask[] = [];
  const patterns = [
    /[☐□]\s*(.+)/g,                    // Markdown checkboxes
    /^(?:TODO|Task):\s*(.+)/gmi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(md)) && tasks.length < 3) {
      tasks.push({
        id: `tmp-${Date.now()}-${tasks.length}`,
        title: m[1].trim().slice(0, 60),
        priority: 'normal'
      });
    }
  }
  return tasks;
}