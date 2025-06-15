import OpenAI from 'openai';
import { z } from 'zod';

export type ActionLabel = 'remind' | 'buy' | 'research' | 'log' | 'schedule' | 'delegate' | 'track';
export interface IntentVector {
  primaryActions: ActionLabel[];
  domainContexts: string[];
  temporalClass: 'immediate' | 'short-term' | 'long-term' | 'evergreen';
  collaborationScope: 'private' | 'shared-internal' | 'shared-external';
  affectTone?: 'neutral' | 'celebratory' | 'sensitive' | 'urgent';
}

const schema = z.object({
  primaryActions: z.array(z.string()),
  domainContexts: z.array(z.string()),
  temporalClass: z.string(),
  collaborationScope: z.string(),
  affectTone: z.string().optional()
});

export class IntentVectorClassifier {
  private static openai = new OpenAI();

  static async classify(text: string): Promise<IntentVector> {
    const prompt = `
You are Mira's intent classifier. 
Classify the NOTE into the IntentVector JSON with keys:
primaryActions, domainContexts, temporalClass, collaborationScope, affectTone.
Respond with ONLY valid JSON.
NOTE: """${text}"""
`.trim();

    const chat = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });

    let raw = chat.choices[0]?.message?.content ?? '{}';
    
    // Strip markdown code blocks if present
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(raw.trim());
    return schema.parse(parsed);
  }
}
