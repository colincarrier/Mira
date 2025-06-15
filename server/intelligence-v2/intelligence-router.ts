/**
 * Intelligence-V2 Router
 * Main entry point for enhanced recursive reasoning and vector-based intelligence
 */

import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine, RecursiveAnalysis } from './recursive-reasoning-engine.js';
import { RelationshipMapper } from './relationship-mapper.js';
import { IntentVectorClassifier, type IntentVector } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FeatureFlagManager } from './feature-flags.js';
import { storage } from '../storage.js';

export interface IntelligenceV2Input {
  id?: string;
  content: string;
  mode: "text" | "voice" | "image" | "file";
  context?: {
    source?: string;
    location?: any;
    previousConversation?: any;
  };
  userId?: string;
  timestamp?: string;
}

export interface IntelligenceV2Result {
  // Core processing results
  id: string;
  title: string;
  summary: string;
  enhancedContent: string;
  intent: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  
  // Intelligence-v2 enhancements
  recursiveAnalysis: RecursiveAnalysis;
  vectorSimilarities: Array<{ noteId: number; similarity: number; reasoning: string }>;
  relationshipInsights: Array<{ type: string; target: string; strength: number; context: string }>;
  proactiveRecommendations: {
    immediate: string[];
    upcoming: string[];
    strategic: string[];
  };
  
  // Traditional outputs for compatibility
  todos: ProcessedTodo[];
  smartActions: SmartAction[];
  entities: Entity[];
  suggestedLinks: Link[];
  nextSteps: string[];
  microQuestions: string[];
  fromTheWeb: WebResult[];
  tags: string[];
  relatedTopics: string[];
  confidence: number;
  processingPath: 'memory' | 'commerce';
  timestamp: string;
  classificationScores: Record<string, number>;
}

interface ProcessedTodo {
  title: string;
  priority: string;
  due?: string;
  isReminder?: boolean;
  reminderType?: string;
  notificationStructure?: any;
}

interface SmartAction {
  label: string;
  action: string;
}

interface Entity {
  name: string;
  type: string;
  details?: string;
}

interface Link {
  title: string;
  url: string;
  type: string;
}

interface WebResult {
  title: string;
  snippet: string;
  url: string;
  relevance: number;
}

export class IntelligenceV2Router {
  private vectorEngine: VectorEngine;
  private reasoningEngine: RecursiveReasoningEngine;
  private relationshipMapper: RelationshipMapper;
  private openai: any;

  constructor(openaiClient: any) {
    this.openai = openaiClient;
    this.vectorEngine = new VectorEngine(openaiClient);
    this.reasoningEngine = new RecursiveReasoningEngine(openaiClient, this.vectorEngine);
    this.relationshipMapper = new RelationshipMapper(openaiClient, this.vectorEngine);
  }

