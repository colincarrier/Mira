import { describe, expect, it } from 'vitest';
import { IntentVectorClassifier } from '../server/intelligence-v2/intent-vector-classifier';

describe('IntentVectorClassifier', () => {
  it('classifies simple buy intent', async () => {
    const v = await IntentVectorClassifier.classify('Buy milk tomorrow');
    expect(v.primaryActions).toContain('buy');
  }, 60000);
});