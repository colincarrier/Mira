import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier } from './intent-vector-classifier.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { buildPrompt } from '../ai/prompt-specs.js';
import { composeFromAnalysis } from '../ai/compose-v2.js';

export class IntelligenceV2Router {
  constructor(openai) {
    this.openai = openai;
    this.vector = new VectorEngine(openai);
    this.reason = new RecursiveReasoningEngine(openai, this.vector);
  }

  async processNoteV2(input) {
    const userProfile = input.userProfile || { personalBio: "" };
    const prompt = buildPrompt(userProfile.personalBio || "", input.content);

    console.log("=== [MIRA V2] OPENAI INPUT PROMPT ===");
    console.log(prompt);
    console.log("=== END PROMPT ===");

    try {
      const gpt = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.4
      });

      const reply = gpt.choices[0].message?.content;
      let parsed;
      try {
        parsed = JSON.parse(reply ?? '{}');
      } catch (jsonError) {
        console.warn("🟠 GPT returned invalid JSON:", reply);
        parsed = {
          title: input.content.slice(0, 45),
          original: input.content,
          aiBody: '',
          perspective: 'Could not parse structured response.',
          todos: [],
          reminder: null
        };
      }

      const analysis = await this.reason.performRecursiveAnalysis(input.content, {}, [], {});
      const composed = composeFromAnalysis(input.content, analysis);

      return {
        ...composed,
        ...parsed,
        id: input.id ?? "temp",
        timestamp: new Date().toISOString(),
        richContext: { ...parsed, ...composed }
      };
    } catch (error) {
      console.error("❌ [V2] Processing failed:", error);
      throw error;
    }
  }
}
const singleton = new IntelligenceV2Router(new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY }));
export async function processWithIntelligenceV2(input) {
  return singleton.processNoteV2(input);
}
