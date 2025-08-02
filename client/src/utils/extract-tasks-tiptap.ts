import { JSONContent } from '@shared/types';

export function extractTasksFromTipTap(doc: JSONContent): string[] {
  const tasks: string[] = [];

  function walkNode(node: any) {
    if (!node) return;

    // Check text content for task patterns
    if (node.type === 'text' && node.text) {
      const text = node.text;
      
      // Match various task patterns
      const patterns = [
        /(?:^|\n)[-*•]\s+(.+)/gm,  // Bullet points
        /(?:^|\n)\d+\.\s+(.+)/gm,   // Numbered lists
        /\[\s*\]\s+(.+)/g,           // Checkbox style
        /TODO:\s*(.+)/gi,            // TODO markers
        /TASK:\s*(.+)/gi,            // TASK markers
      ];

      for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          const task = match[1].trim();
          if (task && !tasks.includes(task)) {
            tasks.push(task);
          }
        }
      }
    }

    // Recursively walk children
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        walkNode(child);
      }
    }
  }

  walkNode(doc);
  return tasks;
}