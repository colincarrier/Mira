export type EntityKind = 'person' | 'pet' | 'place' | 'org' | 'project' | 'concept';

export interface ExtractedEntity {
  id: string;
  text: string;
  normalizedText: string;
  kind: EntityKind;
  position: [number, number];
  confidence: number;
  context: string;
  extractionMethod: string;
}

export interface ExtractionResult {
  entities: ExtractedEntity[];
  metadata: {
    totalEntities: number;
    avgConfidence: number;
    extractionTimeMs: number;
    cacheHit: boolean;
    truncated: boolean;
  };
}

export interface ContextProcessingResult {
  extraction: ExtractionResult;
  storedFacts: string[];
  errors: string[];
  metadata: {
    processingTimeMs: number;
    factsAttempted: number;
    factsStored: number;
  };
}