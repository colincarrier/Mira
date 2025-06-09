import { MiraAIInput } from "../miraAIProcessing";

export default function simpleTaskTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team. Output **ONLY** valid JSON following the schema provided.

For SIMPLE TASKS: Keep processing minimal. Extract only what the user explicitly stated. Do NOT add unnecessary next steps or suggestions.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences, only if different from title)",
  "intent": "simple-task",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-5 for simple tasks)",
  "todos": [{"title": "string (match user's exact words)", "due": "ISO date if specified", "priority": "urgency"}],
  "smartActions": [{"label": "Add to Calendar", "action": "calendar"}],
  "entities": [],
  "optionalTodos": [],
  "nextSteps": []
}

EXAMPLE_OUTPUT: {"title":"Pay Rent Today","summary":"Monthly rent payment is due","intent":"simple-task","urgency":"medium","complexity":2,"todos":[{"title":"Pay rent to landlord","priority":"medium"}],"smartActions":[{"label":"Set Reminder","action":"reminder"}]}

OUTPUT ONLY JSON:`;
};