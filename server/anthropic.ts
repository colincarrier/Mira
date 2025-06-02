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
    const prompt = `You are Mira, an intelligent research assistant that provides actionable solutions and real research insights. Act like Google search results - provide practical, actionable intelligence rather than just summarizing what the user already told you.

User's note: "${content}"
Mode: ${mode}

Your job is to research and provide solutions, not just digest the input. Think 2 steps ahead and provide real value.

Please respond with a JSON object containing:
1. enhancedContent: A clean, well-formatted version with better structure
2. todos: Specific actionable tasks extracted from the content
3. collectionSuggestion: {name, icon, color} - suggest appropriate collection
4. richContext: {
   recommendedActions: [{title, description, links}] - Specific next steps with real resources/websites
   researchResults: [{title, description, rating, keyPoints, contact}] - Actual options, programs, services with details
   quickInsights: [string] - Brief, actionable bullets (not lengthy prose)
}

Focus on providing:
- Specific websites, services, and resources
- Contact information when relevant
- Real program names and options
- Actionable next steps with links
- Research-backed recommendations

Do NOT just restate what the user said. Provide new intelligence and research.

For collectionSuggestion, use one of these 10 standard categories:
1. "To-dos" (icon: "checklist", color: "blue")
2. "Personal" (icon: "heart", color: "pink") 
3. "Home" (icon: "home", color: "green")
4. "Work" (icon: "briefcase", color: "purple")
5. "Family" (icon: "star", color: "yellow")
6. "Books" (icon: "book", color: "orange")
7. "Movies & TV" (icon: "play", color: "red")
8. "Restaurants" (icon: "utensils", color: "teal")
9. "Travel" (icon: "plane", color: "blue")
10. "Undefined" (icon: "help-circle", color: "gray") - for anything that doesn't clearly fit the other 9

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