import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';

export interface IntelligenceV2Input { id?:string; content:string; mode:'text'|'voice'|'image'|'file'; }
export interface IntelligenceV2Result { id:string; title:string; summary:string; enhancedContent:string; timestamp:string; }

export class IntelligenceV2Router {
  private vector:VectorEngine; private reason:RecursiveReasoningEngine;
  constructor(openai:OpenAI){ this.vector=new VectorEngine(openai); this.reason=new RecursiveReasoningEngine(openai,this.vector); }

  async processNoteV2(input:IntelligenceV2Input):Promise<IntelligenceV2Result>{
    const intent:IntentVector = await IntentVectorClassifier.classify(input.content);
    const notes=await storage.getAllNotes();
    const matches=await this.vector.performSemanticSearch({query:input.content,limit:10},notes);

    if(FEATURE_FLAGS.ENHANCED_COLLECTIONS_ENABLED){
      await CollectionsExtractor.extract(input.id??'',input.content);
    }

    let analysis; if(FEATURE_FLAGS.RECURSIVE_REASONING_ENABLED){
      try{analysis=await this.reason.performRecursiveAnalysis(input.content,{},matches,{});}catch(e){console.warn('Recursion failed',e);}
    }

    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }

    return{
      id:input.id??'temp',
      title:makeTitle(input.content),
      summary:analysis?.immediateProcessing?.understanding ?? 'Intelligence‑V2 processed',
      enhancedContent:input.content,
      timestamp:new Date().toISOString()
    };
  }
}

/* singleton + helper export */
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY!});
const singleton=new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(i:IntelligenceV2Input){ return singleton.processNoteV2(i);}
export default singleton;