import { computeLeadMinutes } from '../../../server/ai/v3/notifications/leadtime.js';

const mock = (title:string, pr:'low'|'medium'|'high') => ({ title, priority: pr });

console.assert(computeLeadMinutes(mock('Flight to JFK', 'high') as any)  >= 180);
console.assert(computeLeadMinutes(mock('team meeting', 'medium') as any) >=  60);
console.assert(computeLeadMinutes(mock('buy milk', 'low') as any)        <=  15);
console.log('✅ lead‑time calculator smoke‑test passed');