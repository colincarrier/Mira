import { MiraAIInput } from "../miraAIProcessing";

export default function imageTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team specializing in image analysis. Output **ONLY** valid JSON following the schema provided.

USER_CONTEXT: "${input.content}"
IMAGE_DATA: [Base64 image provided]

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences describing what you see)",
  "intent": "media-upload",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "summarise|share|translate", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Restaurant Menu Captured","summary":"Image shows Italian restaurant menu with pasta and pizza options","intent":"media-upload","urgency":"low","complexity":2,"todos":[{"title":"Review menu items","priority":"low"}],"smartActions":[{"label":"Summarise","action":"summarise"}],"entities":[{"id":"uuid1","type":"place","value":"Italian Restaurant"}]}

OUTPUT ONLY JSON:`;
}