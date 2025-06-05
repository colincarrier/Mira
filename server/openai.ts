import OpenAI from "openai";
import { miraPromptTemplate } from './utils/miraAIProcessing';

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
    
    // Check if content is a base64 image
    const isImageContent = content.startsWith('data:image/') && content.includes('base64,');
    
    let messages: any[];
    
    if (isImageContent && mode === 'image') {
      // Handle image analysis
      const prompt = `You are Mira, an intelligent visual assistant that analyzes images and provides actionable insights. Examine this image carefully and provide practical, actionable intelligence.

Mode: ${mode}

Your job is to extract meaningful information from the image and provide actionable next steps.

Please respond with a JSON object containing:
1. enhancedContent: A detailed description of what you see in the image with actionable context
2. todos: Specific actionable tasks based on the image content
3. collectionSuggestion: {name, icon, color} - suggest appropriate collection based on image content
4. richContext: {
   recommendedActions: [{title, description, links}] - Specific next steps with real resources/websites
   researchResults: [{title, description, rating, keyPoints, contact}] - Relevant options, services, tools
   quickInsights: [string] - Brief, actionable bullets about the image
}

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

Respond with JSON in this exact format:
{
  "enhancedContent": "detailed description with actionable context",
  "suggestion": "actionable next steps based on image",
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

      messages = [
        {
          role: "system",
          content: "You are an intelligent visual assistant that analyzes images and provides actionable insights. Always respond with valid JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: content
              }
            }
          ]
        }
      ];
    } else {
      // Handle text analysis using Mira Brain prompt
      const prompt = miraPromptTemplate.replace('{user_input}', content);

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

      messages = [
        {
          role: "system",
          content: "You are an intelligent personal assistant that provides rich, contextual information like Google's AI-powered results. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    }

    console.log("Making OpenAI API call...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
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