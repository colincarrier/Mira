import Anthropic from '@anthropic-ai/sdk';
import { miraPromptTemplate } from './utils/miraAIProcessing';

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
    const prompt = miraPromptTemplate.replace('{user_input}', content);

    console.log("Claude analysis with Mira Brain prompt:", prompt.substring(0, 200));

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    console.log("Claude raw response:", response.text.substring(0, 300));
    const analysis = JSON.parse(response.text);
    console.log("Claude analysis result:", JSON.stringify(analysis, null, 2));

    // Convert Mira output format to legacy AIAnalysisResult format
    return {
      enhancedContent: analysis.description || analysis.enhancedContent || undefined,
      suggestion: analysis.title || analysis.suggestion || undefined,
      context: `Type: ${analysis.type}, Priority: ${analysis.priority || 'medium'}`,
      
      complexityScore: 5, // Default values for legacy compatibility
      intentType: 'personal-reflection',
      urgencyLevel: 'medium',
      
      todos: analysis.followUps || analysis.todos || [],
      
      collectionSuggestion: analysis.collectionSuggestion || undefined,
      
      richContext: undefined, // Simplified for Mira Brain
    };
  } catch (error) {
    console.error("Error analyzing note with Claude:", error);
    return {
      enhancedContent: undefined,
      suggestion: "Unable to analyze note at this time. Please try again.",
      context: undefined,
      complexityScore: 5,
      intentType: 'personal-reflection',
      urgencyLevel: 'medium',
      todos: [],
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Note: Anthropic doesn't have audio transcription, this would use OpenAI
    throw new Error("Audio transcription not supported by Anthropic");
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}