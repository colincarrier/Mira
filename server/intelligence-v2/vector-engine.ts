/**
 * Intelligence-V2 Vector Engine
 * Handles dense and sparse vector operations for semantic search and relationship mapping
 */

export interface VectorEmbedding {
  dense: number[];
  sparse?: Record<string, number>;
  metadata: {
    model: string;
    dimensions: number;
    confidence: number;
    timestamp: Date;
  };
}

export interface SemanticSearchResult {
  noteId: number;
  content: string;
  similarity: number;
  reasoning: string;
  relationships: string[];
}

export interface VectorSearchQuery {
  query: string;
  embedding?: VectorEmbedding;
  filters?: {
    timeRange?: { start: Date; end: Date };
    collections?: number[];
    contentTypes?: string[];
    minSimilarity?: number;
  };
  limit?: number;
}

import OpenAI from 'openai';

export class VectorEngine {
  private openai: OpenAI;

  constructor(openaiClient: OpenAI) {
    this.openai = openaiClient;
  }

  /**
   * Generate dense vector embedding using OpenAI text-embedding-3-large
   */
  async generateDenseEmbedding(text: string): Promise<VectorEmbedding> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
        encoding_format: 'float'
      });

      return {
        dense: response.data[0].embedding,
        metadata: {
          model: 'text-embedding-3-large',
          dimensions: response.data[0].embedding.length,
          confidence: 1.0,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Failed to generate dense embedding:', error);
      throw new Error('Vector embedding generation failed');
    }
  }

  /**
   * Generate sparse vector for keyword-based matching
   */
  generateSparseEmbedding(text: string): Record<string, number> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const frequencies: Record<string, number> = {};
    const totalWords = words.length;

    // Calculate TF (Term Frequency)
    words.forEach(word => {
      frequencies[word] = (frequencies[word] || 0) + 1;
    });

    // Normalize to TF scores
    Object.keys(frequencies).forEach(word => {
      frequencies[word] = frequencies[word] / totalWords;
    });

    return frequencies;
  }

  /**
   * Calculate cosine similarity between dense vectors
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate sparse vector similarity using Jaccard coefficient
   */
  calculateSparseSimilarity(sparseA: Record<string, number>, sparseB: Record<string, number>): number {
    const keysAArray = Object.keys(sparseA);
    const keysBArray = Object.keys(sparseB);
    
    const intersection = keysAArray.filter(x => keysBArray.includes(x));
    const allKeys = keysAArray.concat(keysBArray);
    const uniqueKeys: string[] = [];
    const seen = new Set<string>();
    
    for (const key of allKeys) {
      if (!seen.has(key)) {
        seen.add(key);
        uniqueKeys.push(key);
      }
    }
    const union = uniqueKeys;

    if (union.length === 0) return 0;
    return intersection.length / union.length;
  }

  /**
   * Hybrid search combining dense and sparse similarities
   */
  calculateHybridSimilarity(
    denseA: number[], 
    denseB: number[],
    sparseA: Record<string, number>,
    sparseB: Record<string, number>,
    denseWeight: number = 0.7
  ): number {
    const denseSim = this.calculateCosineSimilarity(denseA, denseB);
    const sparseSim = this.calculateSparseSimilarity(sparseA, sparseB);
    
    return (denseSim * denseWeight) + (sparseSim * (1 - denseWeight));
  }

  /**
   * Perform semantic search across notes using hybrid approach
   */
  async performSemanticSearch(
    query: VectorSearchQuery,
    existingNotes: Array<{
      id: number;
      content: string;
      vectorDense?: string;
      vectorSparse?: string;
    }>
  ): Promise<SemanticSearchResult[]> {
    // Generate query embedding if not provided
    let queryEmbedding = query.embedding;
    if (!queryEmbedding) {
      queryEmbedding = await this.generateDenseEmbedding(query.query);
    }

    const querySparse = this.generateSparseEmbedding(query.query);
    const results: SemanticSearchResult[] = [];

    for (const note of existingNotes) {
      try {
        // Parse stored vectors
        const noteDense = note.vectorDense ? JSON.parse(note.vectorDense) : null;
        const noteSparse = note.vectorSparse ? JSON.parse(note.vectorSparse) : {};

        if (!noteDense) continue; // Skip notes without dense vectors

        // Calculate hybrid similarity
        const similarity = this.calculateHybridSimilarity(
          queryEmbedding.dense,
          noteDense,
          querySparse,
          noteSparse
        );

        // Apply minimum similarity filter
        const minSimilarity = query.filters?.minSimilarity || 0.3;
        if (similarity < minSimilarity) continue;

        // Generate reasoning for the match
        const reasoning = this.generateMatchReasoning(similarity, query.query, note.content);

        results.push({
          noteId: note.id,
          content: note.content,
          similarity,
          reasoning,
          relationships: [] // To be enhanced with relationship mapping
        });
      } catch (error) {
        console.error(`Error processing note ${note.id} for semantic search:`, error);
        continue;
      }
    }

    // Sort by similarity and apply limit
    results.sort((a, b) => b.similarity - a.similarity);
    const limit = query.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Generate human-readable reasoning for similarity matches
   */
  private generateMatchReasoning(similarity: number, query: string, content: string): string {
    if (similarity > 0.8) {
      return `Very high semantic similarity - content directly relates to "${query}"`;
    } else if (similarity > 0.6) {
      return `Strong conceptual connection found with "${query}"`;
    } else if (similarity > 0.4) {
      return `Moderate relevance detected through shared concepts`;
    } else {
      return `Weak but potentially useful connection identified`;
    }
  }

  /**
   * Update note vectors in database
   */
  async updateNoteVectors(noteId: number, content: string, storage: any): Promise<void> {
    try {
      // Generate both dense and sparse vectors
      const denseEmbedding = await this.generateDenseEmbedding(content);
      const sparseEmbedding = this.generateSparseEmbedding(content);

      // Update note with vector data
      await storage.updateNote(noteId, {
        vectorDense: JSON.stringify(denseEmbedding.dense),
        vectorSparse: JSON.stringify(sparseEmbedding)
      });

      console.log(`Updated vectors for note ${noteId}`);
    } catch (error) {
      console.error(`Failed to update vectors for note ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Batch process existing notes to generate vectors
   */
  async batchProcessVectors(storage: any, batchSize: number = 10): Promise<void> {
    try {
      console.log('Starting batch vector processing...');
      
      // Get notes without vectors
      const notes = await storage.getAllNotes();
      const notesToProcess = notes.filter((note: any) => !note.vectorDense);

      console.log(`Processing ${notesToProcess.length} notes in batches of ${batchSize}`);

      for (let i = 0; i < notesToProcess.length; i += batchSize) {
        const batch = notesToProcess.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map((note: any) => this.updateNoteVectors(note.id, note.content, storage))
        );

        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(notesToProcess.length / batchSize)}`);
        
        // Add delay to avoid rate limiting
        if (i + batchSize < notesToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Batch vector processing completed');
    } catch (error) {
      console.error('Batch vector processing failed:', error);
      throw error;
    }
  }
}