  /**
   * Main processing entry point with full intelligence-v2 capabilities
   */
  async processWithIntelligenceV2(
    input: IntelligenceV2Input,
    storage: any,
    userContext?: any
  ): Promise<IntelligenceV2Result> {
    try {
      console.log('🧠 Intelligence-V2 processing started for:', input.content.substring(0, 50));

      // 1. Get existing notes for context
      const allNotes = await storage.getAllNotes();
      
      // 2. Perform semantic search to find related content
      const semanticMatches = await this.vectorEngine.performSemanticSearch(
        { query: input.content, limit: 15 },
        allNotes
      );

      // 3. Build temporal and user context
      const temporalContext = await this.buildTemporalContext(input, userContext);
      
      // 4. Perform recursive reasoning analysis with error handling
      let recursiveAnalysis = null;
      try {
        if (true) { // Skip feature flag check for now
          recursiveAnalysis = await this.reasoningEngine.performRecursiveAnalysis(
            input.content,
            userContext || {},
            semanticMatches,
            temporalContext
          );
          console.log('✅ Recursive analysis completed successfully');
        } else {
          console.log('🔄 Recursive reasoning disabled, using basic analysis');
        }
      } catch (error) {
        console.warn('⚠️ Recursive reasoning failed, continuing without it:', error.message);
        recursiveAnalysis = null;
      }

      // 5. Map relationships for this content
      const noteId = input.id || 'temp';
      const relationships = await this.relationshipMapper.mapRelationships(
        noteId,
        input.content,
        allNotes,
        storage
      );

      // 6. Generate vector embeddings for future searches
      const numericNoteId = input.id ? parseInt(input.id) : null;
      if (numericNoteId && !isNaN(numericNoteId)) {
        try {
          await this.vectorEngine.updateNoteVectors(
            numericNoteId,
            input.content,
            storage
          );
          console.log('Updated vectors for note', numericNoteId);
        } catch (error) {
          console.warn('Vector update failed for note', numericNoteId, ':', error.message);
          // Continue processing even if vector update fails
        }
      } else {
        console.warn('Skipping vector update - invalid note ID:', input.id);
      }

      // 7. Generate proactive recommendations - handle empty analysis gracefully
      const proactiveRecommendations = recursiveAnalysis ? 
        this.reasoningEngine.generateProactiveRecommendations(recursiveAnalysis) : 
        { immediate: [], upcoming: [], strategic: [] };

      // 8. Extract traditional outputs for compatibility
      const traditionalOutputs = this.extractTraditionalOutputs(recursiveAnalysis || null);

      // 9. Build comprehensive result
      const result: IntelligenceV2Result = {
        id: noteId,
        title: recursiveAnalysis?.immediateProcessing?.understanding?.substring(0, 50) + (recursiveAnalysis?.immediateProcessing?.understanding?.length > 50 ? '...' : '') || input.content.substring(0, 50),
        summary: this.generateIntelligentSummary(recursiveAnalysis || null),
        enhancedContent: await this.enhanceContentWithInsights(input.content, recursiveAnalysis || null, semanticMatches),
        intent: recursiveAnalysis?.immediateProcessing?.intent || 'general',
        urgency: recursiveAnalysis?.immediateProcessing?.urgency || 'medium',
        complexity: recursiveAnalysis?.immediateProcessing?.complexity || 3,
        
        // Intelligence-v2 specific
        recursiveAnalysis: recursiveAnalysis || {},
        vectorSimilarities: semanticMatches.map(match => ({
          noteId: match.noteId,
          similarity: match.similarity,
          reasoning: match.reasoning
        })),
        relationshipInsights: relationships.map(rel => ({
          type: rel.type,
          target: rel.targetId,
          strength: rel.strength,
          context: rel.context
        })),
        proactiveRecommendations,
        
        // Traditional compatibility - ensure all required fields
        todos: traditionalOutputs.todos || [],
        smartActions: traditionalOutputs.smartActions || [],
        entities: traditionalOutputs.entities || [],
        suggestedLinks: traditionalOutputs.suggestedLinks || [],
        nextSteps: traditionalOutputs.nextSteps || [],
        microQuestions: traditionalOutputs.microQuestions || [],
        fromTheWeb: traditionalOutputs.fromTheWeb || [],
        tags: traditionalOutputs.tags || [],
        relatedTopics: traditionalOutputs.relatedTopics || [],
        confidence: this.calculateOverallConfidence(recursiveAnalysis || null, semanticMatches),
        processingPath: this.determineProcessingPath(recursiveAnalysis || null),
        timestamp: new Date().toISOString(),
        classificationScores: this.generateClassificationScores(recursiveAnalysis || null)
      };

      console.log('✅ Intelligence-V2 processing completed with', semanticMatches.length, 'semantic matches and', relationships.length, 'relationships');
      
      return result;

    } catch (error) {
      console.error('❌ Intelligence-V2 processing failed:', error);
      
      // Fallback to basic processing
      return this.fallbackToBasicProcessing(input);
    }
  }

