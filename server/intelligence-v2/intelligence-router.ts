import OpenAI from 'openai';
import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FeatureFlagManager } from './feature-flags.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';

export interface IntelligenceV2Input { id?:string; content:string; mode:'text'|'voice'|'image'|'file'; }
export interface IntelligenceV2Result { 
  id:string; 
  title:string; 
  summary:string; 
  enhancedContent:string; 
  timestamp:string; 
  recursiveAnalysis?: any;
  intentVector?: IntentVector;
}

export class IntelligenceV2Router {
  private vector:VectorEngine; private reason:RecursiveReasoningEngine;
  private flags=FeatureFlagManager.getInstance();
  constructor(openai:OpenAI){ this.vector=new VectorEngine(openai); this.reason=new RecursiveReasoningEngine(openai,this.vector); }
  async processNoteV2(input:IntelligenceV2Input):Promise<IntelligenceV2Result>{
    const intent:IntentVector=await IntentVectorClassifier.classify(input.content);
    const notes=await storage.getAllNotes();
    const matches=await this.vector.performSemanticSearch({query:input.content,limit:10},notes);
    if(this.flags.isEnabled('ENHANCED_COLLECTIONS_ENABLED')){ await CollectionsExtractor.extract(Number(input.id??'0'),input.content); }
    let analysis; if(this.flags.isEnabled('RECURSIVE_REASONING_ENABLED')){
      try{analysis=await this.reason.performRecursiveAnalysis(input.content,{},matches,{});}catch(e){console.warn('Recursion failed',e);}
    }
    if(input.id){ this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); }
    return{ 
      id:input.id??'temp', 
      title:makeTitle(input.content),
      summary:analysis?.immediateProcessing?.understanding??'Intelligence‑V2 processed',
      enhancedContent:input.content, 
      timestamp:new Date().toISOString(),
      recursiveAnalysis: analysis,
      intentVector: intent
    };
  }
}
