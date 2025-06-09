import { MiraAIInput } from "../miraAIProcessing";

export default function scheduledEventTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team specializing in scheduled events. Output **ONLY** valid JSON following the schema provided.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "scheduled-event",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "due": "ISO date", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "calendar|reminder|share", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Dinner Mom Tuesday","summary":"Dinner appointment with Mom next Tuesday at 7pm","intent":"scheduled-event","urgency":"medium","complexity":2,"todos":[{"title":"Meet Mom for dinner","due":"2024-01-09T19:00:00Z","priority":"medium"}],"smartActions":[{"label":"Add to Calendar","action":"calendar"}]}

OUTPUT ONLY JSON:`;
}