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
  
  /* Image analysis additions */
  imageAnalysis?: any;
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
  if ('answer' in parsed || 'task' in parsed || 'meta' in parsed) {
    // Safer cleaning - only remove obvious double-wrapping
    let cleaned = parsed.answer;
    if (typeof cleaned === 'string' &&
        cleaned.startsWith('"') && cleaned.endsWith('"') &&
        !cleaned.slice(1, -1).includes('"')) {
      cleaned = cleaned.slice(1, -1).replace(/\\"/g, '"');
    }

    // Generate meaningful aiBody when answer is empty but task exists
    if ((!cleaned || cleaned.trim() === '') && parsed.task) {
      const taskName = parsed.task.task || 'task';
      const timing = parsed.task.timing_hint || parsed.task.dueDate;
      
      if (timing && !parsed.task.dueDate) {
        cleaned = `I'll help you with "${taskName}". When would you like to be reminded?`;
      } else if (parsed.task.dueDate) {
        cleaned = `Task scheduled: ${taskName} (due: ${new Date(parsed.task.dueDate).toLocaleDateString()})`;
      } else if (parsed.task.details) {
        cleaned = `Task identified: ${taskName}\n\n${parsed.task.details}`;
      } else {
        cleaned = `I've captured "${taskName}" as a task.`;
      }
    }

    const taskTitle = (() => {
      try {
        return (
          parsed.task?.task ||
          (cleaned && cleaned.split(/[.!?]/)[0]?.slice(0, 60)) ||
          'Enhanced Note'
        );
      } catch (err) {
        console.warn('Task title extraction failed:', err);
        return 'Enhanced Note';
      }
    })();

    return {
      title: taskTitle,
      aiBody: cleaned,
      perspective: parsed.meta?.latencyMs
        ? `Processed in ${parsed.meta.latencyMs} ms`
        : 'AI‑enhanced',
      quickInsights: cleaned ? [cleaned.split('\n')[0]] : [],
      recommendedActions: parsed.task ? [`Create task: ${parsed.task.task}`] : [],
      nextSteps: parsed.task ? [parsed.task.task] : [],
      /* keep verbatim Stage‑4A fields */
      answer: cleaned,
      task: parsed.task,
      meta: parsed.meta,
    };
  }

  /* ----- Intelligence V2 format (PRIORITY - check first) ----- */
  if ('title' in parsed && 'aiBody' in parsed && 'perspective' in parsed) {
    // This is the Intelligence V2 strategic analysis format
    console.log('🧠 Intelligence V2 content detected:', {
      title: parsed.title,
      aiBodyLength: parsed.aiBody?.length || 0,
      perspective: parsed.perspective,
      todosCount: parsed.todos?.length || 0
    });
    
    return {
      title: parsed.title,
      aiBody: parsed.aiBody,
      perspective: parsed.perspective,
      quickInsights: parsed.aiBody ? [parsed.aiBody] : [], // Show full aiBody as main insight
      recommendedActions: parsed.todos ? parsed.todos.map((todo: any) => todo.title) : [],
      nextSteps: parsed.todos ? parsed.todos.map((todo: any) => todo.title) : [],
      todos: parsed.todos || [],
      original: parsed.original || '',
      // Keep original Intelligence V2 fields
      ...parsed
    };
  }

  /* ----- Image Analysis Format ----- */
  if ('environmentalContext' in parsed || 'itemRelationships' in parsed || 'recommendedActions' in parsed) {
    console.log('🖼️ Image analysis content detected:', {
      hasEnvironmentalContext: !!parsed.environmentalContext,
      hasItemRelationships: !!parsed.itemRelationships,
      recommendedActionsCount: parsed.recommendedActions?.length || 0,
      researchResultsCount: parsed.researchResults?.length || 0,
      quickInsightsCount: parsed.quickInsights?.length || 0,
      fullData: parsed
    });

    // Build comprehensive AI body from image analysis
    let aiBody = '';
    
    if (parsed.environmentalContext) {
      aiBody += `**Environmental Context:**\n${parsed.environmentalContext}\n\n`;
    }
    
    if (parsed.itemRelationships) {
      aiBody += `**Item Analysis:**\n${parsed.itemRelationships}\n\n`;
    }
    
    if (parsed.organizationalInsights) {
      aiBody += `**Organizational Insights:**\n${parsed.organizationalInsights}\n\n`;
    }
    
    if (parsed.researchResults && parsed.researchResults.length > 0) {
      aiBody += `**Research Results:**\n`;
      parsed.researchResults.forEach((result: any) => {
        aiBody += `• **${result.title}**: ${result.description}\n`;
        if (result.keyPoints && result.keyPoints.length > 0) {
          result.keyPoints.forEach((point: string) => {
            aiBody += `  - ${point}\n`;
          });
        }
      });
      aiBody += '\n';
    }

    const title = parsed.recommendedActions?.[0]?.title || 'Image Analysis';
    const recommendedActions = parsed.recommendedActions?.map((action: any) => action.title) || [];
    const quickInsights = parsed.quickInsights || [];

    return {
      title,
      aiBody: aiBody.trim(),
      perspective: 'AI Image Analysis',
      quickInsights,
      recommendedActions,
      nextSteps: recommendedActions,
      // Keep original image analysis data
      imageAnalysis: parsed
    };
  }

  /* ----- legacy format ----- */
  if ('title' in parsed || 'aiBody' in parsed) {
    return parsed as ParsedRichContext;
  }

  /* unknown structure ‑ return null so UI can fall back */
  console.log('🚨 Unknown rich context structure:', Object.keys(parsed));
  return null;
}