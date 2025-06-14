/**
 * Intelligence-V2 Relationship Mapper
 * Builds and maintains contextual relationships between notes, entities, and concepts
 */

import { VectorEngine, SemanticSearchResult } from './vector-engine.js';

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  strength: number;
  context: string;
  confidence: number;
  discoveredAt: Date;
  lastVerified: Date;
}

export enum RelationshipType {
  SEMANTIC = 'semantic',
  TEMPORAL = 'temporal',
  CAUSAL = 'causal',
  REFERENCE = 'reference',
  UPDATE = 'update',
  CONTINUATION = 'continuation',
  CONTRADICTION = 'contradiction',
  SUPPORTS = 'supports',
  DEPENDS_ON = 'depends_on',
  TRIGGERS = 'triggers'
}

export interface RelationshipGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: NodeCluster[];
}

export interface GraphNode {
  id: string;
  type: 'note' | 'entity' | 'concept' | 'todo' | 'collection';
  label: string;
  weight: number;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationshipType;
  weight: number;
  metadata: Record<string, any>;
}

export interface NodeCluster {
  id: string;
  nodes: string[];
  theme: string;
  strength: number;
  suggestedActions: string[];
}

export class RelationshipMapper {
  private vectorEngine: VectorEngine;
  private openai: any;
  private relationships: Map<string, Relationship[]> = new Map();

  constructor(openaiClient: any, vectorEngine: VectorEngine) {
    this.openai = openaiClient;
    this.vectorEngine = vectorEngine;
  }

  /**
   * Analyze and map relationships for a new note
   */
  async mapRelationships(
    noteId: string,
    content: string,
    allNotes: any[],
    storage: any
  ): Promise<Relationship[]> {
    try {
      // Get semantic matches
      const semanticMatches = await this.vectorEngine.performSemanticSearch(
        { query: content, limit: 20 },
        allNotes.filter(note => note.id.toString() !== noteId)
      );

      // Find temporal relationships
      const temporalRelationships = await this.findTemporalRelationships(
        noteId,
        content,
        allNotes
      );

      // Detect update relationships
      const updateRelationships = await this.detectUpdateRelationships(
        noteId,
        content,
        semanticMatches
      );

      // Find causal relationships
      const causalRelationships = await this.findCausalRelationships(
        noteId,
        content,
        semanticMatches
      );

      // Combine all relationships
      const allRelationships = [
        ...this.createSemanticRelationships(noteId, semanticMatches),
        ...temporalRelationships,
        ...updateRelationships,
        ...causalRelationships
      ];

      // Store relationships
      this.relationships.set(noteId, allRelationships);

      // Persist to storage if available
      if (storage && storage.storeRelationships) {
        await storage.storeRelationships(noteId, allRelationships);
      }

      return allRelationships;
    } catch (error) {
      console.error(`Failed to map relationships for note ${noteId}:`, error);
      return [];
    }
  }

  /**
   * Create semantic relationships from vector search results
   */
  private createSemanticRelationships(
    noteId: string,
    semanticMatches: SemanticSearchResult[]
  ): Relationship[] {
    return semanticMatches
      .filter(match => match.similarity > 0.4)
      .map(match => ({
        id: `${noteId}-${match.noteId}-semantic`,
        sourceId: noteId,
        targetId: match.noteId.toString(),
        type: RelationshipType.SEMANTIC,
        strength: match.similarity,
        context: match.reasoning,
        confidence: match.similarity,
        discoveredAt: new Date(),
        lastVerified: new Date()
      }));
  }

