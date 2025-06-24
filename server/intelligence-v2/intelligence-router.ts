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
  userId?: string;
  userProfile?: any;
}
export interface IntelligenceV2Result { id:string; title:string; original:string; aiBody:string; perspective:string; timestamp:string; }

export class IntelligenceV2Router {
  private vector:VectorEngine; private reason:RecursiveReasoningEngine; private openai:OpenAI;
  constructor(openai:OpenAI){ 
    console.log("IntelligenceV2Router initialized with API key:", openai ? "present" : "missing");
    // Test the OpenAI instance immediately
    this.testAPIConnection(openai);
    this.openai=openai; 
    this.vector=new VectorEngine(openai); 
    this.reason=new RecursiveReasoningEngine(openai,this.vector); 
  }

  private async testAPIConnection(openai: OpenAI) {
    try {
      console.log("Testing OpenAI connection with simple call...");
    const gpt = await this.openai.chat.completions.create({
       model:"gpt-4o", messages:[{role:"system",content:prompt}], temperature:0.4});
    const analysis = await this.reason.performRecursiveAnalysis(
       input.content, {}, matches, {});
    const parsed = composeFromAnalysis(input.content, analysis);

    
    const prompt = buildPrompt(userProfile.personalBio || "", input.content);
    
    console.log("=== EXACT OPENAI INPUT ===");
    console.log("MODEL:", 'gpt-4o');
    console.log("TEMPERATURE:", 0.4);
    console.log("SYSTEM PROMPT (word-for-word):");
    console.log(prompt);
    console.log("=== END OPENAI INPUT ===");
    
    console.log("=== OPENAI API CALL DEBUG ===");
    console.log("Model: gpt-4o");
    const actualKey = process.env.OPENAI_API_KEY_MIRA || process.env.OPENAI_API_KEY;
    console.log("API Key present:", !!actualKey);
    console.log("API Key first 10 chars:", actualKey?.substring(0, 10) || 'undefined');
    console.log("Prompt length:", prompt.length);
    
    try {
      // Use GPT-4o with clean JSON processing
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [{role: "system", content: prompt}], 
        temperature: 0.4,
        response_format: { type: "json_object" }
      });
      
      // Get semantic matches for context
      const allNotes = await storage.getAllNotes();
      const matches = []; // simplified for stability
      
      // Parse OpenAI response directly (JSON mode guarantees valid JSON)
      const rawResponse = response.choices[0].message!.content!.trim();
      const parsed = JSON.parse(rawResponse);
      
      console.log("GPT-4o response parsed successfully:", parsed.title);
      
      // Use recursive analysis from existing engine
      const analysis = await this.reason.performRecursiveAnalysis(
        input.content, {}, matches, {});
      const richContext = composeFromAnalysis(input.content, analysis);
      
      // Update vectors if valid note ID
      if(input.id){ 
        this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(()=>{}); 
      }

      // Return the composed result with OpenAI data merged in
      return {
        ...richContext,
        id: input.id ?? "temp", 
        timestamp: new Date().toISOString(), 
        richContext: { ...richContext, ...parsed }
      };
    } catch (error) {
      console.error('Intelligence V2 processing failed:', error);
      // Return fallback result
      return {
        id: input.id ?? "temp",
        title: input.content.split(' ').slice(0, 5).join(' ') || 'Untitled',
        timestamp: new Date().toISOString(),
        richContext: { title: input.content, perspective: "Processing failed" }
      };
    }
  }
}

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;