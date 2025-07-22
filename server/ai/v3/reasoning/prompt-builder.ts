// Stage‑2C · prompt builder & sanitisation

import { stripHtml } from 'string-strip-html';
import { ValidationError } from './types.js';

export class PromptBuilder {
  private sys = `You are Mira, a concise, helpful assistant. 
Analyse the note and offer insights (≤200 words).
If there is a clear task, output exactly one line starting with TASK_JSON: followed by valid JSON describing it.`;

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
    try { return JSON.parse(m[1]); } catch { return null; }
  }
}