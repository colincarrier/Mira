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
    console.log("OpenAI analyzeNote called with content length:", content.length, "mode:", mode);
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

Respond with JSON in this exact format:
{
  "enhancedContent": "clean, well-formatted version",
  "suggestion": "actionable next steps",
  "context": "brief contextual summary",
  "todos": ["specific actionable item 1", "specific actionable item 2"],
  "richContext": {
    "recommendedActions": [{"title": "action name", "description": "what to do", "links": [{"title": "resource name", "url": "website"}]}],
    "researchResults": [{"title": "option name", "description": "details", "rating": "4.5/5", "keyPoints": ["benefit1", "benefit2"], "contact": "contact info"}],
    "quickInsights": ["brief actionable point 1", "brief actionable point 2"]
  },
  "collectionSuggestion": {
    "name": "collection name",
    "icon": "relevant icon",
    "color": "appropriate color"
  }
}`;

    console.log("Making OpenAI API call...");
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

    console.log("OpenAI API response received, parsing JSON...");
    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    console.log("AI analysis result:", JSON.stringify(analysis, null, 2));
    
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