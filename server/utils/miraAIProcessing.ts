/**
 * MIRA AI BRAIN - Processing Engine for Intelligent Note Handling
 * 
 * This is the central intelligence layer that ensures uniform AI processing
 * across all note types and input methods. All AI analysis must go through
 * this layer to maintain consistency.
 */

import { analyzeNote as analyzeWithClaude } from "../anthropic";
import { analyzeWithOpenAI, analyzeImageContent as analyzeImageWithOpenAI } from "../openai";

// UNIVERSAL NOTE STRUCTURE - ALL AI RESPONSES MUST FOLLOW THIS FORMAT
export interface MiraAIInput {
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  imageData?: string; // base64 for image analysis
  context?: string; // additional context like voice transcription
}

export interface MiraAIOutput {
  // CORE FIELDS - ALWAYS RETURNED
  title: string; // CRITICAL: 3-5 words max, newspaper headline style
  context: string; // Brief contextual summary (1-2 sentences)
  
  // TASK STRUCTURE
  todos: Array<{
    title: string;
    itemType?: 'task' | 'reminder';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    timeDue?: string; // ISO date string
    timeDependency?: 'none' | 'sequential' | 'parallel';
    plannedNotificationStructure?: {
      enabled: boolean;
      reminderCategory: 'today' | 'tomorrow' | 'this-week' | 'later';
      repeatPattern: 'none' | 'daily' | 'weekly' | 'monthly';
      leadTimeNotifications: string[];
    };
    isActiveReminder?: boolean;
  }>;
  
  // INTELLIGENCE INSIGHTS
  intentType: 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  complexityScore: number; // 1-10 scale
  
  // ENHANCED CONTEXT (conditional)
  suggestion?: string; // AI-generated follow-up suggestion
  richContext?: {
    recommendedActions: Array<{
      title: string;
      description: string;
      links?: Array<{ title: string; url: string }>;
    }>;
    researchResults?: Array<{
      title: string;
      description: string;
      rating?: string;
      keyPoints: string[];
      contact?: string;
    }>;
    quickInsights: string[];
    fromTheWeb?: Array<{
      title: string;
      url: string;
      summary: string;
    }>;
  };
  
  // INDIVIDUAL ITEM EXTRACTION
  extractedItems?: Array<{
    title: string;
    description?: string;
    category: string;
    metadata?: Record<string, any>;
  }>;
  
  // PREDICTIVE INTELLIGENCE
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  
  // KNOWLEDGE CONNECTIONS
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
  
  // COLLECTION ORGANIZATION
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
}

// UNIVERSAL AI PROCESSING INSTRUCTIONS
const CORE_INSTRUCTIONS = `
You are Mira's AI brain. Process this content and return a structured response.

CRITICAL TITLE RULES:
- Title MUST be 3-5 words maximum
- Use newspaper headline style (active, concise, engaging)
- Examples: "Buy Groceries Tomorrow", "Team Meeting Notes", "Restaurant Research"
- NEVER use long descriptive titles or full sentences

FIELD REQUIREMENTS:
- title: 3-5 words max, newspaper style
- context: 1-2 sentence summary
- todos: Extract clear actionable items
- intentType: Classify the content type
- urgencyLevel: Assess time sensitivity
- complexityScore: Rate 1-10 complexity
- suggestion: Optional helpful follow-up
- collectionSuggestion: Suggest appropriate collection if relevant

RESPONSE FORMAT: Return valid JSON only, no markdown or explanations.
`;

const SIMPLE_TASK_TEMPLATE = `
${CORE_INSTRUCTIONS}

For simple tasks/reminders:
- Keep title ultra-short (3-4 words)
- Focus on the action: "Call Mom", "Buy Milk", "Submit Report"
- Set urgency based on time sensitivity
- Minimal complexity (1-3)
- Brief, helpful suggestions only
`;

const COMPLEX_PROJECT_TEMPLATE = `
${CORE_INSTRUCTIONS}

For complex projects:
- Title captures main theme (4-5 words max)
- Break down into clear action items
- Higher complexity score (6-10)
- Provide strategic suggestions
- Include research recommendations if needed
`;

const RESEARCH_TEMPLATE = `
${CORE_INSTRUCTIONS}

For research/information gathering:
- Title reflects research topic (4-5 words)
- Extract research questions as todos
- Moderate to high complexity (5-8)
- Suggest research strategies
- Include relevant resource recommendations
`;

const IMAGE_ANALYSIS_TEMPLATE = `
${CORE_INSTRUCTIONS}

For image analysis:
- Title describes what's shown (3-5 words)
- Extract any text/data as todos if actionable
- Context explains visual content
- Suggest relevant follow-up actions
- Consider design/visual insights
`;

/**
 * Universal AI Processing Function
 * This is the ONLY function that should be called for AI analysis
 */
export async function processMiraInput(input: MiraAIInput): Promise<MiraAIOutput> {
  try {
    // Create structured prompt with universal template
    const structuredPrompt = createStructuredPrompt(input);
    
    // Route everything to OpenAI for consistency
    let result;
    const openaiModule = await import("../openai");
    
    if (input.mode === 'image' && input.imageData) {
      // Use OpenAI GPT-4o for image analysis
      result = await openaiModule.analyzeImageContent(input.imageData, structuredPrompt);
    } else {
      // Use OpenAI for all text analysis (simple and complex)
      result = await openaiModule.analyzeWithOpenAI(input.content, 'enhanced');
    }
    
    // Enforce universal structure constraints
    const processedResult = enforceStructure(result);
    
    return processedResult;
    
  } catch (error) {
    console.error('Mira AI processing error:', error);
    
    // Fallback response maintaining structure
    return {
      title: extractFallbackTitle(input.content),
      context: "Content processed successfully",
      todos: [],
      intentType: 'personal-reflection',
      urgencyLevel: 'low',
      complexityScore: 1,
    };
  }
}

