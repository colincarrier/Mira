import { performance } from 'perf_hooks';
import { Memory } from '../memory/simple-memory.js';
import { ContextAwareExtractor } from './entity-extractor.js';
import { EntityKind, ContextProcessingResult } from './types.js';

export class ContextMemory {
  private extractor: ContextAwareExtractor;

  constructor(cacheSize?: number) {
    this.extractor = new ContextAwareExtractor(cacheSize);
  }

  async processNote(userId: string, noteContent: string): Promise<ContextProcessingResult> {
    const startTime = performance.now();
    
    const extraction = await this.extractor.extract(noteContent);
    const storedFacts: string[] = [];
    const errors: string[] = [];

    for (const entity of extraction.entities) {
      try {
        // Get existing fact to merge metadata
        const existingResult = await Memory.recallFacts(userId, entity.text, 1);
        const existingFact = existingResult.success ? existingResult.data[0] : null;

        // Merge metadata preserving existing data
        const mergedMetadata = {
          ...existingFact?.metadata || {},
          extractionMethod: entity.extractionMethod,
          extractionConfidence: entity.confidence,
          position: entity.position,
          lastExtracted: new Date().toISOString(),
          sourceNote: noteContent.slice(0, 100)
        };

        // Use corrected Stage-2A API format
        const result = await Memory.rememberFact(
          userId,
          entity.text,
          entity.kind as EntityKind,
          {
            contexts: [noteContent.slice(0, 200)],
            metadata: mergedMetadata
          }
        );

        if (result.success) {
          storedFacts.push(entity.text);
        } else {
          errors.push(`Store failed for "${entity.text}": ${JSON.stringify(result)}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Error processing "${entity.text}": ${errorMsg}`);
      }
    }

    const processingTime = performance.now() - startTime;

    return {
      extraction,
      storedFacts,
      errors,
      metadata: {
        processingTimeMs: Math.round(processingTime * 100) / 100,
        factsAttempted: extraction.entities.length,
        factsStored: storedFacts.length
      }
    };
  }

  async getRelevantContext(userId: string, query: string, limit = 10) {
    try {
      const result = await Memory.recallFacts(userId, query, limit);
      return {
        facts: result.success ? result.data : [],
        error: result.success ? null : JSON.stringify(result)
      };
    } catch (error) {
      return {
        facts: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  getStats() {
    return {
      extractor: this.extractor.getStats()
    };
  }
}