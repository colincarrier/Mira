// ---------- server/ai/v3/vendor-openai.ts ------------
import { openai } from '../../openai';

export async function callOpenAI(messages: any[]): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 8192
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    if (error.message?.includes('JSON')) {
      throw new Error('Invalid JSON response from AI model');
    }
    throw error;
  }
}