import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';
import { buildPrompt } from '../ai/prompt-specs.js';

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
  constructor(openai:OpenAI){ this.openai=openai; this.vector=new VectorEngine(openai); this.reason=new RecursiveReasoningEngine(openai,this.vector); }

  async processNoteV2(input:IntelligenceV2Input):Promise<IntelligenceV2Result>{
    const userProfile = input.userProfile || { personalBio: "" };
    
    const prompt = buildPrompt(userProfile.personalBio || "", input.content);
    
    console.log("=== EXACT OPENAI INPUT ===");
    console.log("MODEL:", 'gpt-4o');
    console.log("TEMPERATURE:", 0.4);
    console.log("SYSTEM PROMPT (word-for-word):");
    console.log(prompt);
    console.log("=== END OPENAI INPUT ===");
    
    const { choices } = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.4
    });
    
    console.log("=== EXACT OPENAI OUTPUT ===");
    console.log("RAW RESPONSE:");
    console.log(choices[0].message!.content);
    console.log("=== END OPENAI OUTPUT ===");
    
    const parsed = JSON.parse(choices[0].message!.content!);

    console.log("=== PARSED JSON RESULT ===");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("=== END PARSED RESULT ===");

    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }

    return{
      id: input.id ?? 'temp',
      timestamp: new Date().toISOString(),
      richContext: parsed,
      ...parsed
    };
  }
}

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;