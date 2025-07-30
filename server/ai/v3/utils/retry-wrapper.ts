// Part 1: Robust retry wrapper for OpenAI calls
import { callOpenAI } from '../openai';

export async function callWithRetry(prompt: string, options: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callOpenAI(prompt, options);
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error(`[AI] All ${maxRetries} retry attempts failed:`, error.message);
        throw error;
      }
      
      console.warn(`[AI] Attempt ${attempt} failed, retrying in ${attempt}s:`, error.message);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}