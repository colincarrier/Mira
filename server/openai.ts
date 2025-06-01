import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
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
    const prompt = `You are an intelligent personal assistant analyzing user input. Your role is to interpret, organize, and provide rich contextual information like Google's AI-powered results.

CORE PHILOSOPHY: Everything saved here is intentional and meaningful. Provide actionable intelligence with rich context, real information, and organized insights.

Analyze this ${mode} input: "${content}"

RESPONSE STRUCTURE - Provide rich contextual information:
1. RICH CONTEXT: Create Google-style organized information including:
   - Quick AI summary of most pertinent information
   - Key insights and actionable information
   - Related topics for deeper exploration
   - Deep dive areas with structured sections
   - Relevant image concepts (for visual context)

2. ACTIONABLE TODOS: Extract specific, actionable items
3. SMART CATEGORIZATION: Suggest intelligent organization
4. CONTENT ENHANCEMENT: Create a SHORT, scannable title (2-4 words max) that captures the essence. Avoid fluff words like "Consider", "Implement", "Review". Use specific nouns and key concepts.
   Examples: "Crow Business Idea" not "Consider refining your business plan", "Marketing Strategy" not "Review marketing approach"

RICH CONTEXT REQUIREMENTS:
- Provide factual, useful information about the topic
- Organize information into clear sections for exploration
- Include practical insights and actionable information
- Suggest related areas worth investigating
- Be specific and avoid generic advice

Respond with JSON in this exact format:
{
  "enhancedContent": "SHORT scannable title (2-4 words, no fluff words)",
  "suggestion": "actionable next steps",
  "context": "brief contextual summary",
  "todos": ["specific actionable item 1", "specific actionable item 2"],
  "richContext": {
    "summary": "Quick AI summary of most pertinent information about this topic",
    "keyInsights": ["insight 1", "insight 2", "insight 3"],
    "relatedTopics": ["related topic 1", "related topic 2"],
    "actionableInfo": ["practical tip 1", "practical tip 2"],
    "imagePrompts": ["relevant image concept 1", "relevant image concept 2"],
    "deepDiveAreas": [
      {
        "title": "Area for deeper exploration",
        "description": "What this area covers",
        "keyPoints": ["point 1", "point 2", "point 3"]
      }
    ]
  },
  "collectionSuggestion": {
    "name": "collection name",
    "icon": "relevant icon",
    "color": "appropriate color"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an intelligent personal assistant that provides rich, contextual information like Google's AI-powered results. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      enhancedContent: analysis.enhancedContent || undefined,
      suggestion: analysis.suggestion || undefined,
      context: analysis.context || undefined,
      todos: analysis.todos || [],
      richContext: analysis.richContext || undefined,
      collectionSuggestion: analysis.collectionSuggestion || undefined,
      splitNotes: analysis.splitNotes || undefined,
    };
  } catch (error) {
    console.error("Error analyzing note:", error);
    return {
      todos: [],
      suggestion: "Unable to analyze note at this time. Please try again.",
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}