export interface ParsedRC {
  title: string;
  aiBody: string;
  task?: any;
  entities?: any[];
  meta?: { latencyMs?: number; model?: string; confidence?: number };
}

function parseTaskValue(task: unknown): string {
  if (task == null) return '';
  if (typeof task === 'string') return task;
  if (Array.isArray(task)) {
    return task.map(t => parseTaskValue(t)).filter(Boolean).join(', ');
  }
  if (typeof task === 'object') {
    const t: any = task;
    const str = t.title || t.description || t.task || t.name || '';
    return str || JSON.stringify(t);
  }
  return String(task);
}

export function parseRichContext(
  raw: string | null | undefined,
): ParsedRC | null {
  if (!raw) return null;
  let data: any;
  try {
    data = JSON.parse(raw);
    // legacy notes may have double-encoded JSON
    if (typeof data === 'string') data = JSON.parse(data);
  } catch (_) {
    return null;
  }

  /* Stage-4A structured format */
  if (data.answer) {
    return {
      title: parseTaskValue(data.task),
      aiBody: data.answer,
      task: data.task
        ? { ...data.task, task: parseTaskValue(data.task.task) }
        : undefined,
      meta: data.meta,
      entities: data.entities,
    };
  }
  return data as ParsedRC;
}