/**
 * Create Structured Prompt with Universal Template
 */
function createStructuredPrompt(input: MiraAIInput): string {
  const template = selectTemplate(input);
  return `${template}

Content to analyze: "${input.content}"`;
}

/**
 * Template Selection Logic
 */
function selectTemplate(input: MiraAIInput): string {
  const content = input.content.toLowerCase();
  
  // Simple task patterns
  const simplePatterns = [
    /^(call|text|email|buy|pick up|remind|schedule)/,
    /^.{1,50}$/,  // Very short content
    /(tomorrow|today|tonight|this week)/,
  ];
  
  if (simplePatterns.some(pattern => pattern.test(content))) {
    return SIMPLE_TASK_TEMPLATE;
  }
  
  // Research patterns
  const researchPatterns = [
    /(research|find|look up|investigate|study|learn about)/,
    /(how to|what is|why does|when should)/,
    /(compare|analyze|evaluate)/,
  ];
  
  if (researchPatterns.some(pattern => pattern.test(content))) {
    return RESEARCH_TEMPLATE;
  }
  
  // Image analysis
  if (input.mode === 'image') {
    return IMAGE_ANALYSIS_TEMPLATE;
  }
  
  // Default to complex project for longer content
  if (content.length > 200) {
    return COMPLEX_PROJECT_TEMPLATE;
  }
  
  return SIMPLE_TASK_TEMPLATE;
}

/**
 * Enforce Structure Constraints
 */
function enforceStructure(result: any): MiraAIOutput {
  // Get title from AI response
  let title = result.title || result.enhancedContent || "New Note";
  
  // Remove AI partner indicators
  title = title.replace(/^\[claude\]\s*/i, '').replace(/^\[openai\]\s*/i, '');
  
  // CRITICAL: Enforce newspaper headline style (3-5 words MAX)
  title = createNewspaperTitle(title);
  
  return {
    title,
    context: result.context || result.aiContext || "Note processed",
    todos: Array.isArray(result.todos) ? result.todos.map((todo: any) => {
      if (typeof todo === 'string') {
        return { title: todo };
      }
      return {
        title: todo.title || todo,
        itemType: todo.itemType,
        priority: todo.priority,
        timeDue: todo.timeDue,
        timeDependency: todo.timeDependency,
        plannedNotificationStructure: todo.plannedNotificationStructure,
        isActiveReminder: todo.isActiveReminder
      };
    }) : [],
    intentType: result.intentType || 'personal-reflection',
    urgencyLevel: result.urgencyLevel || 'low',
    complexityScore: result.complexityScore || 1,
    suggestion: result.suggestion || result.aiSuggestion,
    richContext: result.richContext ? {
      recommendedActions: result.richContext.recommendedActions || [],
      researchResults: result.richContext.researchResults,
      quickInsights: result.richContext.quickInsights || [],
      fromTheWeb: result.richContext.fromTheWeb
    } : undefined,
    extractedItems: result.extractedItems,
    nextSteps: result.nextSteps,
    timeToComplete: result.timeToComplete,
    successFactors: result.successFactors,
    potentialObstacles: result.potentialObstacles,
    relatedTopics: result.relatedTopics,
    skillsRequired: result.skillsRequired,
    resourcesNeeded: result.resourcesNeeded,
    collectionSuggestion: result.collectionSuggestion
  };
}

/**
 * Create Newspaper Headline Style Title (3-5 words MAX)
 */
function createNewspaperTitle(input: string): string {
  // Clean input
  const cleanInput = input.trim().replace(/['"]/g, '');
  
  // Split into words and filter out articles, prepositions
  const words = cleanInput.split(/\s+/).filter(word => 
    word.length > 0 && 
    !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word.toLowerCase())
  );
  
  // Take first 3-4 most important words
  const titleWords = words.slice(0, 3);
  
  // Create proper case title
  const title = titleWords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return title || 'New Note';
}

/**
 * Fallback Title Extraction
 */
function extractFallbackTitle(content: string): string {
  const words = content.trim().split(/\s+/).slice(0, 4);
  return words.join(' ') || "New Note";
}

// TEST CASES FOR VALIDATION
export const TEST_CASES = {
  simpleReminder: {
    input: {
      content: "Call mom tomorrow at 2pm about dinner plans",
      mode: 'text' as const,
    },
    expectedOutput: {
      title: "Call Mom Tomorrow", // 3 words
      intentType: 'simple-task',
      urgencyLevel: 'medium',
      complexityScore: 2,
    }
  },
  
  menuUpload: {
    input: {
      content: "Here's the menu from the new Italian restaurant downtown",
      mode: 'image' as const,
      imageData: "base64_image_data",
    },
    expectedOutput: {
      title: "Italian Restaurant Menu", // 3 words
      intentType: 'reference-material',
      urgencyLevel: 'low',
      complexityScore: 4,
    }
  },
  
  businessResearch: {
    input: {
      content: "Research starting a mobile app development consultancy focusing on healthcare apps. Need to understand market size, competition, required certifications, and potential revenue models.",
      mode: 'text' as const,
    },
    expectedOutput: {
      title: "Healthcare App Consultancy", // 3 words
      intentType: 'research-inquiry',
      urgencyLevel: 'medium',
      complexityScore: 8,
    }
  }
};