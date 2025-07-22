// Stage‑2C · prompt builder & sanitisation

import { stripHtml } from 'string-strip-html';
import { ValidationError } from './types.js';

// recognise explicit but vague time words
const TIMING_HINT_REGEX = /\b(?:later|soon|tomorrow|tonight|this\s+(?:afternoon|evening|morning)|next\s+week|next\s+month|in\s+a\s+(?:few|couple\s+of)\s+(?:hours|days))\b/i;

export class PromptBuilder {
  private sys = `You are Mira, a concise, helpful assistant. 
Analyse the note and offer insights (≤200 words).
• If there is a clear task, output exactly one line starting with TASK_JSON: followed by valid JSON describing it.
• If the user uses an explicit but ambiguous time word (e.g. "later", "soon", "tomorrow") 
  and you cannot determine a concrete date, put that literal word into a field 
  "timing_hint" inside the JSON instead of "dueDate", **do not drop it**.
• In that situation, end your answer with a short clarifying question 
  ("Sure – when should I remind you?").`;

  validate(uid: string, note: string) {
    const errs: string[] = [];
    if (!uid || uid.length > 100 || !/^[\w.@-]+$/.test(uid)) errs.push('bad uid');
    if (!note || note.length > 16_384) errs.push('bad note');
    if (errs.length) throw new ValidationError(errs.join(', '));
  }

  sanit(text: string) {
    return stripHtml(text)
      .result.replace(/[\x00-\x1F\x7F]/g, ' ')
      .trim();
  }

  build(uid: string, note: string, ctx: string[] = []) {
    this.validate(uid, note);
    const clean = this.sanit(note);
    const ctxStr = ctx.length ? `Context:\n- ${ctx.slice(0, 5).join('\n- ')}\n` : '';
    return `${this.sys}\n${ctxStr}User note:\n${clean}`;
  }

  extractTask(ans: string) {
    const m = ans.match(/TASK_JSON:\s*(\{.*\})/);
    if (!m) return null;
    try { 
      const taskJson = JSON.parse(m[1]);
      this.enhanceTiming(taskJson, ans);
      return taskJson;
    } catch { 
      return null; 
    }
  }

  /**
   * Post‑process the parsed task JSON:
   *  – if there is **no** dueDate but we see an explicit time word,
   *    store it in `timing_hint` and boost confidence slightly.
   */
  enhanceTiming(task: any, sourceText: string): void {
    if (!task || task.dueDate) return;
    const match = sourceText.match(TIMING_HINT_REGEX);
    if (match) {
      task.timing_hint = match[0];
      task.confidence = Math.max(task.confidence ?? 0.6, 0.65);
    }
  }
}