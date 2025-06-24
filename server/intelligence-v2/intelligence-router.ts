import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';

export interface IntelligenceV2Input { 
  id?:string; 
  content:string; 
  mode:'text'|'voice'|'image'|'file'; 
  userProfile?:any; 
}

export interface IntelligenceV2Result {
  id: string;
  title: string;
  summary: string;
  richContext?: any;
  intent: string;
  urgency: 'low'|'medium'|'high';
  complexity: number;
  confidence: number;
  todos: any[];
  nextSteps: string[];
  entities: any[];
  suggestedLinks: any[];
  microQuestions: string[];
  fromTheWeb: any[];
  tags: string[];
  relatedTopics: string[];
  processingPath: 'commerce'|'memory';
  classificationScores: any;
  timeInstructions: any;
  timestamp: string;
}

class IntelligenceV2Router {
  private openai: OpenAI;
  private vector: VectorEngine;
  private reason: RecursiveReasoningEngine;

  constructor(openai: OpenAI) {
    this.openai = openai;
    this.vector = new VectorEngine(openai); 
    this.reason = new RecursiveReasoningEngine(openai, this.vector); 
  }

  async processNoteV2(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
    const userProfile = input.userProfile || { personalBio: "" };
    
    // Create simple working prompt
    const prompt = `Analyze this note and respond with valid JSON:

{
  "title": "Brief title (max 45 chars)",
  "aiBody": "Enhanced content or analysis", 
  "perspective": "Brief reasoning (max 80 chars)",
  "todos": [{"title": "Action item", "priority": "normal"}]
}

User context: ${userProfile.personalBio || "General user"}
Note: ${input.content}`;

    try {
      console.log("Processing with GPT-4o...");
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an AI assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      });

      const rawContent = response.choices[0].message?.content?.trim();
      if (!rawContent) {
        throw new Error("Empty response from OpenAI");
      }

      const parsed = JSON.parse(rawContent);
      console.log("JSON parsing successful");

      // Update vectors if valid ID
      if (input.id) { 
        this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(() => {});
      }

      return {
        id: input.id || 'temp',
        title: parsed.title || input.content.split(' ').slice(0, 5).join(' ') || 'Untitled',
        summary: parsed.perspective || '',
        richContext: parsed,
        intent: 'general',
        urgency: 'medium' as const,
        complexity: 5,
        confidence: 0.9,
        todos: parsed.todos || [],
        nextSteps: [],
        entities: [],
        suggestedLinks: [],
        microQuestions: [],
        fromTheWeb: [],
        tags: [],
        relatedTopics: [],
        processingPath: 'memory' as const,
        classificationScores: {},
        timeInstructions: { hasTimeReference: false, extractedTimes: [], scheduledItems: [] },
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error("Intelligence V2 processing failed:", error.message);
      
      // Return fallback result
      return {
        id: input.id || 'temp',
        title: makeTitle(input.content),
        summary: 'Processing failed',
        richContext: {},
        intent: 'general',
        urgency: 'medium' as const,
        complexity: 1,
        confidence: 0.1,
        todos: [],
        nextSteps: [],
        entities: [],
        suggestedLinks: [],
        microQuestions: [],
        fromTheWeb: [],
        tags: [],
        relatedTopics: [],
        processingPath: 'memory' as const,
        classificationScores: {},
        timeInstructions: { hasTimeReference: false, extractedTimes: [], scheduledItems: [] },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const singleton = new IntelligenceV2Router(openai);

export async function processWithIntelligenceV2(input: IntelligenceV2Input) { 
  return singleton.processNoteV2(input);
}

export default singleton;