// ---------- server/ai/v3/prompt.ts ------------
import type { IntentType } from './intent';

export function buildPrompt(content: string, intent: IntentType): any[] {
  const baseSystemPrompt = `You are Mira, an intelligent assistant that transforms user notes into structured, actionable content.

CRITICAL: Respond ONLY with valid JSON using this exact schema:
{
  "content": "Rich markdown content with detailed analysis",
  "tasks": [{"title": "Action item", "priority": "high|normal|low"}],
  "reminders": [{"timeISO": "2025-07-29T14:00:00-07:00", "leadMins": 1440}],
  "links": [{"url": "https://example.com", "title": "Link Title"}],
  "meta": {
    "model": "gpt-3.5-turbo", 
    "confidence": 0.85,
    "processingTimeMs": 0,
    "intent": "${intent}",
    "v": 3
  }
}

NO perspective field. NO character limits on content. Use unlimited markdown for rich formatting.`;

  const intentSpecificPrompt = getIntentSpecificPrompt(intent);
  
  return [
    { role: 'system', content: baseSystemPrompt },
    { role: 'system', content: intentSpecificPrompt },
    { role: 'user', content: content }
  ];
}

function getIntentSpecificPrompt(intent: IntentType): string {
  switch (intent) {
    case 'shopping':
      return `Focus on: price comparison, availability, purchase links, reviews, alternatives. Create actionable tasks for purchasing decisions.`;
    
    case 'reminder':
      return `Focus on: parsing time references, creating specific reminders, calculating appropriate lead times. Extract clear scheduling information.`;
    
    case 'research':
      return `Focus on: comprehensive analysis, multiple perspectives, credible sources, actionable insights. Provide thorough investigation.`;
    
    default:
      return `Focus on: organizing information, extracting actionable items, providing helpful context and next steps.`;
  }
}