  /**
   * Build temporal context for analysis
   */
  private async buildTemporalContext(input: IntelligenceV2Input, userContext?: any): Promise<any> {
    const now = new Date();
    
    return {
      currentTime: now.toISOString(),
      timeOfDay: this.getTimeOfDay(now),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      userTimezone: userContext?.timezone || 'UTC',
      recentActivity: userContext?.recentActivity || [],
      upcomingEvents: userContext?.upcomingEvents || []
    };
  }

  /**
   * Generate intelligent summary incorporating recursive insights
   */
  private generateIntelligentSummary(analysis: RecursiveAnalysis): string {
    const base = analysis.immediateProcessing.understanding;
    const anticipation = analysis.recursiveReasoning.step1Anticipation.likelyNextNeeds[0];
    
    if (anticipation) {
      return `${base}. Anticipating: ${anticipation}`;
    }
    
    return base;
  }

  /**
   * Enhance content with insights from analysis
   */
  private async enhanceContentWithInsights(
    originalContent: string,
    analysis: RecursiveAnalysis,
    semanticMatches: any[]
  ): Promise<string> {
    let enhanced = originalContent;

    // Add proactive insights
    const insights = analysis.proactiveDelivery.suggestedActions
      .slice(0, 2)
      .map(action => `💡 ${action.action}`)
      .join('\n');

    if (insights) {
      enhanced += `\n\n${insights}`;
    }

    // Add related content suggestions
    if (semanticMatches.length > 0) {
      const topMatch = semanticMatches[0];
      if (topMatch.similarity > 0.7) {
        enhanced += `\n\n🔗 Related: ${topMatch.reasoning}`;
      }
    }

    return enhanced;
  }

  /**
   * Extract traditional outputs for backward compatibility
   */
  private extractTraditionalOutputs(analysis: RecursiveAnalysis): Partial<IntelligenceV2Result> {
    return {
      todos: this.extractTodos(analysis),
      smartActions: this.extractSmartActions(analysis),
      entities: analysis.immediateProcessing.entities,
      suggestedLinks: [],
      nextSteps: analysis.recursiveReasoning.step1Anticipation.potentialActions,
      microQuestions: analysis.recursiveReasoning.step1Anticipation.followUpQuestions,
      fromTheWeb: [],
      tags: this.extractTags(analysis),
      relatedTopics: this.extractRelatedTopics(analysis)
    };
  }

  /**
   * Extract todos from recursive analysis
   */
  private extractTodos(analysis: RecursiveAnalysis): ProcessedTodo[] {
    const todos: ProcessedTodo[] = [];

    // Extract from suggested actions
    analysis.proactiveDelivery.suggestedActions
      .filter(action => action.priority >= 7)
      .forEach(action => {
        todos.push({
          title: action.action,
          priority: action.priority >= 9 ? 'high' : action.priority >= 7 ? 'medium' : 'low'
        });
      });

    // Extract from anticipated needs
    analysis.recursiveReasoning.step1Anticipation.likelyNextNeeds
      .slice(0, 3)
      .forEach(need => {
        todos.push({
          title: need,
          priority: 'medium'
        });
      });

    return todos;
  }

  /**
   * Extract smart actions
   */
  private extractSmartActions(analysis: RecursiveAnalysis): SmartAction[] {
    const actions: SmartAction[] = [];

    // Check for reminder needs
    if (analysis.immediateProcessing.temporalAnalysis.explicitTimes.length > 0) {
      actions.push({
        label: 'Set Reminder',
        action: 'reminder'
      });
    }

    // Check for research needs
    if (analysis.contextualIntelligence.knowledgeGaps.length > 0) {
      actions.push({
        label: 'Research Topic',
        action: 'research'
      });
    }

    return actions;
  }

