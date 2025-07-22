// Debug version of parseRichContext to isolate issues
export function debugParseRichContext(raw: string | null | undefined, noteId?: number): any {
  console.log(`🐛 [DEBUG] parseRichContext called for note ${noteId}`, { raw: raw?.slice(0, 100) });
  
  try {
    if (!raw) {
      console.log(`🐛 [DEBUG] No raw data for note ${noteId}`);
      return null;
    }

    // Basic JSON parse
    let parsed;
    try {
      parsed = JSON.parse(raw);
      console.log(`🐛 [DEBUG] Parsed successfully for note ${noteId}`, typeof parsed);
    } catch (e) {
      console.error(`🐛 [DEBUG] JSON parse failed for note ${noteId}:`, e);
      return null;
    }

    if (!parsed || typeof parsed !== 'object') {
      console.log(`🐛 [DEBUG] Invalid parsed object for note ${noteId}`);
      return null;
    }

    // Check format
    if ('answer' in parsed || 'task' in parsed) {
      console.log(`🐛 [DEBUG] Stage-4A format detected for note ${noteId}`);
      
      const result = {
        title: parsed.task?.task || 'Enhanced Note',
        aiBody: typeof parsed.answer === 'string' ? parsed.answer : '',
        perspective: 'AI-enhanced',
        quickInsights: parsed.answer ? [parsed.answer] : [],
        recommendedActions: parsed.task ? [`Create task: ${parsed.task.task}`] : [],
        nextSteps: parsed.task ? [parsed.task.task] : [],
        answer: parsed.answer,
        task: parsed.task,
        meta: parsed.meta,
      };
      
      console.log(`🐛 [DEBUG] Returning Stage-4A result for note ${noteId}:`, result);
      return result;
    }

    // Legacy format
    if ('title' in parsed || 'aiBody' in parsed) {
      console.log(`🐛 [DEBUG] Legacy format detected for note ${noteId}`);
      return parsed;
    }

    console.log(`🐛 [DEBUG] Unknown format for note ${noteId}`, Object.keys(parsed));
    return null;

  } catch (error) {
    console.error(`🐛 [DEBUG] Critical error in parseRichContext for note ${noteId}:`, error);
    return null;
  }
}