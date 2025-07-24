// Stage‑2C · prompt builder & sanitisation

import { stripHtml } from 'string-strip-html';
import { ValidationError, ExtractedTask } from './types.js';

// recognise explicit but vague time words
const TIMING_HINT_REGEX = /\b(?:later|soon|tomorrow|tonight|this\s+(?:afternoon|evening|morning)|next\s+week|next\s+month|in\s+a\s+(?:few|couple\s+of)\s+(?:hours|days))\b/i;

export class PromptBuilder {
  private sys = `You are Mira, a superhuman AI assistant with access to user context and memory.

**CORE INTELLIGENCE RULES:**
• If the user's request is ambiguous, ask exactly ONE clarifying question before proceeding
• Use provided memory facts and user context to personalize your response
• Generate actionable, specific insights (≤250 words)
• If there is a clear task, output exactly one line starting with TASK_JSON: followed by valid JSON describing it
• For timing words like "later", "soon", "tomorrow" without concrete dates, use "timing_hint" field

**CLARIFICATION EXAMPLES:**
- "Find airpods" → "Are you looking for lost AirPods or shopping for new ones?"
- "Book flight" → "Where are you traveling from and to?"
- "Schedule meeting" → "Who should attend and what's the topic?"

**RESPONSE FORMAT:**
Always provide meaningful analysis even when creating tasks. Never output empty answers.`;

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

  build(uid: string, note: string, ctx: string[] = [], userBio?: string) {
    this.validate(uid, note);
    const clean = this.sanit(note);
    
    // Memory facts section
    const memoryFacts = ctx.length > 0 ? 
      `**MEMORY FACTS:**\n${ctx.slice(0, 5).map(fact => `• ${fact}`).join('\n')}\n` : 
      '**MEMORY FACTS:** None available\n';
    
    // User context section  
    const userContext = userBio ? 
      `**USER CONTEXT:**\n${userBio.substring(0, 500)}\n` : 
      '**USER CONTEXT:** Limited profile information\n';
    
    return `${this.sys}\n\n${memoryFacts}\n${userContext}\n**USER NOTE:**\n${clean}`;
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

  /**
   * Returns both the parsed task (if present) **and** the answer string
   * with the TASK_JSON line stripped out.
   */
  extractTaskAndCleanAnswer(
    ans: string,
  ): { task: ExtractedTask | null; answerClean: string } {
    // locate the TASK_JSON line first – safest against nested braces
    const lines = ans.split('\n');
    const idx = lines.findIndex(l => l.trimStart().startsWith('TASK_JSON:'));
    if (idx === -1) return { task: null, answerClean: ans.trim() };

    const jsonStart = lines[idx].indexOf('{');
    let task: ExtractedTask | null = null;

    if (jsonStart !== -1) {
      try { task = JSON.parse(lines[idx].slice(jsonStart)); } catch { /* ignore */ }
    }

    lines.splice(idx, 1); // remove the TASK_JSON line
    return { task, answerClean: lines.join('\n').trim() };
  }
}