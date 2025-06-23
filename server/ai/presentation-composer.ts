export function composeRichContext(raw: string, analysis: any) {
  const cleanedTitle = raw.length > 55 ? raw.slice(0, 52) + '…' : raw.split('\n')[0];
  const originalSnippet = cleanedTitle === raw ? "" : raw;
  const aiBody = buildAiBody(analysis);
  return { title: cleanedTitle, original: originalSnippet, aiBody };
}

function buildAiBody(analysis: any) {
  if (!analysis) return "";
  const bullets = analysis.proactiveDelivery?.suggestedActions?.slice(0, 3).map((a: any) => "• " + a.action) || [];
  return bullets.join('\n');
}