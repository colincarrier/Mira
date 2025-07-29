// ---------- server/ai/v3/intent.ts ------------
export type IntentType = 'research' | 'reminder' | 'shopping' | 'general';

export function detectIntent(content: string): IntentType {
  const lower = content.toLowerCase();
  
  // Shopping indicators
  const shoppingKeywords = ['buy', 'purchase', 'ticket', 'tix', 'price', 'cost', 'deal', 'shop', 'order'];
  if (shoppingKeywords.some(keyword => lower.includes(keyword))) {
    return 'shopping';
  }
  
  // Reminder indicators
  const reminderKeywords = ['remind', 'remember', 'later', 'tomorrow', 'next week', 'schedule', 'appointment'];
  if (reminderKeywords.some(keyword => lower.includes(keyword))) {
    return 'reminder';
  }
  
  // Research indicators
  const researchKeywords = ['research', 'find out', 'learn about', 'investigate', 'analyze', 'compare'];
  if (researchKeywords.some(keyword => lower.includes(keyword))) {
    return 'research';
  }
  
  return 'general';
}