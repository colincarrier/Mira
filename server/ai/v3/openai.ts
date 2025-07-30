import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function callOpenAI(prompt: string, options: CallOptions = {}): Promise<string> {
  const {
    model = 'gpt-4o',
    maxTokens = 1900,
    temperature = 0.7
  } = options;

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0]?.message?.content || '';
}