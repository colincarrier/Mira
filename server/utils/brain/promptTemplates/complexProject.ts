import { MiraAIInput } from "../miraAIProcessing";

export default function complexProjectTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team specializing in complex projects. Output **ONLY** valid JSON following the schema provided.

USER_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "complex-project",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "due": "ISO date", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "reminder|calendar|share|summarise", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "suggestedLinks": ["string (note IDs)"],
  "collectionHint": {"name": "string", "icon": "string", "colour": "string"},
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Launch Mobile App","summary":"Comprehensive project to develop and launch healthcare mobile application","intent":"complex-project","urgency":"high","complexity":9,"todos":[{"title":"Research market requirements","priority":"high"},{"title":"Design user interface","priority":"medium"}],"smartActions":[{"label":"Create Timeline","action":"calendar"},{"label":"Share Plan","action":"share"}],"microQuestions":["What's your target launch date?","Do you have a development team?"]}

OUTPUT ONLY JSON:`;
}