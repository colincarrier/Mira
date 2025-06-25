import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';
import { buildPrompt } from '../ai/prompt-specs.js';
import { composeFromAnalysis } from '../ai/compose-v2.js';

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
      const testResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      console.log("✅ OpenAI connection test successful:", testResponse.choices[0].message.content);
    } catch (error: any) {
      console.error("❌ OpenAI connection test failed:", error.message);
      console.error("Status:", error.status);
    }
  }

  async processNoteV2(input:IntelligenceV2Input):Promise<IntelligenceV2Result>{
    const userProfile = input.userProfile || { personalBio: "" };
    
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
      // Use gpt-3.5-turbo with strict JSON mode
      response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a JSON processor. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });
      console.log("OpenAI API call successful with JSON mode");
    } catch (apiError: any) {
      console.error("=== OPENAI API ERROR DETAILS ===");
      console.error("Error type:", apiError.constructor.name);
      console.error("Status code:", apiError.status);
      console.error("Error message:", apiError.message);
      console.error("Request ID:", apiError.requestID);
      console.error("Error code:", apiError.code);
      console.error("Error param:", apiError.param);
      console.error("Error type field:", apiError.type);
      
      // Check if it's a 404 indicating model or API key issue
      if (apiError.status === 404) {
        console.error("404 Error - Possible causes:");
        console.error("1. Invalid API key");
        console.error("2. Model 'gpt-4o' not available for this API key");
        console.error("3. API endpoint issue");
        
        // Try with gpt-4o as fallback
        console.log("Attempting fallback to gpt-4o...");
        try {
          response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.4,
            max_tokens: 1000
          });
          console.log("Fallback to gpt-4o successful");
        } catch (fallbackError: any) {
          console.error("gpt-4o also failed:", fallbackError.message);
          throw new Error(`OpenAI API access issue: ${apiError.message}. Please verify your API key is valid and has proper model access.`);
        }
      } else {
        throw apiError;
      }
    }
    
    const { choices } = response;
    
    console.log("=== EXACT OPENAI OUTPUT ===");
    console.log("RAW RESPONSE:");
    console.log(choices[0].message!.content);
    console.log("=== END OPENAI OUTPUT ===");
    
    // Robust markdown cleaning
    let cleanResponse = choices[0].message!.content!.trim();
    console.log("=== CLEANING PROCESS ===");
    console.log("Original response length:", cleanResponse.length);
    console.log("First 50 chars:", cleanResponse.substring(0, 50));
    console.log("Last 50 chars:", cleanResponse.substring(cleanResponse.length - 50));
    
    // Remove all markdown wrappers - be more aggressive
    cleanResponse = cleanResponse
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    
    // Additional safety - find the JSON object boundaries
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      console.log("Extracted JSON boundaries");
    }
    
    console.log("After cleaning length:", cleanResponse.length);
    console.log("Cleaned first 50 chars:", cleanResponse.substring(0, 50));
    console.log("=== END CLEANING PROCESS ===");
    
    console.log("=== CLEANED RESPONSE ===");
    console.log(cleanResponse);
    console.log("=== END CLEANED RESPONSE ===");
    
    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
      console.log("=== JSON PARSING SUCCESS ===");
    } catch (parseError) {
      console.error("=== JSON PARSING FAILED ===");
      console.error("Parse error:", parseError.message);
      console.error("Problematic content:", cleanResponse.substring(0, 200));
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }

    console.log("=== PARSED JSON RESULT ===");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("=== END PARSED RESULT ===");

    /* --- recursive enhancement --- */
    const reasoningResult = await this.reason.enhance(
      parsed,
      input.content
    );

    /* --- compose deterministic fallback then merge with GPT JSON --- */
    const composed = composeFromAnalysis(input.content, reasoningResult);
    const rich = { ...composed, ...parsed };  // GPT wins where present

    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }

    return{
      id: input.id ?? 'temp',
      title: rich.title,
      summary: rich.aiBody.slice(0,120),
      richContext: rich,
      todos: rich.todos,
      collections: rich.collections ?? [],
      timestamp: new Date().toISOString()
    };
  }
}

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;