/**
 * Memory Brain - Pure Reminder/Todo Processing Path
 * Handles personal tasks, reminders, notes, and memory organization
 */

import { MiraAIInput, MiraAIResult } from './miraAIProcessing';
import { ClassificationResult } from './classifiers/commerceClassifier';

export async function memoryBrain(
  input: MiraAIInput, 
  classification: ClassificationResult
): Promise<MiraAIResult> {
  
  // Import OpenAI for consistent processing
  const openaiModule = await import('../openai');
  
  // Create memory-focused prompt
  const memoryPrompt = `
SYSTEM: You are Mira's memory assistant. Process this personal note with focus on task organization and reminders.

USER_INPUT: "${input.content}"

PROCESSING_FOCUS:
- Extract actionable tasks and reminders
- Identify time-sensitive elements
- Organize into logical todo structure
- Keep analysis concise and practical

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, newspaper headline style)",
  "summary": "string (brief processing note)",
  "intent": "${classification.primaryIntent}",
  "urgency": "low|medium|high|critical",
  "complexity": "number (1-5 for memory tasks)",
  "todos": [{"title": "exact user words", "priority": "urgency", "due": "ISO date if mentioned"}],
  "smartActions": [{"label": "Set Reminder", "action": "reminder"}]
}

MEMORY_PROCESSING_RULES:
- Preserve user's exact phrasing for todos
- Mark time-sensitive items as higher urgency
- Keep complexity scores low (1-5) for personal tasks
- Extract only explicitly mentioned actions
- No unnecessary elaboration or suggestions

OUTPUT ONLY JSON:
`;

  try {
    // Process through OpenAI with memory focus
    const result = await openaiModule.analyzeWithOpenAI(memoryPrompt, 'simple');
    
    // Create memory-focused result
    const memoryResult: MiraAIResult = {
      uid: '',
      timestamp: '',
      title: result.enhancedContent || extractMemoryTitle(input.content),
      summary: result.context || "Note processed",
      intent: classification.primaryIntent,
      urgency: result.urgencyLevel || determineUrgency(input.content),
      complexity: Math.min(result.complexityScore || 3, 5), // Memory tasks are simpler
      confidence: classification.confidence,
      todos: result.todos?.map(todo => ({
        title: todo,
        priority: result.urgencyLevel || 'medium',
        due: extractDueDate(input.content)
      })) || extractSimpleTodos(input.content),
      smartActions: generateMemoryActions(input.content, classification.primaryIntent),
      processingPath: 'memory',
      classificationScores: classification.scores,
      _rawModelJSON: result
    };
    
    return memoryResult;
    
  } catch (error) {
    console.error('Memory brain error:', error);
    
    // Fallback for memory tasks
    return {
      uid: '',
      timestamp: '',
      title: extractMemoryTitle(input.content),
      summary: "Note processed successfully",
      intent: classification.primaryIntent,
      urgency: determineUrgency(input.content),
      complexity: 2,
      confidence: classification.confidence,
      todos: extractSimpleTodos(input.content),
      smartActions: generateMemoryActions(input.content, classification.primaryIntent),
      processingPath: 'memory',
      classificationScores: classification.scores
    };
  }
}

/**
 * Extract memory-focused title (newspaper style)
 */
function extractMemoryTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  
  // Look for action words to create focused titles
  const actionMatch = content.match(/\b(call|email|meet|buy|pick up|remind|note|remember)\s+([^.!?]+)/i);
  if (actionMatch) {
    const actionPhrase = actionMatch[0].split(' ').slice(0, 4).join(' ');
    return actionPhrase.charAt(0).toUpperCase() + actionPhrase.slice(1);
  }
  
  // Fallback to first 3-5 words
  if (words.length <= 5) {
    return content;
  }
  return words.slice(0, 4).join(' ') + '...';
}

/**
 * Determine urgency based on time indicators
 */
function determineUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
  const contentLower = content.toLowerCase();
  
  // Critical indicators
  if (/\b(urgent|asap|emergency|immediately|now)\b/.test(contentLower)) {
    return 'critical';
  }
  
  // High urgency indicators
  if (/\b(today|tonight|this morning|this afternoon)\b/.test(contentLower)) {
    return 'high';
  }
  
  // Medium urgency indicators
  if (/\b(tomorrow|this week|soon|deadline)\b/.test(contentLower)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Extract simple todos from content
 */
function extractSimpleTodos(content: string): Array<{title: string, priority: string, due?: string}> {
  const urgency = determineUrgency(content);
  const dueDate = extractDueDate(content);
  
  // Simple extraction for single action items
  if (content.length < 100) {
    return [{
      title: content.trim(),
      priority: urgency,
      due: dueDate
    }];
  }
  
  // Multi-item extraction for longer content
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 3).map(sentence => ({
    title: sentence.trim(),
    priority: urgency,
    due: dueDate
  }));
}

/**
 * Extract due date from content
 */
function extractDueDate(content: string): string | undefined {
  const contentLower = content.toLowerCase();
  
  // Today
  if (/\b(today|tonight)\b/.test(contentLower)) {
    return new Date().toISOString().split('T')[0];
  }
  
  // Tomorrow
  if (/\btomorrow\b/.test(contentLower)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Specific dates (basic patterns)
  const dateMatch = content.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (dateMatch) {
    return `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
  }
  
  return undefined;
}

/**
 * Generate memory-specific smart actions
 */
function generateMemoryActions(content: string, intent: string): Array<{label: string, action: string}> {
  const actions = [];
  const contentLower = content.toLowerCase();
  
  // Time-based actions
  if (/\b(remind|reminder|alert)\b/.test(contentLower) || intent === 'reminder') {
    actions.push({
      label: 'Set Reminder',
      action: 'reminder'
    });
  }
  
  // Calendar actions
  if (/\b(meeting|appointment|call|@\s*\d+[ap]m?)\b/.test(contentLower)) {
    actions.push({
      label: 'Add to Calendar',
      action: 'calendar'
    });
  }
  
  // Note actions
  if (intent === 'personal-reflection' || content.length > 100) {
    actions.push({
      label: 'Save Note',
      action: 'save'
    });
  }
  
  // Default action
  if (actions.length === 0) {
    actions.push({
      label: 'Create Todo',
      action: 'todo'
    });
  }
  
  return actions;
}