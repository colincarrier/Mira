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

**Your comprehensive analysis must include:**

1. **CONTENT ENHANCEMENT**: Improve clarity, completeness, and usefulness of the original content
2. **CLASSIFICATION**: Determine if this is a reminder, todo, or collection item  
3. **COMPLEXITY ASSESSMENT**: Rate complexity (1-10) and classify intent type
4. **TASK EXTRACTION**: Identify actionable items and create structured task hierarchies
5. **INTELLIGENT CATEGORIZATION**: Suggest appropriate collections with icons and colors
6. **RICH CONTEXT GENERATION**: Provide research insights, recommendations, and quick insights
7. **PREDICTIVE INTELLIGENCE**: Next steps, time estimates, success factors, potential obstacles
8. **KNOWLEDGE CONNECTIONS**: Related topics, required skills, needed resources

**Classification Types:**
- **REMINDER**: Time-sensitive, meant to resurface at the right moment
- **TODO**: Requires action/follow-through, explicitly actionable
- **COLLECTION**: Long-term memory, ideas, research, references

**Required JSON Output Structure:**
{
  "enhancedContent": "Improved version of the original content with clarity and completeness",
  "suggestion": "Actionable recommendation or insight about this content",
  "context": "Contextual summary and relevance assessment",
  "complexityScore": 1-10,
  "intentType": "simple-task|complex-project|research-inquiry|personal-reflection|reference-material",
  "urgencyLevel": "low|medium|high|critical",
  "todos": ["array of specific actionable items if any"],
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
  "resourcesNeeded": ["tools, people, or materials required"]
}

**Analysis Rules:**
- Provide comprehensive analysis even for simple inputs
- Generate rich context and connections
- Be intelligent about task decomposition
- Suggest meaningful collections and categories
- Focus on adding genuine value and insight
- Include predictive intelligence about success and obstacles

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