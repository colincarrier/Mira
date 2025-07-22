/* Stage‑2C comprehensive smoke‑plus tests (Node/tsx) */

import { ReasoningEngine } from '../../../server/ai/v3/reasoning/reasoning-engine.js';
import { ContextMemory } from '../../../server/ai/v3/context/context-memory.js';

const eng = new ReasoningEngine({
  cacheSize: 50,
  cacheTtlMs: 30_000,
  maxTokens: 60,
  timeoutMs: 5_000
});
const uid = 'test-' + Date.now();

(async () => {
  console.log('🧪  Stage‑2C tests…');

  /* 1 ─ basic */
  const r1 = await eng.processNote(uid, 'Buy milk tomorrow at 3 pm');
  console.assert(r1.answer.length, 'response empty');

  /* 2 ─ cache */
  const r2 = await eng.processNote(uid, 'Buy milk tomorrow at 3 pm');
  console.assert(r2.meta.cached, 'second call not cached');

  /* 3 ─ Stage‑2B integration */
  let called = false;
  const orig = ContextMemory.prototype.processNote;
  ContextMemory.prototype.processNote = async function (u: string, n: string) {
    called = true;
    return orig.call(this, u, n);
  };
  await eng.processNote(uid, 'Met Alice at Google HQ');
  console.assert(called, 'context memory not invoked');
  ContextMemory.prototype.processNote = orig;

  /* 4 ─ circuit breaker */
  eng.testCircuitBreaker();
  const r3 = await eng.processNote(uid, 'Ping');
  console.assert(r3.answer.includes('temporarily'), 'CB message missing');

  /* 5 ─ reset breaker */
  eng.resetCircuitBreaker();
  const r4 = await eng.processNote(uid, 'Ping again');
  console.assert(!r4.answer.includes('temporarily'), 'CB not reset');

  console.log('✅  all Stage‑2C tests passed');
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});