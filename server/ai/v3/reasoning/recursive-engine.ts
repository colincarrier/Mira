import { callOpenAI } from '../openai';
import { getUserPatterns, getCollectionHints, getRecentNotes } from '../../../storage';

interface Context {
  recentNotes: string[];
  userPatterns: any;
  collectionHints: any[];
  userId: string;
}

interface Intent {
  primary: string;
  depth: string;
  urgency: string;
}

export class RecursiveEngine {
  async process(text: string, userId: string, intent: Intent) {
    const context = {
      recentNotes: (await getRecentNotes(userId, 5)),
      userPatterns: await getUserPatterns(userId),
      collectionHints: await getCollectionHints(text),
      userId
    };

    let note;
    try {
      note = await this.singlePass(text, context, intent);
    } catch (err) {
      console.error('[AI] initial pass failed', err);
      return { note: text, links: [], depth: 0 };
    }
    
    return { note, links: [], depth: 1 };
  }

  private async singlePass(text: string, context: Context, intent: Intent) {
    const prompt = `Enhance this note with recursive reasoning: ${text}`;
    return await callOpenAI(prompt, { model: 'gpt-4o', maxTokens: 1000 });
  }
}