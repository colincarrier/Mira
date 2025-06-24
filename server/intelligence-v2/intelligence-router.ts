
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

    
    const { buildPrompt } = await import('../ai/prompt-specs');
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
    
    let response;
    try {
      // Use GPT-4o with JSON mode - simplified approach
      response = await this.openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          { role: "system", content: "You are an AI assistant. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ], 
        temperature: 0.4,
        response_format: { type: "json_object" }
      });
      console.log("GPT-4o call successful");
    } catch (apiError: any) {
      console.error("OpenAI API Error:", apiError.message);
      throw new Error(`AI processing failed: ${apiError.message}`);
    }
    
    // Simple JSON parsing - same approach as working image processing
    const rawContent = response.choices[0].message?.content?.trim();
    
    if (!rawContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    console.log("Raw OpenAI response (first 100 chars):", rawContent.substring(0, 100));
    
    let parsed;
    try {
      // Direct JSON parsing - no complex cleaning
      parsed = JSON.parse(rawContent);
      console.log("JSON parsing successful");
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw response:", rawContent);
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    if(input.id){ 
      this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(()=>{}); 
    }

    return {
      id: input.id || 'temp',
      title: parsed.title || input.content.split(' ').slice(0,5).join(' ') || 'Untitled',
      summary: parsed.perspective || '',
      richContext: JSON.stringify(parsed),
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
      timeInstructions: {hasTimeReference:false,extractedTimes:[],scheduledItems:[]},
      timestamp: new Date().toISOString()
    };
  }

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;