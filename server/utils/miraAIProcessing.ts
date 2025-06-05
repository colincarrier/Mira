/**
 * MIRA AI BRAIN — Processing Engine for Intelligent Note Handling
 * This engine is responsible for:
 * - Intelligent input classification
 * - Disciplined to-do/reminder creation
 * - Context-rich enrichment and layout suggestions
 * - Reasoning about time-sensitivity, relevance, and priority
 */

export interface MiraAIInput {
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  timestamp: number;
  context?: {
    location?: string;
    timeOfDay?: string;
    recentActivity?: string[];
  };
}

export interface MiraAIOutput {
  type: 'reminder' | 'todo' | 'collection';
  title: string;
  description: string;
  followUps?: string[];
  layoutHint?: 'checklist' | 'calendar' | 'card' | 'timeline' | 'list';
  notificationSchedule?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
}

export const miraPromptTemplate = `
You are Mira, an AI-powered personal assistant with superhuman intelligence, impeccable judgment, and memory optimization capabilities. You interpret every input with nuance, precision, and human-like intuition.

---

**Your Role:**
- You are NOT a summarizer.
- You transform user input into smart, actionable, or memory-catalogued records.
- You determine whether something is a REMINDER, a TO-DO, or a COLLECTION item.
- You add value: interpret context, reason through what's important, and make obvious next steps clear.

---

**Your Primary Classification Duties:**

1. **REMINDER**
- Time-sensitive.
- Meant to be surfaced again at the right moment.
- Often short and imperative (e.g., "Pay rent April 1st", "Pick up Atlas at 5pm").
- If applicable, generate a notification schedule (e.g., 1 month before, 1 week before, 1 day before, day-of).

2. **TO-DO**
- Requires action/follow-through.
- Should only be created if an action is explicitly implied.
- Projects often generate to-dos.
- DO NOT over-create these. If there is doubt, assume it's context or collection unless clearly actionable.

3. **COLLECTION ITEM**
- Long-term memory.
- Not time-sensitive.
- Often includes ideas, research, books, links, quotes, inspiration, thoughts.
- Categorized into smart templates (e.g., "Books to Read", "Restaurants to Try", "Gift Ideas").

---

**What to Generate:**

1. **type**: "reminder", "todo", or "collection"
2. **title**: A short, human-readable title for the entry
3. **description**: Value-added explanation or framing that helps the user see why this matters
4. **followUps** (optional): An array of actionable subtasks or next steps (for todos only)
5. **layoutHint** (optional): Suggest UI presentation type ("checklist", "calendar", "card", "timeline", etc.)
6. **notificationSchedule** (optional): For reminders, specify when this should re-surface

---

**Examples:**

_Input:_ "Pay taxes by April 15th"
_Output:_ {
  type: "reminder",
  title: "Pay Taxes",
  description: "Annual IRS tax filing is due.",
  notificationSchedule: ["2025-03-15", "2025-04-08", "2025-04-14", "2025-04-15"]
}

_Input:_ "Pick up Atlas at 5pm"
_Output:_ {
  type: "reminder",
  title: "Pick up Atlas",
  description: "Pickup time for Atlas is 5:00 PM today.",
  notificationSchedule: ["same-day"]
}

_Input:_ "Research ideas for Mira's AI taxonomy"
_Output:_ {
  type: "todo",
  title: "Research Mira's AI taxonomy",
  description: "Look into established classification systems to inform Mira's core intelligence layer.",
  followUps: ["Review AI note-taking schemas", "Draft taxonomy outline"]
}

_Input:_ "Books I want to read: The Overstory, The Creative Act"
_Output:_ {
  type: "collection",
  title: "Books to Read",
  description: "User-curated book list",
  layoutHint: "list"
}

---

**Important Rules:**
- Never hallucinate time-sensitive reminders unless a clear deadline is stated.
- Never summarize the input. Instead, reason through it and surface what's most useful.
- Only generate a to-do if an action is implied or defensible.
- Use followUps *only* for to-dos that imply multi-step execution.
- Classify and enrich content with empathy, intelligence, and restraint.

Now, generate the correct output from this input:
"""
{user_input}
"""
`;

/**
 * Process user input through Mira AI Brain
 */
export async function processMiraAIInput(
  input: MiraAIInput,
  aiAnalysisFunction: (prompt: string) => Promise<any>
): Promise<MiraAIOutput> {
  const prompt = miraPromptTemplate.replace('{user_input}', input.content);
  
  try {
    const aiResponse = await aiAnalysisFunction(prompt);
    return validateMiraAIOutput(aiResponse);
  } catch (error) {
    console.error('Mira AI processing error:', error);
    // Fallback to basic classification
    return {
      type: 'collection',
      title: input.content.slice(0, 50) + (input.content.length > 50 ? '...' : ''),
      description: input.content
    };
  }
}

/**
 * Validate and sanitize AI output
 */
export function validateMiraAIOutput(output: any): MiraAIOutput {
  return {
    type: ['reminder', 'todo', 'collection'].includes(output.type) ? output.type : 'collection',
    title: output.title || 'Untitled',
    description: output.description || '',
    followUps: Array.isArray(output.followUps) ? output.followUps : undefined,
    layoutHint: output.layoutHint,
    notificationSchedule: Array.isArray(output.notificationSchedule) ? output.notificationSchedule : undefined,
    priority: output.priority || 'medium',
    collectionSuggestion: output.collectionSuggestion
  };
}

/**
 * Extract time-sensitive items for notification scheduling
 */
export function extractNotificationItems(output: MiraAIOutput): Array<{
  content: string;
  scheduledTime: Date;
  type: 'reminder' | 'todo';
  priority: string;
}> {
  const items: Array<{
    content: string;
    scheduledTime: Date;
    type: 'reminder' | 'todo';
    priority: string;
  }> = [];

  if (output.type === 'reminder' && output.notificationSchedule) {
    output.notificationSchedule.forEach(scheduleItem => {
      let scheduledTime: Date;
      
      if (scheduleItem === 'same-day') {
        scheduledTime = new Date();
        scheduledTime.setHours(scheduledTime.getHours() + 1); // 1 hour from now
      } else {
        scheduledTime = new Date(scheduleItem);
      }
      
      items.push({
        content: output.title,
        scheduledTime,
        type: 'reminder',
        priority: output.priority || 'medium'
      });
    });
  }

  return items;
}

/**
 * Smart collection name generation
 */
export function generateCollectionName(content: string, existingCollections: string[]): string {
  const commonPatterns = [
    { pattern: /book|read/i, name: 'Books to Read' },
    { pattern: /recipe|cook|food/i, name: 'Recipes' },
    { pattern: /movie|film|watch/i, name: 'Movies & TV' },
    { pattern: /restaurant|eat|dining/i, name: 'Restaurants' },
    { pattern: /gift|present/i, name: 'Gift Ideas' },
    { pattern: /travel|trip|vacation/i, name: 'Travel' },
    { pattern: /idea|inspiration/i, name: 'Ideas' },
    { pattern: /quote|wisdom/i, name: 'Quotes & Wisdom' },
    { pattern: /project|work/i, name: 'Projects' },
    { pattern: /learn|study|course/i, name: 'Learning' }
  ];

  for (const { pattern, name } of commonPatterns) {
    if (pattern.test(content) && !existingCollections.includes(name)) {
      return name;
    }
  }

  return 'Personal';
}

export default miraPromptTemplate;