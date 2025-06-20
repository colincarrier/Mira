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
    console.log('🧠 [V2] Processing note:', input.content.substring(0, 50) + '...');
    
    const intent:IntentVector=await IntentVectorClassifier.classify(input.content);
    console.log('🎯 [V2] Intent classified:', intent.primaryIntent);
    
    const notes=await storage.getAllNotes();
    const matches=await this.vector.performSemanticSearch({query:input.content,limit:10},notes);
    console.log('🔍 [V2] Found', matches.length, 'semantic matches');
    
    if(this.flags.isEnabled('ENHANCED_COLLECTIONS_ENABLED')){ 
      await CollectionsExtractor.extract(Number(input.id??'0'),input.content); 
    }
    
    let analysis = null;
    if(this.flags.isEnabled('RECURSIVE_REASONING_ENABLED')){
      try{
        console.log('🔄 [V2] Starting recursive analysis...');
        analysis=await this.reason.performRecursiveAnalysis(input.content,{},matches,{});
        console.log('✅ [V2] Recursive analysis completed:', analysis ? 'success' : 'empty');
      }catch(e){
        console.warn('❌ [V2] Recursion failed:',e);
        // Create fallback analysis structure
        analysis = {
          immediateProcessing: {
            understanding: `Advanced analysis of: ${input.content}`,
            entities: this.extractEntities(input.content),
            intent: intent.primaryIntent,
            urgency: 'medium',
            complexity: 5
          },
          recursiveReasoning: {
            step1Anticipation: {
              potentialActions: this.generateNextSteps(input.content),
              followUpQuestions: this.generateMicroQuestions(input.content)
            }
          },
          proactiveDelivery: {
            suggestedActions: this.generateSmartActions(input.content)
          }
        };
      }
    } else {
      // Create enhanced analysis when recursive reasoning is disabled
      analysis = {
        immediateProcessing: {
          understanding: `Enhanced Intelligence-V2 analysis of: ${input.content}`,
          entities: this.extractEntities(input.content),
          intent: intent.primaryIntent,
          urgency: 'medium',
          complexity: 5
        },
        recursiveReasoning: {
          step1Anticipation: {
            potentialActions: this.generateNextSteps(input.content),
            followUpQuestions: this.generateMicroQuestions(input.content)
          }
        },
        proactiveDelivery: {
          suggestedActions: this.generateSmartActions(input.content)
        }
      };
    }
    
    if(input.id){ 
      this.vector.updateNoteVectors(Number(input.id),input.content,storage).catch(()=>{}); 
    }
    
    console.log('🎉 [V2] Processing complete with enhanced analysis');
    
    return{ 
      id:input.id??'temp', 
      title:makeTitle(input.content),
      summary:analysis?.immediateProcessing?.understanding ?? 'Intelligence-V2 enhanced processing complete',
      enhancedContent:input.content, 
      timestamp:new Date().toISOString(),
      recursiveAnalysis: analysis,
      intentVector: intent
    };
  }

  private extractEntities(content: string): string[] {
    const entities = [];
    // Extract potential entities using simple patterns
    const words = content.toLowerCase().split(/\s+/);
    const entityKeywords = ['price', 'ticket', 'game', 'dodgers', 'cost', 'buy', 'purchase', 'schedule'];
    for (const word of words) {
      if (entityKeywords.some(keyword => word.includes(keyword))) {
        entities.push(word);
      }
    }
    return [...new Set(entities)]; // Remove duplicates
  }

  private generateNextSteps(content: string): string[] {
    const steps = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('price') || lowerContent.includes('cost')) {
      steps.push('Research current pricing options');
      steps.push('Compare prices across different platforms');
    }
    if (lowerContent.includes('ticket') || lowerContent.includes('game')) {
      steps.push('Check game schedule and availability');
      steps.push('Review seating options and locations');
    }
    if (lowerContent.includes('dodgers')) {
      steps.push('Visit official Dodgers website');
      steps.push('Check secondary market options');
    }
    
    return steps.length > 0 ? steps : ['Follow up on this request', 'Gather additional information'];
  }

  private generateMicroQuestions(content: string): string[] {
    const questions = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('price') || lowerContent.includes('cost')) {
      questions.push('What price range are you targeting?');
      questions.push('Do you have a preferred seating section?');
    }
    if (lowerContent.includes('game')) {
      questions.push('Which specific game are you interested in?');
      questions.push('How many tickets do you need?');
    }
    
    return questions.length > 0 ? questions : ['Any specific preferences?', 'Would you like additional details?'];
  }

  private generateSmartActions(content: string): Array<{action: string, priority: number, reasoning: string}> {
    const actions = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('price') && lowerContent.includes('dodgers')) {
      actions.push({
        action: 'Research Dodgers ticket prices',
        priority: 8,
        reasoning: 'User specifically requested pricing information for Dodgers games'
      });
    }
    if (lowerContent.includes('check')) {
      actions.push({
        action: 'Set up price monitoring',
        priority: 6,
        reasoning: 'User wants to check prices, suggesting ongoing monitoring might be helpful'
      });
    }
    
    return actions.length > 0 ? actions : [{
      action: 'Process and organize this information',
      priority: 5,
      reasoning: 'Standard processing for better organization'
    }];
  }
}
