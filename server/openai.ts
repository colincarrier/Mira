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
    const prompt = `You are an intelligent personal assistant analyzing user input. Your role is to interpret, organize, and provide value-added insights.

CORE PHILOSOPHY: Everything saved here is intentional and meaningful. Provide actionable intelligence, not generic questions.

Analyze this ${mode} input: "${content}"

DECISION FRAMEWORK:
- If input has clear context/intent → Provide value-added information, insights, or fetched knowledge
- If input lacks context → Ask focused clarifying questions
- Always extract actionable todos
- Always suggest intelligent organization
- Be EXTREMELY concise - no superfluous language

RESPONSE PRIORITIES:
1. Extract all actionable items as todos
2. Enhance content only if it adds genuine clarity
3. Provide valuable context/insights that act like a knowledgeable assistant
4. Suggest smart categorization
5. Split unrelated topics into separate notes

Respond with JSON in this exact format:
{
  "enhancedContent": "improved version or null",
  "suggestion": "intelligent insight, valuable information, or focused question if context unclear",
  "context": "valuable knowledge/background that acts like an assistant who knows you well",
  "todos": ["specific actionable items"],
  "collectionSuggestion": {
    "name": "smart category name",
    "icon": "icon name (coffee, lightbulb, book, heart, star, briefcase, home, car, plane, checklist, calendar, location, shopping)",
    "color": "color name (orange, purple, green, blue, red, yellow, pink, indigo, teal, gray, cyan)"
  },
  "splitNotes": null or [{"content": "separate topic", "todos": [], "collectionSuggestion": {...}}]
}

EXAMPLES OF VALUE-ADDED RESPONSES:
- Restaurant mention → Cuisine type, price range, neighborhood context
- Product mention → Key specs, alternatives, typical price range
- Person mention → Relationship context, relevant details
- Task mention → Deadline implications, related dependencies
- Event mention → Timing context, preparation checklist

Only use splitNotes if there are truly unrelated topics that would be better as separate notes.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Mira, an intelligent personal assistant. You know the user deeply and provide value-added insights, not generic responses. Be extremely concise and actionable."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      enhancedContent: result.enhancedContent === "null" ? undefined : result.enhancedContent,
      suggestion: result.suggestion,
      context: result.context,
      todos: result.todos || [],
      collectionSuggestion: result.collectionSuggestion,
      splitNotes: result.splitNotes || []
    };
  } catch (error) {
    console.error("OpenAI analysis failed:", error);
    return {
      suggestion: "Note captured successfully",
      todos: [],
    };
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file-like object for OpenAI
    const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Audio transcription failed:", error);
    throw new Error("Failed to transcribe audio");
  }
}