  /**
   * Extract tags from analysis
   */
  private extractTags(analysis: RecursiveAnalysis): string[] {
    const tags = new Set<string>();

    // Add urgency as tag
    tags.add(analysis.immediateProcessing.urgency);

    // Add entity types as tags
    analysis.immediateProcessing.entities.forEach(entity => {
      if (entity.type) {
        tags.add(entity.type.toLowerCase());
      }
    });

    return Array.from(tags).slice(0, 5);
  }

  /**
   * Extract related topics
   */
  private extractRelatedTopics(analysis: RecursiveAnalysis): string[] {
    const topics: string[] = [];

    // Extract from entities
    analysis.immediateProcessing.entities.forEach(entity => {
      topics.push(entity.name);
    });

    // Extract from cross-references
    analysis.contextualIntelligence.crossReferences.forEach(ref => {
      topics.push(ref.relationship);
    });

    return topics.slice(0, 8);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    analysis: RecursiveAnalysis,
    semanticMatches: any[]
  ): number {
    const qualityAssessment = this.reasoningEngine.assessAnalysisQuality(analysis);
    const vectorConfidence = semanticMatches.length > 0 ? 
      semanticMatches.reduce((sum, match) => sum + match.similarity, 0) / semanticMatches.length : 0;
    
    return Math.min(1.0, (qualityAssessment.overallConfidence + vectorConfidence) / 2);
  }

  /**
   * Determine processing path
   */
  private determineProcessingPath(analysis: RecursiveAnalysis): 'memory' | 'commerce' {
    // Simple heuristic - can be enhanced
    const intent = analysis.immediateProcessing.intent.toLowerCase();
    
    if (intent.includes('buy') || intent.includes('purchase') || intent.includes('shop')) {
      return 'commerce';
    }
    
    return 'memory';
  }

  /**
   * Generate classification scores
   */
  private generateClassificationScores(analysis: RecursiveAnalysis): Record<string, number> {
    return {
      memory: this.determineProcessingPath(analysis) === 'memory' ? 0.8 : 0.2,
      commerce: this.determineProcessingPath(analysis) === 'commerce' ? 0.8 : 0.2,
      urgency: this.mapUrgencyToScore(analysis.immediateProcessing.urgency),
      complexity: analysis.immediateProcessing.complexity / 10
    };
  }

  /**
   * Map urgency to numeric score
   */
  private mapUrgencyToScore(urgency: string): number {
    switch (urgency) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.5;
      case 'low': return 0.2;
      default: return 0.3;
    }
  }

  /**
   * Get time of day
   */
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Fallback to basic processing if intelligence-v2 fails
   */
  private async fallbackToBasicProcessing(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
    console.log('⚠️ Falling back to basic processing');
    
    return {
      id: input.id || 'fallback',
      title: input.content.substring(0, 50),
      summary: 'Basic processing fallback',
      enhancedContent: input.content,
      intent: 'general',
      urgency: 'medium',
      complexity: 3,
      recursiveAnalysis: {} as RecursiveAnalysis,
      vectorSimilarities: [],
      relationshipInsights: [],
      proactiveRecommendations: { immediate: [], upcoming: [], strategic: [] },
      todos: [],
      smartActions: [],
      entities: [],
      suggestedLinks: [],
      nextSteps: [],
      microQuestions: [],
      fromTheWeb: [],
      tags: [],
      relatedTopics: [],
      confidence: 0.5,
      processingPath: 'memory',
      timestamp: new Date().toISOString(),
      classificationScores: { memory: 0.8, commerce: 0.2 }
    };
  }

  /**
   * Health check for intelligence-v2 components
   */
  async healthCheck(): Promise<{ status: string; components: Record<string, boolean> }> {
    const components = {
      vectorEngine: true,
      reasoningEngine: true,
      relationshipMapper: true,
      openaiConnection: false
    };

    try {
      // Test OpenAI connection
      await this.openai.models.list();
      components.openaiConnection = true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
    }

    const allHealthy = Object.values(components).every(status => status);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components
    };
  }
}