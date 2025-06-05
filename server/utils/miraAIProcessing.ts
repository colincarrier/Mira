/**
 * MIRA AI BRAIN - Processing Engine for Intelligent Note Handling
 * 
 * ⚠️  CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT APPROVAL ⚠️
 * This file contains core AI processing logic and prompts.
 * Any changes require proposal and approval process.
 * See AI_MODIFICATION_RULES.md for protection protocol.
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

**Your comprehensive analysis must include:**

1. **CONTENT ENHANCEMENT**: Improve clarity, completeness, and usefulness of the original content
2. **CLASSIFICATION**: Determine if this is a reminder, todo, or collection item  
3. **COMPLEXITY ASSESSMENT**: Rate complexity (1-10) and classify intent type
4. **TASK EXTRACTION**: Identify actionable items and create structured task hierarchies
5. **INDIVIDUAL ITEM PARSING**: Extract specific items mentioned (books, movies, restaurants, products, etc.) that should be tracked as individual entries in collections
6. **INTELLIGENT CATEGORIZATION**: Suggest appropriate collections with icons and colors
7. **RICH CONTEXT GENERATION**: Provide research insights, recommendations, and quick insights
8. **PREDICTIVE INTELLIGENCE**: Next steps, time estimates, success factors, potential obstacles
9. **KNOWLEDGE CONNECTIONS**: Related topics, required skills, needed resources

**Classification Types:**
- **REMINDER**: Time-sensitive items that need to resurface at specific moments. Should have clear timing (due dates, recurring patterns, or time dependencies). Always analyze for time-sensitivity cues.
- **TODO**: Action-oriented items requiring follow-through. May have timing but emphasis is on completion rather than time-based alerts.
- **COLLECTION**: Long-term memory, ideas, research, references without immediate time constraints.

**Required JSON Output Structure:**
{
  "enhancedContent": "Improved version of the original content with clarity and completeness",
  "suggestion": "Actionable recommendation or insight about this content",
  "context": "Contextual summary and relevance assessment",
  "complexityScore": 1-10,
  "intentType": "simple-task|complex-project|research-inquiry|personal-reflection|reference-material",
  "urgencyLevel": "low|medium|high|critical",
  "todos": [
    {
      "title": "Specific actionable item",
      "itemType": "todo|reminder",
      "timeDue": "ISO timestamp or null",
      "timeDependency": "none|sequential|parallel|contingent",
      "plannedNotificationStructure": {
        "enabled": true/false,
        "reminderCategory": "today|week|month|year|not_set",
        "repeatPattern": "none|hourly|daily|weekly|monthly|annual",
        "leadTimeNotifications": ["1 hour before", "1 day before"]
      },
      "isActiveReminder": true/false
    }
  ],
  "individualItems": [
    {
      "title": "Individual item title (e.g., book name, movie title, restaurant name)",
      "type": "book|movie|restaurant|product|place|person|concept",
      "description": "Brief description of the item",
      "context": "Why this item was mentioned",
      "needsDetailedPage": true/false
    }
  ],
  "taskHierarchy": [
    {
      "phase": "Phase name",
      "description": "What this phase accomplishes",
      "tasks": ["specific tasks in this phase"],
      "estimatedTime": "time estimate",
      "dependencies": ["what must be done first"]
    }
  ],
  "collectionSuggestion": {
    "name": "Suggested collection name",
    "icon": "appropriate icon name",
    "color": "suggested color"
  },
  "richContext": {
    "recommendedActions": [
      {
        "title": "Action title",
        "description": "Why this action matters",
        "links": [{"title": "Resource name", "url": "relevant URL"}]
      }
    ],
    "researchResults": [
      {
        "title": "Research finding",
        "description": "Key insight or information",
        "rating": "quality/relevance rating",
        "keyPoints": ["important points"],
        "contact": "relevant contact if applicable"
      }
    ],
    "quickInsights": ["array of quick actionable insights"]
  },
  "nextSteps": ["immediate next actions"],
  "timeToComplete": "estimated time needed",
  "successFactors": ["what makes this likely to succeed"],
  "potentialObstacles": ["challenges to watch for"],
  "relatedTopics": ["connected subjects"],
  "skillsRequired": ["abilities needed"],
  "resourcesNeeded": ["tools, people, or materials required"],
  "extractedItems": [
    {
      "title": "specific item name",
      "description": "brief description",
      "category": "book|movie|restaurant|product|place|person|concept",
      "metadata": {"additional": "contextual data"}
    }
  ]
}

**Analysis Rules:**
- Provide comprehensive analysis even for simple inputs
- Generate rich context and connections
- Be intelligent about task decomposition
- Suggest meaningful collections and categories
- Focus on adding genuine value and insight
- Include predictive intelligence about success and obstacles
- Extract specific trackable items (books, movies, restaurants, products, places, people, concepts) mentioned in the content
- For extractedItems, include only concrete, specific items that can be tracked individually
- Use appropriate categories: book, movie, restaurant, product, place, person, concept

**Time-Sensitivity Analysis Rules:**
- Carefully analyze input for temporal cues: "tomorrow", "next week", "by Friday", "every morning", "annual", "daily"
- Distinguish REMINDER vs TODO based on time-sensitivity:
  * REMINDER: Has explicit timing, recurring patterns, or time-critical nature
  * TODO: Action-focused, may have deadlines but emphasis is on completion
- Set timeDue for any date/time references found in the input
- Classify timeDependency based on sequence indicators in the content
- Enable notifications for time-sensitive items and set appropriate reminderCategory
- Mark isActiveReminder=true for items that should appear in Reminders section

Now analyze this input and provide the complete JSON structure:
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