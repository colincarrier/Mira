import { MiraAIInput } from "../miraAIProcessing";

export default function voiceTemplate(input: MiraAIInput): string {
  return `
SYSTEM: You are Mira's elite secretary team specializing in voice transcription analysis. Output **ONLY** valid JSON following the schema provided.

USER_VOICE_NOTE: "${input.content}"

DESIRED_SCHEMA: {
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences)",
  "intent": "simple-task" | "recurring-task" | "scheduled-event" | "complex-project" | "research" | "reference" | "idea" | "inspiration" | "memory-log" | "knowledge" | "personal-reflection",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "string", "due": "ISO date", "priority": "urgency"}],
  "smartActions": [{"label": "string", "action": "reminder|calendar|share|summarise", "payload": {}}],
  "microQuestions": ["string (clarification prompts)"],
  "entities": [{"id": "uuid", "type": "person|org|place|thing|date|concept", "value": "string"}],
  "nextSteps": ["string"]
}

EXAMPLE_OUTPUT: {"title":"Call Doctor Tomorrow","summary":"Voice reminder to call doctor about appointment","intent":"simple-task","urgency":"medium","complexity":2,"todos":[{"title":"Call Dr. Smith","due":"2024-01-09T09:00:00Z","priority":"medium"}],"smartActions":[{"label":"Set Reminder","action":"reminder"}]}

OUTPUT ONLY JSON:`;
}