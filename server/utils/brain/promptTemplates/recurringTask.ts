import { MiraAIInput } from "../miraAIProcessing";

export = function recurringTaskTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team specializing in recurring tasks. Output **ONLY** valid JSON following the schema provided.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "recurring-task",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "due": "ISO date", "recurrence": "RRULE", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "reminder|calendar|share", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Weekly Team Meeting","summary":"Recurring weekly team standup every Monday","intent":"recurring-task","urgency":"medium","complexity":3,"todos":[{"title":"Attend team meeting","recurrence":"FREQ=WEEKLY;BYDAY=MO","priority":"medium"}],"smartActions":[{"label":"Add to Calendar","action":"calendar"}]}

OUTPUT ONLY JSON:`;
};