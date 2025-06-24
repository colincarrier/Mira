export interface RichContext {
  title: string;
  original?: string;
  aiBody?: string;
  perspective?: string;
}

/** Build the four fields shown in the UI */
export function composeRichContext(raw: string, analysis: any): RichContext {
  const clean = raw.trim().replace(/\s+/g,' ');
  const title = clean.length<=45 ? clean : clean.slice(0,42)+'…';
  const original = clean===title ? '' : raw;

  let aiBody = '';
  if (analysis?.proactiveDelivery?.suggestedActions?.length) {
    aiBody = analysis.proactiveDelivery.suggestedActions
             .slice(0,3).map((a: any)=>'• '+a.action).join('\n');
  }
  const p1 = analysis?.immediateProcessing?.understanding?.slice(0,80);
  const p2 = analysis?.recursiveReasoning?.step1Anticipation?.likelyNextNeeds?.[0];
  const perspective = [p1,p2].filter(Boolean).join('\n');

  return { title, original, aiBody, perspective };
}