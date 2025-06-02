import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysisResult {
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  todos: string[];
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  richContext?: {
    summary: string;
    keyInsights: string[];
    relatedTopics: string[];
    actionableInfo: string[];
    imagePrompts?: string[];
    deepDiveAreas: {
      title: string;
      description: string;
      keyPoints: string[];
    }[];
  };
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
    const prompt = `You are Mira, an intelligent personal assistant that helps users capture, organize, and enhance their thoughts and tasks.

Analyze this note content and provide structured insights:

Content: "${content}"
Mode: ${mode}

Please respond with a JSON object containing:
1. enhancedContent: A polished, well-formatted version of the content with proper structure and clarity
2. todos: Array of actionable tasks extracted from the content
3. collectionSuggestion: {name, icon, color} - suggest an appropriate collection for organizing this note
4. richContext: {
   summary: Brief overview of the content
   keyInsights: Important points or insights
   relatedTopics: Related subjects the user might be interested in
   actionableInfo: Specific actions or next steps
   deepDiveAreas: [{title, description, keyPoints}] - areas for further exploration
}

Available icons: coffee, lightbulb, book, heart, star, briefcase, home, car, plane, checklist, calendar, location, shopping
Available colors: blue, green, purple, orange, red, pink, yellow, teal

Focus on being helpful, insightful, and actionable while maintaining the user's original intent.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
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
          name: "General Notes",
          icon: "lightbulb",
          color: "blue"
        },
        richContext: {
          summary: "Content processed by Claude",
          keyInsights: [],
          relatedTopics: [],
          actionableInfo: [],
          deepDiveAreas: []
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
        summary: "Basic note content",
        keyInsights: [],
        relatedTopics: [],
        actionableInfo: [],
        deepDiveAreas: []
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