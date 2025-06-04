import OpenAI from "openai";
import type { AIAnalysisResult } from "@/shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. Use this by default unless user has already selected another model
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeNote(content: string, mode: string): Promise<AIAnalysisResult> {
  const prompt = `You are Mira's primary intelligence engine. Analyze the provided content and return a JSON response with this exact structure:

{
  "complexityScore": number (1-10),
  "intentType": "simple-task" | "complex-project" | "research-inquiry" | "personal-reflection" | "reference-material",
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "todos": string[],
  "taskHierarchy": [{
    "phase": string,
    "description": string,
    "tasks": string[],
    "estimatedTime": string,
    "dependencies": string[]
  }],
  "collectionSuggestion": {
    "name": string,
    "icon": string,
    "color": string,
    "reasoning": string,
    "confidence": number
  },
  "nextSteps": string[],
  "timeToComplete": string,
  "successFactors": string[],
  "potentialObstacles": string[]
}

ANALYSIS GUIDELINES:
- Be specific and actionable in todo extraction
- Consider realistic time estimates
- Provide clear reasoning for classifications
- Include confidence scores for suggestions
- Focus on practical next steps

Content to analyze: "${content}"
Mode: ${mode}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Mira, an intelligent memory assistant. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      complexityScore: result.complexityScore || 1,
      intentType: result.intentType || 'simple-task',
      urgencyLevel: result.urgencyLevel || 'medium',
      todos: result.todos || [],
      taskHierarchy: result.taskHierarchy || [],
      collectionSuggestion: result.collectionSuggestion,
      nextSteps: result.nextSteps || [],
      timeToComplete: result.timeToComplete || "Unknown",
      successFactors: result.successFactors || [],
      potentialObstacles: result.potentialObstacles || [],
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze content with OpenAI");
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
      prompt: "This is a note capture for Mira, an AI memory assistant. The user may be capturing ideas, tasks, or information."
    });

    return transcription.text;
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image in detail and describe its key elements, context, and any notable aspects."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ],
      }],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Image analysis error:", error);
    throw new Error("Failed to analyze image");
  }
}