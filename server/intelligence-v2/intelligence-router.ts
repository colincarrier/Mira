import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';
import { composeRichContext } from '../ai/presentation-composer.js';

export interface IntelligenceV2Input { 
  id?:string; 
  content:string; 
  mode:'text'|'voice'|'image'|'file'; 
  userId?: string;
  userProfile?: any;
}
export interface IntelligenceV2Result { id:string; title:string; original:string; aiBody:string; perspective:string; timestamp:string; }

export class IntelligenceV2Router {
  private vector:VectorEngine; private reason:RecursiveReasoningEngine;
  constructor(openai:OpenAI){ this.vector=new VectorEngine(openai); this.reason=new RecursiveReasoningEngine(openai,this.vector); }

  async processNoteV2(input:IntelligenceV2Input):Promise<IntelligenceV2Result>{
    const userProfile = input.userProfile || { personalBio: "" };
    
    // Bio personalisation hook
    const bioLine = userProfile?.personalBio?.split('\n')[1] ?? '';
    
    const intent:IntentVector = await IntentVectorClassifier.classify(input.content + "\nUSER_BIO:\n" + userProfile.personalBio);
    const notes=await storage.getAllNotes();
    const matches=await this.vector.performSemanticSearch({query:input.content,limit:10},notes);

    if(FEATURE_FLAGS.ENHANCED_COLLECTIONS_ENABLED){
      await CollectionsExtractor.extract(input.id??'',input.content);
    }

    let analysis; if(FEATURE_FLAGS.RECURSIVE_REASONING_ENABLED){
      try{analysis=await this.reason.performRecursiveAnalysis(input.content,{},matches,{});}catch(e){console.warn('Recursion failed',e);}
    }

    // Add bio context to understanding if available
    if (analysis?.immediateProcessing?.understanding && bioLine.trim()) {
      analysis.immediateProcessing.understanding = 
        `${analysis.immediateProcessing.understanding} (${bioLine.trim()})`;
    }

    // Generate rich context for presentation using new composer
    const richContext = composeRichContext(input.content, analysis);

    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }

    return{
      id: input.id ?? 'temp',
      ...richContext,            // title, original, aiBody, perspective
      timestamp: new Date().toISOString()
    };
  }
}

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;