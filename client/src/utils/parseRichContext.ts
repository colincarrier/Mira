/**
 * Normalises the `rich_context` JSON returned from the backend.
 *  • Understands both legacy (Stage‑3) and Stage‑4A formats
 *  • Attempts to salvage partially‑escaped / malformed strings
 *  • Returns `null` when nothing useful can be parsed
 *
 *  Add new properties here as the payload evolves.
 */

export interface ParsedRichContext {
  /* canonical cross‑stage fields */
  title: string;
  original?: string;
  aiBody?: string;
  perspective?: string;
  recommendedActions?: string[];
  quickInsights?: string[];
  nextSteps?: string[];

  /* Stage‑4A additions (kept verbatim) */
  answer?: string;
  task?: {
    task: string;
    timing_hint?: string;
    confidence?: number;
  };
  meta?: {
    latencyMs?: number;
    confidence?: number;
    model?: string;
  };
}

export function parseRichContext(raw: string | null | undefined): ParsedRichContext | null {
  if (!raw) return null;

  /** util: parse JSON safely, falling back to second‑pass decode */
  const tryParse = (str: string): any | null => {
    try {
      return JSON.parse(str);
    } catch {
      try {
        return JSON.parse(JSON.parse(str));
      } catch {
        return null;
      }
    }
  };

  const parsed = tryParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  /* ----- Stage‑4A format ----- */
  if ('answer' in parsed || 'task' in parsed) {
    const cleanAnswer = typeof parsed.answer === 'string'
      ? parsed.answer
          .replace(/^"+|"+$/g, '')                 // strip stray quotes
          .replace(/\\"/g, '"')                    // unescape
          .trim()
      : '';

    const taskTitle =
      parsed.task?.task ||
      cleanAnswer.match(/"task"\s*:\s*"([^"]+)"/)?.[1] ||
      cleanAnswer.split(/[.!?]/)[0]?.slice(0, 60) ||
      'Enhanced Note';

    return {
      title: taskTitle,
      aiBody: cleanAnswer,
      perspective: parsed.meta?.latencyMs
        ? `Processed in ${parsed.meta.latencyMs} ms`
        : 'AI‑enhanced',
      quickInsights: cleanAnswer ? [cleanAnswer] : [],
      recommendedActions: parsed.task ? [`Create task: ${parsed.task.task}`] : [],
      nextSteps: parsed.task ? [parsed.task.task] : [],
      /* keep verbatim Stage‑4A fields */
      answer: cleanAnswer,
      task: parsed.task,
      meta: parsed.meta,
    };
  }

  /* ----- legacy format ----- */
  if ('title' in parsed || 'aiBody' in parsed) {
    return parsed as ParsedRichContext;
  }

  /* unknown structure ‑ return null so UI can fall back */
  return null;
}