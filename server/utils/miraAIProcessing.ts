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
  description?: string;
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  complexityScore?: number;
  intentType?: string;
  urgencyLevel?: string;
  todos?: string[];
  extractedItems?: any[];
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  criticalQuestions?: string[];
  predictiveNextSteps?: any;
  priorityContext?: any;
  richContext?: any;
  followUps?: string[];
  layoutHint?: 'checklist' | 'calendar' | 'card' | 'timeline' | 'list';
  notificationSchedule?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export const miraPromptTemplate = `
You are Mira, an AI-powered personal assistant with superhuman intelligence, impeccable judgment, and memory optimization capabilities. You interpret every input with nuance, precision, and human-like intuition.

**Your intelligent analysis priorities:**

1. **CONCISE TITLE GENERATION**: Create scannable 1-2 line titles that capture core essence for quick identification
2. **SMART CATEGORIZATION**: Force categorization into existing collections (To-dos, Personal, Home, Work) or 'Other' if unclear
3. **INDIVIDUAL ITEM EXTRACTION**: Parse specific trackable items (books, movies, restaurants, products, places) with rich metadata
4. **CONTEXTUAL DESCRIPTION**: Only provide description if title lacks essential context
5. **CONDENSED SUMMARIES**: Only for long inputs or complex project files - most should be shorthand
6. **RICH MEDIA INTEGRATION**: Pull authentic data - restaurant details (phone, address, reviews), book/movie info (summaries, purchase links), product details
7. **PREDICTIVE NEXT STEPS**: Think two steps ahead - anticipate user's likely next actions and the step after that
8. **CRITICAL CLARIFICATION**: Max 2 super-short questions for high-confidence, time-sensitive decisions only
9. **PRIORITY-BASED CONTEXT**: AI determines most important additional fields based on input richness and reminder type

**Classification Types:**
- **REMINDER**: Time-sensitive items that need to resurface at specific moments. Should have clear timing (due dates, recurring patterns, or time dependencies). Always analyze for time-sensitivity cues.
- **TODO**: Action-oriented items requiring follow-through. May have timing but emphasis is on completion rather than time-based alerts.
- **COLLECTION**: Long-term memory, ideas, research, references without immediate time constraints.

**Required JSON Output Structure:**
{
  "enhancedContent": "Only for long inputs or complex projects - condensed summary, otherwise omit",
  "suggestion": "Only if title lacks essential context",
  "context": "Contextual summary and relevance assessment",
  "complexityScore": 1-10,
  "intentType": "simple-task|complex-project|research-inquiry|personal-reflection|reference-material",
  "urgencyLevel": "low|medium|high|critical",
  "todos": [
    {
      "title": "Concise 1-2 line actionable item for quick scanning",
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
  "extractedItems": [
    {
      "title": "specific item name",
      "description": "brief description",
      "category": "book|movie|restaurant|product|place|person|concept",
      "metadata": {
        "richMedia": {
          "imageUrl": "high-confidence authentic image URL",
          "phone": "phone number if restaurant/business",
          "address": "full address if place/restaurant",
          "rating": "review rating if available",
          "priceRange": "price info if available",
          "summary": "brief summary for books/movies",
          "purchaseLinks": ["authentic purchase/booking URLs"],
          "reviews": ["key review snippets"],
          "hours": "business hours if applicable"
        },
        "internetLinks": ["relevant authentic URLs"]
      }
    }
  ],
  "collectionSuggestion": {
    "name": "To-dos|Personal|Home|Work|Other",
    "icon": "appropriate icon name",
    "color": "suggested color"
  },
  "criticalQuestions": [
    "Super-short paraphrased question for time-sensitive decisions (max 2)"
  ],
  "predictiveNextSteps": {
    "immediateNext": "most likely next user action",
    "twoStepsAhead": "anticipated action after the immediate next",
    "contextualPreparation": "what to prepare for upcoming steps"
  },
  "richContext": {
    "recommendedActions": [
      {
        "title": "Specific actionable recommendation",
        "description": "Detailed rationale and benefits",
        "links": [{"title": "Specific resource name", "url": "authentic URL"}]
      }
    ],
    "researchResults": [
      {
        "title": "Specific research finding or option",
        "description": "Detailed information and analysis", 
        "rating": "quality/relevance rating out of 5 stars",
        "keyPoints": ["specific important details"],
        "contact": "relevant contact if applicable"
      }
    ],
    "quickInsights": ["specific actionable insights with concrete details"]
  },
  "nextSteps": ["immediate specific next actions"],
  "timeToComplete": "realistic time estimate",
  "successFactors": ["specific factors that ensure success"],
  "potentialObstacles": ["specific challenges to watch for"],
  "relatedTopics": ["connected subjects worth exploring"],
  "skillsRequired": ["specific abilities needed"],
  "resourcesNeeded": ["specific tools, people, or materials required"]
}

**MANDATORY REQUIREMENTS - NO EXCEPTIONS:**
- ALWAYS populate richContext with minimum 3 specific research findings
- For research queries: Generate detailed recommendedActions with authentic links
- For restaurants/travel: Include specific venues with ratings and contact info
- For certifications/courses: Include providers, costs, requirements, and exam details
- For products: Include specific models, prices, and purchasing information
- Never return empty or null richContext
- Generate authentic, specific content - no generic placeholders
- Include contact information and authentic URLs when available

**Analysis Rules:**
- Create concise 1-2 line titles that capture core essence for quick scanning
- Only provide descriptions/summaries if title lacks essential context or for complex projects
- Force categorization into existing collections (Personal, Home, Work) or 'Other' if unclear
- Extract specific trackable items with rich metadata
- Think two steps ahead: anticipate user's next action and the step after that
- Ask max 2 critical questions only for time-sensitive, high-impact decisions
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
  // Create a concise title from enhancedContent if no explicit title
  let title = output.title || output.enhancedContent || 'Untitled';
  
  // If title is too long, create a concise version (1-2 lines max)
  if (title.length > 80) {
    const sentences = title.split(/[.!?]+/);
    title = sentences[0].trim();
    if (title.length > 80) {
      title = title.slice(0, 77) + '...';
    }
  }

  return {
    type: ['reminder', 'todo', 'collection'].includes(output.type) ? output.type : 'collection',
    title: title,
    description: output.description || output.suggestion,
    enhancedContent: output.enhancedContent,
    suggestion: output.suggestion,
    context: output.context,
    complexityScore: output.complexityScore,
    intentType: output.intentType,
    urgencyLevel: output.urgencyLevel,
    todos: Array.isArray(output.todos) ? output.todos : [],
    extractedItems: Array.isArray(output.extractedItems) ? output.extractedItems : [],
    criticalQuestions: Array.isArray(output.criticalQuestions) ? output.criticalQuestions : [],
    predictiveNextSteps: output.predictiveNextSteps,
    priorityContext: output.priorityContext,
    richContext: output.richContext || output.priorityContext?.richContext,
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