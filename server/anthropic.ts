// ⚠️  CRITICAL: AI PROMPT PROTECTION - DO NOT MODIFY WITHOUT APPROVAL ⚠️
// This file contains Claude AI integration and core prompts.
// See AI_MODIFICATION_RULES.md for modification protocol.

import Anthropic from "@anthropic-ai/sdk";

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

  // Individual Item Extraction
  extractedItems?: {
    title: string;
    description?: string;
    category: string;
    metadata?: Record<string, any>;
  }[];

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

    console.log("Claude analysis with enhanced Mira Brain prompt");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      system: "You are Mira, an intelligent analysis system. Always respond with valid JSON following the exact structure provided in the prompt.",
      max_tokens: 4000,
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

    console.log("Claude raw response:", response.text.substring(0, 200) + "...");

    let result;
    try {
      // Clean response if it has markdown formatting
      let cleanResponse = response.text.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.log("Raw Claude response that failed to parse:", response.text);

      // Return fallback analysis with proper structure
      return {
        enhancedContent: content,
        suggestion: "Unable to analyze note at this time. Please try again.",
        context: "Analysis failed - fallback response",
        complexityScore: 5,
        intentType: 'personal-reflection',
        urgencyLevel: 'medium',
        todos: [],
        taskHierarchy: undefined,
        collectionSuggestion: undefined,
        richContext: undefined,
        nextSteps: undefined,
        timeToComplete: undefined,
        successFactors: undefined,
        potentialObstacles: undefined,
        relatedTopics: undefined,
        skillsRequired: undefined,
        resourcesNeeded: undefined
      };
    }

    console.log("Claude analysis completed successfully");

    // Clean up suggestion to avoid returning prompt text
    let cleanSuggestion = result.suggestion || "";
    if (cleanSuggestion.includes("You are Mira") || cleanSuggestion.length > 200) {
      cleanSuggestion = "";
    }

    // Return the complete AIAnalysisResult structure
    // NEVER return AI prompt as enhancedContent - preserve original user content
    let cleanEnhancedContent = result.enhancedContent;
    if (cleanEnhancedContent && cleanEnhancedContent.includes("You are Mira")) {
      cleanEnhancedContent = content; // Fallback to original content
    }
    
    return {
      enhancedContent: cleanEnhancedContent || content,
      suggestion: cleanSuggestion,
      context: result.context || "General content analysis.",
      complexityScore: result.complexityScore || 5,
      intentType: result.intentType || 'personal-reflection',
      urgencyLevel: result.urgencyLevel || 'medium',
      todos: Array.isArray(result.todos) ? result.todos : [],
      taskHierarchy: result.taskHierarchy,
      collectionSuggestion: result.collectionSuggestion,
      richContext: result.richContext,
      nextSteps: result.nextSteps,
      timeToComplete: result.timeToComplete,
      successFactors: result.successFactors,
      potentialObstacles: result.potentialObstacles,
      relatedTopics: result.relatedTopics,
      skillsRequired: result.skillsRequired,
      resourcesNeeded: result.resourcesNeeded
    };
  } catch (error) {
    console.error("Claude analysis failed:", error);
    throw new Error(`Claude analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeImageContent(imageBase64: string, content: string): Promise<AIAnalysisResult> {
  try {
    const imageAnalysisPrompt = `You've received an image from the user. Your job is to fully decode and surface valuable insight from it, as if you're a visual detective and shopping concierge combined.

1. Identify any objects, logos, text, products, or landmarks in the image.
2. Use OCR to extract any readable text or symbols.
3. Interpret what the item is — include category, potential use, or style cues.
4. Run a web search to locate:
    - Brand or manufacturer
    - Product name or collection
    - Purchase links (Google, Amazon, Grailed, brand sites, etc.)
    - Price or resale value
    - Comparable alternatives
5. If it's a location, return links to Google Maps, Yelp, or the official site.
6. Format your response as a concise but rich recommendation card with embedded links.

NEVER reply with "I can't tell." Always extract partial clues and make a best effort guess, followed by web-based confirmation.

Generate a meaningful, specific title (3-5 words max) about what you actually see in the image. Examples:
- "Nike Air Force 1s"
- "Starbucks Menu Board"
- "iPhone 15 Pro Max"
- "Toyota Camry 2024"

Return JSON with this exact structure:
{
  "enhancedContent": "Brief specific title of what's in the image",
  "suggestion": "Detailed analysis and recommendations",
  "context": "Category and usage context",
  "complexityScore": 5,
  "intentType": "reference-material",
  "urgencyLevel": "low",
  "todos": [],
  "richContext": {
    "recommendedActions": [
      {
        "title": "Shop Similar Items",
        "description": "Find where to buy this product",
        "links": [{"title": "Brand Website", "url": "https://example.com"}]
      }
    ],
    "researchResults": [
      {
        "title": "Product Details",
        "description": "Specifications and pricing",
        "keyPoints": ["Price range", "Availability", "Reviews"]
      }
    ],
    "quickInsights": ["Key facts about the item"]
  }
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      system: "You are Mira's visual analysis system. Identify objects, brands, and products in images, then provide shopping links and detailed information. Always return valid JSON.",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: imageAnalysisPrompt
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ]
    });

    const response = message.content[0];
    if (response.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let result;
    try {
      let cleanResponse = response.text.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Error parsing Claude image response:", parseError);
      
      return {
        enhancedContent: "Visual Analysis Complete",
        suggestion: "Image processed but detailed analysis unavailable",
        context: "Image content review",
        complexityScore: 5,
        intentType: 'reference-material',
        urgencyLevel: 'low',
        todos: [],
        richContext: {
          recommendedActions: [],
          researchResults: [],
          quickInsights: ["Image analysis in progress"]
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    
    return {
      enhancedContent: "Image Review",
      suggestion: "Visual analysis temporarily unavailable",
      context: "Image processing",
      complexityScore: 5,
      intentType: 'reference-material',
      urgencyLevel: 'low',
      todos: [],
      richContext: {
        recommendedActions: [],
        researchResults: [],
        quickInsights: ["Analysis pending"]
      }
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