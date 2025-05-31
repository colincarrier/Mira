import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface AIAnalysisResult {
  enhancedContent?: string;
  suggestion?: string;
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
    const prompt = `Analyze the following ${mode} note and provide:
1. Enhanced/formatted version of the content (optional - only if it improves clarity)
2. A helpful AI suggestion or follow-up action
3. Extract any actionable to-dos
4. Suggest a collection category if this note would fit into a themed group
5. IMPORTANT: If the note contains multiple unrelated tasks/topics, split them into separate notes

Note content: "${content}"

Respond with JSON in this exact format:
{
  "enhancedContent": "improved version or null",
  "suggestion": "helpful AI suggestion",
  "todos": ["todo 1", "todo 2"],
  "collectionSuggestion": {
    "name": "collection name",
    "icon": "icon name (coffee, lightbulb, book, etc)",
    "color": "orange, purple, green, blue"
  },
  "splitNotes": [
    {
      "content": "separate note content",
      "todos": ["separate todo"],
      "collectionSuggestion": {"name": "collection", "icon": "icon", "color": "color"}
    }
  ]
}

Only use splitNotes if there are truly unrelated topics that would be better as separate notes.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Mira, an intelligent memory assistant. Analyze notes and provide helpful enhancements, suggestions, and organization."
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
