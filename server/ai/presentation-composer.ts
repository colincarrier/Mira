interface RichContext {
  title: string;
  original: string;
  aiBody: string;
  perspective: string;
}

export function composeRichContext(raw: string, analysis: any): RichContext {
  // ------------ A  Title ------------
  const cleaned = raw.trim().replace(/\s+/g,' ');
  const title = cleaned.length <= 45 ? cleaned
        : (cleaned.slice(0, 42) + '…');

  // show original only if it differs
  const original = cleaned === title ? "" : raw;

  // ------------ C  AI body ------------
  let aiBody = "";
  if (analysis?.immediateProcessing?.intent === 'remind') {
    aiBody = `• Reminder set for ${analysis.temporalAnalysis?.explicitTimes?.[0]?.parsed || 'specified time'}`;
  } else if (analysis?.proactiveDelivery?.suggestedActions?.length) {
    aiBody = analysis.proactiveDelivery.suggestedActions
               .slice(0,3)
               .map((a: any) => '• ' + a.action)
               .join('\n');
  } else if (analysis?.contextualIntelligence?.crossReferences?.length) {
    aiBody = analysis.contextualIntelligence.crossReferences
               .slice(0,2)
               .map((c: any) => `• Related note #${c.contentId} (${(c.strength*100).toFixed(0)}%)`)
               .join('\n');
  }

  // fallback to NOTHING – never emit "Deep semantic comprehension"
  if (!aiBody.trim()) aiBody = "";

  // ------------ D  Perspective ------------
  const p1 = analysis?.immediateProcessing?.understanding?.slice(0,80);
  const p2 = analysis?.recursiveReasoning?.step1Anticipation?.likelyNextNeeds?.[0];
  const perspective = [p1, p2].filter(Boolean).join('\n');

  return { title, original, aiBody, perspective };
}