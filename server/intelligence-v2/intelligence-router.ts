/**
 * Intelligence‑V2 Router  – syntactically minimal but functional
 *  • uses IntentVectorClassifier for routing
 *  • calls RecursiveReasoningEngine when flag is on
 *  • updates vectors and Collections
 *  • returns a trimmed IntelligenceV2Result
 */

import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine, RecursiveAnalysis } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FeatureFlagManager } from './feature-flags.js';
import { storage } from '../storage.js';

export interface IntelligenceV2Input {
  id?: string;
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
}

export interface IntelligenceV2Result {
  id: string;
  title: string;
  summary: string;
  enhancedContent: string;
  recursiveAnalysis?: RecursiveAnalysis;
  timestamp: string;
}

import OpenAI from 'openai';
import { makeTitle } from '../utils/title-governor.js';

export class IntelligenceV2Router {
  private vector: VectorEngine;
  private reason: RecursiveReasoningEngine;
  private flags = FeatureFlagManager.getInstance();

  constructor(private openai: OpenAI) {
    this.vector = new VectorEngine(openai);
    this.reason = new RecursiveReasoningEngine(openai, this.vector);
  }

  async processWithIntelligenceV2(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
    /** 1 ▸ classify intent */
    const intent: IntentVector = await IntentVectorClassifier.classify(input.content);

    /** 2 ▸ semantic matches (10) */
    const notes = await storage.getAllNotes();
    // Map to expected format for vector search
    const vectorNotes = notes.map(note => ({
      id: note.id,
      content: note.content,
      vectorDense: note.vectorDense || undefined,
      vectorSparse: note.vectorSparse || undefined
    }));
    const matches = await this.vector.performSemanticSearch(
      { query: input.content, limit: 10 },
      vectorNotes
    );

    /** 3 ▸ Collections auto‑extract */
    if (this.flags.isEnabled('ENHANCED_COLLECTIONS_ENABLED')) {
      await CollectionsExtractor.extract(input.id ?? '', input.content);
    }

    /** 4 ▸ recursive reasoning (optional) */
    let analysis: RecursiveAnalysis | undefined;
    if (this.flags.isEnabled('RECURSIVE_REASONING_ENABLED')) {
      try {
        analysis = await this.reason.performRecursiveAnalysis(
          input.content,
          {},            // user context placeholder
          matches,
          {}             // temporal context placeholder
        );
      } catch (err) {
        console.warn('Recursive reasoning failed:', err);
      }
    }

    /** 5 ▸ update vectors (fire‑and‑forget) */
    if (input.id && !isNaN(Number(input.id))) {
      this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(()=>{});
    }

    /** 6 ▸ build & return result */
    return {
      id: input.id ?? 'temp',
      title: makeTitle(input.content),
      summary: analysis?.immediateProcessing?.understanding ??
               'Intelligence‑V2 processed',
      enhancedContent: input.content,
      recursiveAnalysis: analysis,
      timestamp: new Date().toISOString()
    };
  }
}
