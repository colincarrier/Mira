import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysisResult {
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  
  // Complexity Analysis
  complexityScore: number; // 1-10 scale
  intentType: 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Enhanced Task Structure
  todos: string[];
  taskHierarchy?: {
    phase: string;
    description: string;
    tasks: string[];
    estimatedTime: string;
    dependencies?: string[];
  }[];
  
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  
  // Intelligence Context
  richContext?: {
    recommendedActions: {
      title: string;
      description: string;
      links?: { title: string; url: string }[];
    }[];
    researchResults: {
      title: string;
      description: string;
      rating?: string;
      keyPoints: string[];
      contact?: string;
    }[];
    quickInsights: string[];
  };
  
  // Predictive Intelligence
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  
  // Knowledge Connections
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
  
  splitNotes?: {
    content: string;
    todos: string[];
    collectionSuggestion?: {
      name: string;
      icon: string;
      color: string;
    };
  }[];
}

export async function analyzeNote(content: string, mode: string): Promise<AIAnalysisResult> {
  try {
    const prompt = `You are Mira, an advanced AI assistant with superhuman intelligence for analyzing context, complexity, and user intent. Your core competency is distinguishing between simple tasks and complex projects, then providing appropriately scaled responses.

User's note: "${content}"
Mode: ${mode}

INTELLIGENCE ANALYSIS FRAMEWORK:

1. COMPLEXITY CLASSIFICATION (Score 1-10):
   - 1-3: Simple tasks (buy milk, call dentist, pay bill) → Clean logging, single reminder
   - 4-6: Medium projects (plan vacation, learn skill) → Multi-step breakdown with phases
   - 7-10: Complex endeavors (start business, major research) → Comprehensive project framework

2. INTENT RECOGNITION:
   - simple-task: Single action, clear outcome
   - complex-project: Multi-phase, evolving requirements, requires planning
   - research-inquiry: Information gathering, decision support needed
   - personal-reflection: Thoughts, experiences, knowledge capture
   - reference-material: Information to store and categorize

3. URGENCY ASSESSMENT:
   - critical: Immediate action required (deadlines today)
   - high: Action needed this week
   - medium: Action needed this month
   - low: No specific timeline

RESPONSE REQUIREMENTS:

For SIMPLE TASKS (1-3 complexity):
- Clean, direct todo items
- No unnecessary complexity
- Focus on efficient completion

For COMPLEX PROJECTS (4-10 complexity):
- Break into logical phases with dependencies
- Provide hierarchical task structure
- Include time estimates and success factors
- Identify potential obstacles early
- Suggest related skills/resources needed

For ALL INPUTS:
- Predict logical next steps
- Connect to related knowledge domains
- Provide authentic research (real websites, services, contacts)
- Think 2-3 steps ahead of the user

JSON Response Structure:
{
  "enhancedContent": "Clean, structured version",
  "complexityScore": 1-10,
  "intentType": "simple-task|complex-project|research-inquiry|personal-reflection|reference-material",
  "urgencyLevel": "low|medium|high|critical",
  "todos": ["specific actionable tasks"],
  "taskHierarchy": [{"phase": "Phase name", "description": "What this phase accomplishes", "tasks": ["task1", "task2"], "estimatedTime": "1-2 weeks", "dependencies": ["previous phase"]}],
  "collectionSuggestion": {"name": "category", "icon": "icon", "color": "color"},
  "richContext": {
    "recommendedActions": [{"title": "Action", "description": "Why/how", "links": [{"title": "Resource", "url": "real-url"}]}],
    "researchResults": [{"title": "Option", "description": "Details", "rating": "4.5/5", "keyPoints": ["point1"], "contact": "info"}],
    "quickInsights": ["actionable insight"]
  },
  "nextSteps": ["predicted next actions"],
  "timeToComplete": "realistic estimate",
  "successFactors": ["what makes this succeed"],
  "potentialObstacles": ["what could go wrong"],
  "relatedTopics": ["connected knowledge areas"],
  "skillsRequired": ["needed capabilities"],
  "resourcesNeeded": ["tools, services, information"]
}

Collections (use appropriate category):
1. "To-dos" (icon: "checklist", color: "blue")
2. "Personal" (icon: "heart", color: "pink") 
3. "Home" (icon: "home", color: "green")
4. "Work" (icon: "briefcase", color: "purple")
5. "Family" (icon: "star", color: "yellow")
6. "Books" (icon: "book", color: "orange")
7. "Movies & TV" (icon: "play", color: "red")
8. "Restaurants" (icon: "utensils", color: "teal")
9. "Travel" (icon: "plane", color: "blue")
10. "Undefined" (icon: "help-circle", color: "gray")

CRITICAL: Provide real intelligence, not just reformatted input. Research authentic resources and think like a strategic consultant.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'You are Mira, an intelligent personal assistant. Always respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
    
    try {
      return JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      // Fallback response
      return {
        enhancedContent: content,
        todos: [],
        collectionSuggestion: {
          name: "Dev Tests",
          icon: "code",
          color: "gray"
        },
        richContext: {
          recommendedActions: [],
          researchResults: [],
          quickInsights: []
        }
      };
    }

  } catch (error) {
    console.error('Error analyzing note with Claude:', error);
    
    // Fallback response
    return {
      enhancedContent: content,
      todos: [],
      collectionSuggestion: {
        name: "General Notes",
        icon: "lightbulb", 
        color: "blue"
      },
      richContext: {
        recommendedActions: [],
        researchResults: [],
        quickInsights: []
      }
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Claude doesn't have direct audio transcription, so we'll use a placeholder
    // In a real implementation, you might use another service or convert to text first
    console.log('Audio transcription requested for Claude - not yet implemented');
    return "Audio transcription not available with Claude";
  } catch (error) {
    console.error('Error transcribing audio with Claude:', error);
    throw error;
  }
}