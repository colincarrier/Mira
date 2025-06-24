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
    
    const { choices } = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.4
    });
    
    const parsed = JSON.parse(choices[0].message!.content!);

    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }

    console.log("=== V2 ROUTER OUTPUT DEBUG ===");
    console.log("Generated parsed result:", parsed);
    console.log("=== END V2 DEBUG ===");

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