  /**
   * Find temporal relationships based on time references and patterns
   */
  private async findTemporalRelationships(
    noteId: string,
    content: string,
    allNotes: any[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    try {
      const timeAnalysis = await this.analyzeTemporalContent(content);
      
      if (timeAnalysis.hasTimeReferences) {
        // Find notes with similar time patterns
        const timeRelatedNotes = allNotes.filter(note => {
          if (note.id.toString() === noteId) return false;
          return this.hasTemporalOverlap(timeAnalysis, note);
        });

        timeRelatedNotes.forEach(note => {
          relationships.push({
            id: `${noteId}-${note.id}-temporal`,
            sourceId: noteId,
            targetId: note.id.toString(),
            type: RelationshipType.TEMPORAL,
            strength: 0.7,
            context: `Shares temporal context with note ${note.id}`,
            confidence: 0.8,
            discoveredAt: new Date(),
            lastVerified: new Date()
          });
        });
      }
    } catch (error) {
      console.error('Temporal relationship analysis failed:', error);
    }

    return relationships;
  }

  /**
   * Detect update relationships (when content modifies existing notes)
   */
  private async detectUpdateRelationships(
    noteId: string,
    content: string,
    semanticMatches: SemanticSearchResult[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    // Look for high-similarity matches that might be updates
    const potentialUpdates = semanticMatches.filter(match => 
      match.similarity > 0.8 && this.hasUpdateSignals(content)
    );

    for (const match of potentialUpdates) {
      const updateAnalysis = await this.analyzeUpdateRelationship(content, match.content);
      
      if (updateAnalysis.isUpdate) {
        relationships.push({
          id: `${noteId}-${match.noteId}-update`,
          sourceId: noteId,
          targetId: match.noteId.toString(),
          type: RelationshipType.UPDATE,
          strength: updateAnalysis.confidence,
          context: updateAnalysis.reasoning,
          confidence: updateAnalysis.confidence,
          discoveredAt: new Date(),
          lastVerified: new Date()
        });
      }
    }

    return relationships;
  }

  /**
   * Find causal relationships (cause and effect connections)
   */
  private async findCausalRelationships(
    noteId: string,
    content: string,
    semanticMatches: SemanticSearchResult[]
  ): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    try {
      const causalSignals = this.detectCausalSignals(content);
      
      if (causalSignals.hasCausalLanguage) {
        const relevantMatches = semanticMatches.filter(match => match.similarity > 0.5);
        
        for (const match of relevantMatches) {
          const causalAnalysis = await this.analyzeCausalRelationship(content, match.content);
          
          if (causalAnalysis.hasCausalConnection) {
            relationships.push({
              id: `${noteId}-${match.noteId}-causal`,
              sourceId: noteId,
              targetId: match.noteId.toString(),
              type: causalAnalysis.direction === 'forward' ? RelationshipType.TRIGGERS : RelationshipType.DEPENDS_ON,
              strength: causalAnalysis.strength,
              context: causalAnalysis.explanation,
              confidence: causalAnalysis.confidence,
              discoveredAt: new Date(),
              lastVerified: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error('Causal relationship analysis failed:', error);
    }

    return relationships;
  }

  /**
   * Build relationship graph for visualization and analysis
   */
  buildRelationshipGraph(noteIds: string[]): RelationshipGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processedNodes = new Set<string>();

    // Build nodes and edges from relationships
    noteIds.forEach(noteId => {
      const noteRelationships = this.relationships.get(noteId) || [];
      
      // Add source node if not already processed
      if (!processedNodes.has(noteId)) {
        nodes.push({
          id: noteId,
          type: 'note',
          label: `Note ${noteId}`,
          weight: noteRelationships.length,
          metadata: { relationshipCount: noteRelationships.length }
        });
        processedNodes.add(noteId);
      }

      // Add relationships as edges
      noteRelationships.forEach(rel => {
        // Add target node if not already processed
        if (!processedNodes.has(rel.targetId)) {
          nodes.push({
            id: rel.targetId,
            type: 'note',
            label: `Note ${rel.targetId}`,
            weight: 1,
            metadata: {}
          });
          processedNodes.add(rel.targetId);
        }

        // Add edge
        edges.push({
          source: rel.sourceId,
          target: rel.targetId,
          type: rel.type,
          weight: rel.strength,
          metadata: {
            context: rel.context,
            confidence: rel.confidence,
            discoveredAt: rel.discoveredAt
          }
        });
      });
    });

    // Identify clusters
    const clusters = this.identifyClusters(nodes, edges);

    return { nodes, edges, clusters };
  }

  /**
   * Get relationships for a specific note
   */
  getRelationships(noteId: string): Relationship[] {
    return this.relationships.get(noteId) || [];
  }

  /**
   * Find strongest relationships across all notes
   */
  getStrongestRelationships(limit: number = 10): Relationship[] {
    const allRelationships: Relationship[] = [];
    
    this.relationships.forEach(relationships => {
      allRelationships.push(...relationships);
    });

    return allRelationships
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * Private helper methods
   */

  private async analyzeTemporalContent(content: string): Promise<any> {
    const timePatterns = [
      /\b(?:today|tomorrow|yesterday)\b/i,
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i,
      /\b(?:next|last)\s+(?:week|month|year)\b/i
    ];

    const hasTimeReferences = timePatterns.some(pattern => pattern.test(content));
    
    return {
      hasTimeReferences,
      timeReferences: content.match(/\b(?:\d{1,2}:\d{2}|\w+day)\b/gi) || []
    };
  }

  private hasTemporalOverlap(timeAnalysis: any, note: any): boolean {
    // Simple overlap detection - can be enhanced
    return timeAnalysis.timeReferences.some((timeRef: string) => 
      note.content.toLowerCase().includes(timeRef.toLowerCase())
    );
  }

  private hasUpdateSignals(content: string): boolean {
    const updateSignals = [
      /\b(?:update|change|modify|correct|fix)\b/i,
      /\b(?:actually|instead|rather)\b/i,
      /\b(?:new|latest|revised)\b/i
    ];

    return updateSignals.some(signal => signal.test(content));
  }

  private async analyzeUpdateRelationship(newContent: string, existingContent: string): Promise<any> {
    try {
      const prompt = `
Analyze if the new content is an update to the existing content.

EXISTING: "${existingContent}"
NEW: "${newContent}"

Determine:
1. Is this an update/modification?
2. Confidence level (0-1)
3. Type of update
4. Reasoning

OUTPUT JSON:
{
  "isUpdate": boolean,
  "confidence": number,
  "updateType": "correction|addition|replacement|enhancement",
  "reasoning": "explanation"
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return { isUpdate: false, confidence: 0, reasoning: 'Analysis failed' };
    }
  }

  private detectCausalSignals(content: string): any {
    const causalPatterns = [
      /\b(?:because|since|due to|caused by)\b/i,
      /\b(?:therefore|thus|consequently|as a result)\b/i,
      /\b(?:leads to|results in|triggers|enables)\b/i,
      /\b(?:if|when|after|before)\b.*\b(?:then|will|would)\b/i
    ];

    const hasCausalLanguage = causalPatterns.some(pattern => pattern.test(content));
    
    return {
      hasCausalLanguage,
      patterns: causalPatterns.filter(pattern => pattern.test(content))
    };
  }

  private async analyzeCausalRelationship(content1: string, content2: string): Promise<any> {
    try {
      const prompt = `
Analyze the causal relationship between these two pieces of content.

CONTENT 1: "${content1}"
CONTENT 2: "${content2}"

Determine:
1. Is there a causal connection?
2. Direction (which causes which)
3. Strength (0-1)
4. Explanation

OUTPUT JSON:
{
  "hasCausalConnection": boolean,
  "direction": "forward|backward|bidirectional",
  "strength": number,
  "confidence": number,
  "explanation": "reasoning"
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      return { hasCausalConnection: false, strength: 0, explanation: 'Analysis failed' };
    }
  }

  private identifyClusters(nodes: GraphNode[], edges: GraphEdge[]): NodeCluster[] {
    // Simple clustering based on relationship density
    const clusters: NodeCluster[] = [];
    const processedNodes = new Set<string>();

    nodes.forEach(node => {
      if (processedNodes.has(node.id)) return;

      const connectedNodes = this.findConnectedNodes(node.id, edges);
      if (connectedNodes.length >= 2) {
        clusters.push({
          id: `cluster-${clusters.length}`,
          nodes: [node.id, ...connectedNodes],
          theme: `Related content cluster ${clusters.length + 1}`,
          strength: connectedNodes.length,
          suggestedActions: [`Review cluster of ${connectedNodes.length + 1} related items`]
        });

        connectedNodes.forEach(nodeId => processedNodes.add(nodeId));
        processedNodes.add(node.id);
      }
    });

    return clusters;
  }

  private findConnectedNodes(nodeId: string, edges: GraphEdge[]): string[] {
    const connected = new Set<string>();
    
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      } else if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });

    return Array.from(connected);
  }
}