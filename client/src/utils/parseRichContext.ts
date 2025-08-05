// Parse V3 "rich_context" blobs & prevent React-object crashes

export interface ParsedRC {
  title: string;
  aiBody: string;
  task?: { task: string; timing_hint?: string; confidence?: number };
  entities?: any[];
  meta?: { latencyMs?: number; model?: string; confidence?: number };
}

/* Runtime-safe JSON parse with legacy double-decode guard */
export function parseRichContext(
  raw: string | null | undefined,
): ParsedRC | null {
  if (!raw) return null;
  let data: any;
  try {
    data = JSON.parse(raw);
    /* 💡 legacy notes were double-stringified */
    if (typeof data === 'string') data = JSON.parse(data);
  } catch {
    console.warn('[RC] unparsable rich_context');
    return null;
  }

  /* Stage-4A structured format */
  if (data.answer && (data.task || data.meta)) {
    return {
      title   : data.task?.task ?? 'Enhanced note',
      aiBody  : data.answer,
      task    : data.task || undefined,
      entities: data.entities || undefined,
      meta    : data.meta || undefined,
    };
  }
  /* Fallback – tolerate weird shapes */
  return data as ParsedRC;
}

/* Defensive helper – always returns render-safe text */
export function safeText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(safeText).filter(Boolean).join(', ');
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>;
    /* covers both {task,title} and {due,description} variants */
    const str =
      o.title ??
      o.description ??
      o.task ??
      o.name ??
      (Array.isArray(o) ? (o as unknown[]).map(safeText).join(', ') : '');
    return str || (Object.keys(o).length ? JSON.stringify(o) : '');
  }
  return String(val);
}