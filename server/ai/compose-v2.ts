export function composeFromAnalysis(raw, a) {
  const clean = raw.trim().replace(/\s+/g,' ');
  const title = clean.length <= 45 ? clean : clean.slice(0,42)+'…';
  const original = title === clean ? "" : raw;

  let bullets = [];
  if (a?.proactiveDelivery?.suggestedActions) {
    bullets = a.proactiveDelivery.suggestedActions
      .filter(x => !/^Research /i.test(x.action))
      .slice(0, 3)
      .map(x => '• ' + x.action);
  }
  if (bullets.length === 0 && a?.recursiveReasoning?.step1Anticipation?.likelyNextNeeds) {
    bullets.push('• ' + a.recursiveReasoning.step1Anticipation.likelyNextNeeds[0]);
  }

  const aiBody = bullets.join('\n');
  const p1 = a?.immediateProcessing?.understanding?.slice(0, 80) || '';
  const p2 = a?.recursiveReasoning?.step1Anticipation?.followUpQuestions?.[0] || '';
  const perspective = [p1, p2].filter(Boolean).join('  ');

  return { title, original, aiBody, perspective, todos: [], reminder: null };
}
