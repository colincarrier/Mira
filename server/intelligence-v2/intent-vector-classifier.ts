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
  primaryActions: z.array(z.string()).transform(actions => 
    actions.map(action => {
      const actionMap: Record<string, ActionLabel> = {
        'remind': 'remind', 'buy': 'buy', 'research': 'research', 
        'log': 'log', 'schedule': 'schedule', 'delegate': 'delegate', 'track': 'track'
      };
      return actionMap[action.toLowerCase()] || 'research';
    }) as ActionLabel[]
  ),
  domainContexts: z.array(z.string()),
  temporalClass: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val[0] || 'immediate' : val
  ),
  collaborationScope: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val[0] || 'private' : val
  ),
  affectTone: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val[0] || 'neutral' : val
  ).optional()
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
