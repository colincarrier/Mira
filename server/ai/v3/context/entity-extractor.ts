import { performance } from 'perf_hooks';
import nlp from 'compromise';
import { v4 as uuid } from 'uuid';
import { LRUCache as LRU } from 'lru-cache';
import { getContextConfig } from './db-pool.js';
import { ExtractedEntity, EntityKind, ExtractionResult } from './types.js';

const MAX_INPUT_BYTES = 16 * 1024;
const MAX_ENTITIES = 25;
const DEFAULT_MIN_CONFIDENCE = 0.6;

const EXTRACTION_PATTERNS: Record<EntityKind, RegExp[]> = {
  person: [
    /\b(?:met|saw|talked\s+(?:to|with)|spoke\s+(?:to|with))\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    /\b(?:my|our)\s+(?:friend|colleague|boss|manager)\s+([A-Z][a-z]+)\b/g,
    /\b([A-Z][a-z]+)\s+(?:said|told|mentioned)\b/g
  ],
  pet: [
    /\b(?:my|our)\s+(?:dog|cat|pet|puppy|kitten)\s+([A-Z][a-z]+)\b/g
  ],
  place: [
    /\b(?:went\s+to|visiting|at|in)\s+([A-Z][a-zA-Z\s]+(?:Park|Street|Avenue|Center|Restaurant))\b/g
  ],
  org: [
    /\b(?:works?\s+(?:at|for)|job\s+at)\s+([A-Z][a-zA-Z\s&]+)\b/g
  ],
  project: [
    /\b(?:project|working\s+on)\s+([A-Z][a-zA-Z\s]+)\b/g
  ],
  concept: []
};

function createEntity(
  text: string, kind: EntityKind, position: number, 
  confidence: number, method: string
): ExtractedEntity {
  return {
    id: uuid(),
    text: text.trim(),
    normalizedText: text.toLowerCase().trim(),
    kind,
    position: [position, position + text.length],
    confidence: Math.round(confidence * 100) / 100,
    context: '',
    extractionMethod: method
  };
}

export class ContextAwareExtractor {
  private cache: LRU<string, ExtractedEntity[]>;
  private minConfidence: number = DEFAULT_MIN_CONFIDENCE;

  constructor(explicitCacheSize?: number) {
    this.cache = new LRU({
      max: explicitCacheSize ?? 1000,
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 5 * 1024 * 1024, // 5MB
      sizeCalculation: (value: ExtractedEntity[]) => JSON.stringify(value).length
    });

    if (!explicitCacheSize) {
      this.loadConfiguration().catch(error => {
        console.warn('Failed to load extractor config:', error);
      });
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const cacheSize = await getContextConfig('extractor_cache_size', 1000);
      const minConf = await getContextConfig('min_confidence_threshold', DEFAULT_MIN_CONFIDENCE);
      
      this.cache.resize(Number(cacheSize));
      this.minConfidence = Number(minConf);
      
      console.log(`Context extractor configured: cache=${cacheSize}, minConf=${minConf}`);
    } catch (error) {
      console.warn('Configuration load failed:', error);
    }
  }

  async extract(text: string): Promise<ExtractionResult> {
    const startTime = performance.now();
    
    if (!text || typeof text !== 'string' || !text.trim()) {
      return this.createEmptyResult(startTime, false);
    }

    let truncated = false;
    if (Buffer.byteLength(text, 'utf8') > MAX_INPUT_BYTES) {
      text = text.slice(0, MAX_INPUT_BYTES);
      truncated = true;
    }

    const cacheKey = this.createCacheKey(text);
    const cachedEntities = this.cache.get(cacheKey);
    if (cachedEntities) {
      return this.createResult(cachedEntities, startTime, true, truncated);
    }

    const rawEntities: ExtractedEntity[] = [];

    // Pattern extraction
    this.extractUsingPatterns(text, rawEntities);
    
    // NLP extraction
    await this.extractUsingNLP(text, rawEntities);

    const processedEntities = this.processEntities(rawEntities);
    this.cache.set(cacheKey, processedEntities);

    return this.createResult(processedEntities, startTime, false, truncated);
  }

  private extractUsingPatterns(text: string, entities: ExtractedEntity[]): void {
    for (const [kind, patterns] of Object.entries(EXTRACTION_PATTERNS) as [EntityKind, RegExp[]][]) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const entityText = match[1];
          if (entityText && entityText.length >= 2) {
            entities.push(createEntity(entityText, kind, match.index, 0.85, 'pattern'));
          }
        }
      }
    }
  }

  private async extractUsingNLP(text: string, entities: ExtractedEntity[]): Promise<void> {
    try {
      const doc = nlp(text);
      
      doc.people().forEach((person: any) => {
        const personText = person.text();
        const position = text.indexOf(personText);
        if (position !== -1) {
          entities.push(createEntity(personText, 'person', position, 0.75, 'nlp'));
        }
      });

      doc.places().forEach((place: any) => {
        const placeText = place.text();
        const position = text.indexOf(placeText);
        if (position !== -1) {
          entities.push(createEntity(placeText, 'place', position, 0.75, 'nlp'));
        }
      });

      doc.organizations().forEach((org: any) => {
        const orgText = org.text();
        const position = text.indexOf(orgText);
        if (position !== -1) {
          entities.push(createEntity(orgText, 'org', position, 0.75, 'nlp'));
        }
      });
    } catch (error) {
      console.warn('NLP extraction failed:', error);
    }
  }

  private processEntities(rawEntities: ExtractedEntity[]): ExtractedEntity[] {
    const entityMap = new Map<string, ExtractedEntity>();
    
    for (const entity of rawEntities) {
      const key = `${entity.normalizedText}:${entity.kind}`;
      const existing = entityMap.get(key);
      
      if (!existing || entity.confidence > existing.confidence) {
        entityMap.set(key, entity);
      }
    }

    return Array.from(entityMap.values())
      .filter(entity => entity.confidence >= this.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_ENTITIES);
  }

  private createCacheKey(text: string): string {
    return text.slice(0, 150).replace(/\s+/g, ' ').trim();
  }

  private createResult(
    entities: ExtractedEntity[], startTime: number, 
    cacheHit: boolean, truncated: boolean
  ): ExtractionResult {
    const extractionTime = performance.now() - startTime;
    const avgConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
      : 0;

    return {
      entities,
      metadata: {
        totalEntities: entities.length,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        extractionTimeMs: Math.round(extractionTime * 100) / 100,
        cacheHit,
        truncated
      }
    };
  }

  private createEmptyResult(startTime: number, truncated: boolean): ExtractionResult {
    return this.createResult([], startTime, false, truncated);
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize || 0,
      minConfidence: this.minConfidence
    };
  }
}