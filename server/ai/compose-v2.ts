import { RecursiveAnalysis } from '../intelligence-v2/recursive-reasoning-engine';

export function composeFromAnalysis(raw: string, a: RecursiveAnalysis) {
  const clean = raw.replace(/\s+/g,' ').trim();
  const title = clean.length <= 45 ? clean : clean.slice(0,42) + '…';
  const original = title === clean ? '' : raw;

  const bullets = (a?.proactiveDelivery?.suggestedActions ?? [])
    .filter(x => !/^Research|Check/i.test(x.action))
    .slice(0,3)
    .map(x => '• ' + x.action);

  return {
    title,
    original,
    aiBody: bullets.join('\n'),
    perspective: (a?.immediateProcessing?.understanding ?? '').slice(0,80),
    todos: bullets.map(b => ({ title: b.slice(2), priority:'normal' })),
    reminder: null
  };
}