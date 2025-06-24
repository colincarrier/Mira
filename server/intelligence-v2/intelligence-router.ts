import { buildPrompt } from "../ai/prompt-specs";
import { composeFromAnalysis } from "../ai/compose-v2";
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
  summary?: string;
  richContext?: any;
  intent?: string;
  urgency?: string;
  complexity?: number;
  confidence?: number;
  todos?: any[];
  nextSteps?: any[];
  entities?: any[];
  suggestedLinks?: any[];
  microQuestions?: any[];
  fromTheWeb?: any[];
  tags?: any[];
  relatedTopics?: any[];
  processingPath?: string;
  classificationScores?: any;
  timeInstructions?: any;
  timestamp: string;
}

export class IntelligenceV2Router {
  private openai: OpenAI;
  private vector: VectorEngine;
  private reason: RecursiveReasoningEngine;

  constructor(openai: OpenAI) {
    this.openai = openai;
    this.vector = new VectorEngine();
    this.reason = new RecursiveReasoningEngine();
  }

  async processNoteV2(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
    const userProfile = input.userProfile || { personalBio: "" };
    
    const prompt = buildPrompt(userProfile.personalBio || "", input.content);
    
    console.log("=== FIXED OPENAI CALL ===");
    console.log("Model: gpt-4o");
    console.log("Prompt:", prompt.substring(0, 100) + "...");
    
    try {
      // Simple OpenAI call with JSON mode
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [{ role: "system", content: prompt }], 
        temperature: 0.4,
        response_format: { type: "json_object" }
      });
      
      console.log("GPT-4o API call successful");
      
      // Get semantic matches for context
      const allNotes = await storage.getAllNotes();
      const matches = []; // simplified for hot-fix
      
      // Parse OpenAI response directly (JSON mode guarantees valid JSON)
      const rawResponse = response.choices[0].message!.content!.trim();
      console.log("Raw OpenAI response:", rawResponse.substring(0, 100));
      
      const parsed = JSON.parse(rawResponse);
      console.log("Parsed JSON successfully:", Object.keys(parsed));
      
      // Use recursive analysis from existing engine
      const analysis = await this.reason.performRecursiveAnalysis(
         input.content, {}, matches, {});
      const richContext = composeFromAnalysis(input.content, analysis);

      // Update vectors if valid note ID
      if (input.id) { 
        this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(() => {});
      }

      // Return the composed result with OpenAI data merged in
      return {
        ...richContext,
        id: input.id ?? "temp", 
        timestamp: new Date().toISOString(), 
        richContext: { ...richContext, ...parsed }
      };
      
    } catch (error) {
      console.error("Intelligence V2 processing failed:", error);
      
      // Fallback processing
      return {
        id: input.id ?? "temp",
        title: input.content.split(' ').slice(0, 5).join(' ') || 'Untitled',
        summary: '',
        richContext: { title: input.content, perspective: 'Processing failed' },
        intent: 'general',
        urgency: 'medium',
        complexity: 5,
        confidence: 0.5,
        todos: [],
        nextSteps: [],
        entities: [],
        suggestedLinks: [],
        microQuestions: [],
        fromTheWeb: [],
        tags: [],
        relatedTopics: [],
        processingPath: 'memory',
        classificationScores: {},
        timeInstructions: { hasTimeReference: false, extractedTimes: [], scheduledItems: [] },
        timestamp: new Date().toISOString()
      };
    }
  }
}

/* singleton + helper export */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const singleton = new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i: IntelligenceV2Input) { 
  return singleton.processNoteV2(i); 
}
export default singleton;