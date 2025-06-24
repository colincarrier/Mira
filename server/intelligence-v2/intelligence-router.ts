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
    const gpt = await this.openai.chat.completions.create({
       model:"gpt-4o", messages:[{role:"system",content:prompt}], temperature:0.4});
    const analysis = await this.reason.performRecursiveAnalysis(
       input.content, {}, matches, {});
    const parsed = composeFromAnalysis(input.content, analysis);

      
    } catch (error) {
      console.error("Intelligence V2 processing failed:", error);
      
      // Fallback processing
    return { ...parsed, id:input.id??"temp", timestamp:new Date().toISOString(), richContext:parsed };
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