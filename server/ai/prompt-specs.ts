interface PromptOptions {
  userProfile?: { personalBio: string };
  intentVector?: any;
  mode: string;
  enabledFeatures?: any;
}

const CORE_SYSTEM = `You are Mira, an AI memory assistant. Analyze the user's note and return ONLY valid JSON.

Your response must include:
- title: concise title (max 45 chars)
- summary: brief summary of the note
- todos: array of actionable tasks with priority (low/medium/high)
- richContext: detailed analysis object

Return only the JSON object, no other text.`;

export function buildPrompt(options: PromptOptions): string {
  const bio = options.userProfile?.personalBio || "unknown user";
  
  return `${CORE_SYSTEM}

User Profile: ${bio}
Processing Mode: ${options.mode}

Required JSON Schema:
{
  "title": "string (max 45 chars)",
  "summary": "string (brief summary)",
  "todos": [{"title": "string", "priority": "low|medium|high"}],
  "richContext": {
    "aiGenerated": true,
    "processingMode": "string",
    "analysis": "detailed analysis",
    "nextSteps": ["array of suggestions"]
  }
}`;
}
