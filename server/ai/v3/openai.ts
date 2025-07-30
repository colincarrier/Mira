import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  returnUsage?: boolean;
}

interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenAI(prompt: string, options: CallOptions = {}): Promise<string | OpenAIResponse> {
  const {
    model = 'gpt-4o',
    maxTokens = 1900,
    temperature = 0.7,
    returnUsage = false
  } = options;

  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });

  const content = response.choices[0]?.message?.content || '';
  
  if (returnUsage) {
    return {
      content,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      }
    };
  }

  return content;
}