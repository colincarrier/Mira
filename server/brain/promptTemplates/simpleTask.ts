/**
 * Simple Task Template - Memory processing for basic todos and reminders
 */

import { MiraAIInput } from '../miraAIProcessing';
import { dispatcherPrompt } from './dispatcherPrompt';

export function simpleTaskTemplate(input: MiraAIInput): string {
  const basePrompt = dispatcherPrompt(input);
  
  return `${basePrompt}

INTENT_CLASSIFICATION: simple-task
ADDITIONAL_HINT: This appears to be a straightforward task or reminder. Keep processing minimal and extract only explicit user requirements.

REQUIRED_SCHEMA:
{
  "title": "string (3-5 words max, newspaper headline style)",
  "summary": "string (1-2 sentences, only if different from title)",
  "intent": "simple-task",
  "urgency": "low" | "medium" | "high" | "critical",
  "complexity": "number (1-5 for simple tasks)",
  "todos": [{"title": "string (match user's exact words)", "due": "ISO date if specified", "priority": "urgency"}],
  "smartActions": [{"label": "Set Reminder", "action": "reminder"}],
  "entities": [],
  "optionalTodos": [],
  "nextSteps": []
}

PROCESSING_RULES:
- Extract only what user explicitly stated
- Do NOT add unnecessary next steps or suggestions
- Keep complexity between 1-5
- Use user's exact phrasing for todos
- Mark time-sensitive items with appropriate urgency

OUTPUT ONLY JSON:`;
}