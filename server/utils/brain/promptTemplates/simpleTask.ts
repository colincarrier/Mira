import { MiraAIInput } from "../miraAIProcessing";

export default function simpleTaskTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team. Output **ONLY** valid JSON following the schema provided.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "simple-task",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "due": "ISO date", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "reminder|calendar|share", "payload": {}}],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "optionalTodos": [{"title": "string", "description": "string"}],
  "webSearchSuggestions": [{"query": "string", "category": "local|product|research"}]
}

EXAMPLE_OUTPUT: {"title":"Pay Rent Today","summary":"Monthly rent payment is due","intent":"simple-task","urgency":"medium","complexity":2,"todos":[{"title":"Pay rent to landlord","priority":"medium"}],"smartActions":[{"label":"Set Reminder","action":"reminder"}]}

OUTPUT ONLY JSON:`;
};