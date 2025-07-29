// ---------- server/ai/v3/vendor-openai.ts ------------
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY_MIRA || process.env.OPENAI_API_KEY
});

export async function callOpenAI(messages: any[]): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 4096
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