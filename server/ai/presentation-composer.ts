export interface RichContext {
  title: string;
  original?: string;
  aiBody?: string;
  perspective?: string;
}

/** Build the four fields shown in the UI */
export function composeRichContext(raw: string, analysis: any): RichContext {
  // Clean raw content - remove any AI instruction artifacts
  let cleanContent = raw.trim()
    .replace(/\[AI Analysis:.*?\]/g, '')
    .replace(/\[AI Context:.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const title = cleanContent.length <= 45 ? cleanContent : cleanContent.slice(0, 42) + '…';
  const original = cleanContent === title ? '' : cleanContent;

  // Generate meaningful AI body from actual analysis
  let aiBody = '';
  if (analysis?.proactiveDelivery?.suggestedActions?.length) {
    const actions = analysis.proactiveDelivery.suggestedActions
      .filter((a: any) => a.action && !a.action.includes('research') && !a.action.includes('investigation'))
      .slice(0, 3)
      .map((a: any) => '• ' + a.action);
    
    if (actions.length > 0) {
      aiBody = actions.join('\n');
    }
  }

  // Generate concise perspective from understanding
  let perspective = '';
  if (analysis?.immediateProcessing?.understanding) {
    const understanding = analysis.immediateProcessing.understanding;
    // Remove bio context and keep only relevant insight
    perspective = understanding
      .replace(/\(.*?\)/g, '') // Remove parenthetical bio context
      .slice(0, 100)
      .trim();
  }

  return { title, original, aiBody, perspective };
}