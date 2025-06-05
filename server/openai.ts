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
}

export async function analyzeWithOpenAI(content: string, mode: string): Promise<AIAnalysisResult> {
  try {

    const isImageContent = content.startsWith('data:image/') && content.includes('base64,');
    
    let messages: any[];
    
    if (isImageContent && mode === 'image') {
      // Handle image analysis with Mira Brain approach
      const imagePrompt = `You are Mira, an intelligent visual assistant. Analyze this image and provide actionable insights using the same format as the text analysis.

Please respond with a JSON object containing all the standard Mira Brain fields:
- enhancedContent: Detailed description with actionable context
- suggestion: Actionable next steps based on image
- context: Brief contextual summary
- todos: Specific actionable items
- complexityScore: 1-10 scale
- intentType: classification of the image content
- urgencyLevel: assessment of priority
- collectionSuggestion: {name, icon, color}
- richContext: {recommendedActions, researchResults, quickInsights}

Use the same collection categories and format as text analysis.`;

      messages = [
        {
          role: "system",
          content: "You are Mira, an intelligent visual assistant. Always respond with valid JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: imagePrompt
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
      
      messages = [
        {
          role: "system",
          content: "You are Mira, an intelligent research assistant. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure all required fields are present
    return {
      enhancedContent: result.enhancedContent || content,
      suggestion: result.suggestion || "No specific suggestions available.",
      context: result.context || "General content analysis.",
      complexityScore: result.complexityScore || 3,
      intentType: result.intentType || 'simple-task',
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
    console.error("OpenAI analysis error:", error);
    throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file for the audio
    const fs = await import('fs');
    const path = await import('path');
    const tempPath = path.join('/tmp', `audio_${Date.now()}.webm`);
    
    fs.writeFileSync(tempPath, audioBuffer);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "en"
    });
    
    // Clean up temp file
    fs.unlinkSync(tempPath);
    
    return transcription.text;
  } catch (error) {
    console.error("OpenAI transcription error:", error);
    throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}