import { MiraAIInput } from "../miraAIProcessing";

export default function fallbackTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team providing fallback processing. Output **ONLY** valid JSON following the schema provided.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "unknown",
  "urgency": "low",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "share", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Note Captured","summary":"Note content has been processed and saved","intent":"unknown","urgency":"low","complexity":1,"todos":[],"smartActions":[{"label":"Share","action":"share"}]}

OUTPUT ONLY JSON:`;
}