import { Memory } from '../../../server/ai/v3/memory/simple-memory.js';

(async () => {
  const uid = `u-${Date.now()}`;
  const fail = (m: string) => { console.error('❌', m); process.exit(1); };

  // 1. remember
  const r1 = await Memory.rememberFact(uid, 'Santa', 'pet');
  if (!r1.success) fail(r1.error!);

  // 2. recall
  const r2 = await Memory.recallFacts(uid, 'Santa');
  if (!r2.success || r2.data.length !== 1) fail('Recall failed');

  // 3. event log
  const ev = await Memory.logEvent(uid, 'note', 'create', 'Walk Santa');
  if (!ev.success) fail(ev.error!);

  // 4. pattern upsert
  const p = await Memory.upsertPattern(uid, 'sequence', 'walk->feed', { a: 1 });
  if (!p.success) fail(p.error!);

  console.log('🎉  All Stage‑2‑A memory tests passed');
  process.exit(0);
})();
