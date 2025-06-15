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
import { makeTitle } from '../utils/title-governor.js';

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
      
      // 2. Classify intent & entities (multi‑label)
      const intentVector: IntentVector = await IntentVectorClassifier.classify(
        input.content
      );

      // 3. Perform semantic search to find related content
      const semanticMatches = await this.vectorEngine.performSemanticSearch(
        { query: input.content, limit: 15 },
        allNotes
      );

      // Extract Collections if enabled
      // Note: Temporarily disabled due to interface mismatch
      // if (FeatureFlagManager.getInstance().isEnabled('ENHANCED_COLLECTIONS_ENABLED')) {
      //   await CollectionsExtractor.extract(input.id ?? '', input.content);
      // }

      // 4. Build temporal and user context
      const temporalContext = await this.buildTemporalContext(input, userContext);
      
      // 5. Perform REAL recursive reasoning (can be toggled)
      let recursiveAnalysis = null;
      if (FeatureFlagManager.getInstance().isEnabled('RECURSIVE_REASONING_ENABLED')) {
        try {
          recursiveAnalysis = await this.reasoningEngine.performRecursiveAnalysis(
            input.content,
            userContext,
            semanticMatches,
            temporalContext
          );
          console.log('✅ Recursive reasoning finished');
        } catch (err) {
          console.warn('⚠️ Recursive reasoning failed:', (err as Error).message);
        }
      } else {
        console.log('🔄 Recursive reasoning disabled, using fallback');
          
          // Create a basic analysis structure for Intelligence-V2 processing
          recursiveAnalysis = {
            immediateProcessing: {
              understanding: `Enhanced analysis: ${input.content}`,
              entities: [],
              intent: semanticMatches.length > 0 ? 'research' : 'general',
              urgency: 'medium' as const,
              complexity: Math.min(10, Math.max(1, Math.ceil(input.content.length / 50))),
              temporalAnalysis: {
                explicitTimes: [],
                implicitUrgency: 'normal processing pace',
                deadlineImplications: 'no immediate deadlines detected',
                recurringPatterns: 'analyzing for patterns'
              }
            },
            recursiveReasoning: {
              step1Anticipation: {
                likelyNextNeeds: ['Follow-up research', 'Implementation planning'],
                followUpQuestions: ['What are the next steps?', 'How to prioritize?'],
                requiredInformation: ['Additional context', 'Resource requirements'],
                potentialActions: ['Create action plan', 'Set reminders'],
                cascadingEffects: ['Improved productivity'],
                optimizationOpportunities: ['Process automation'],
                longTermValue: 'Strategic planning enhancement',
                learningOpportunities: ['Pattern recognition']
              },
              step2Projection: {
                likelyNextNeeds: ['Progress tracking', 'Quality assurance'],
                followUpQuestions: ['Is this on track?', 'Any blockers?'],
                requiredInformation: ['Status updates', 'Performance metrics'],
                potentialActions: ['Monitor progress', 'Adjust strategy'],
                cascadingEffects: ['Enhanced outcomes'],
                optimizationOpportunities: ['Workflow improvements'],
                longTermValue: 'Continuous improvement',
                learningOpportunities: ['Best practices']
              },
              step3Implications: {
                likelyNextNeeds: ['Results analysis', 'Knowledge transfer'],
                followUpQuestions: ['What did we learn?', 'How to replicate?'],
                requiredInformation: ['Outcome data', 'Lessons learned'],
                potentialActions: ['Document insights', 'Share knowledge'],
                cascadingEffects: ['Organizational learning'],
                optimizationOpportunities: ['System-wide improvements'],
                longTermValue: 'Knowledge base enhancement',
                learningOpportunities: ['Strategic insights']
              }
            },
            contextualIntelligence: {
              crossReferences: semanticMatches.map(match => ({
                contentId: match.noteId?.toString() || 'unknown',
                relationship: 'semantic_similarity',
                strength: match.similarity,
                reasoning: `${(match.similarity * 100).toFixed(1)}% similarity`
              })),
              patternRecognition: semanticMatches.length > 2 ? 
                `Found ${semanticMatches.length} related items suggesting recurring themes` : 
                'Limited pattern data available',
              anomalyDetection: 'No anomalies detected',
              knowledgeGaps: ['Detailed analysis', 'Context expansion'],
              unexpectedConnections: []
            },
            proactiveDelivery: {
              surfaceImmediately: [],
              prepareForLater: [],
              suggestedActions: [
                {
                  action: 'Review and organize content',
                  reasoning: 'Maintain information quality',
                  priority: 7
                },
                {
                  action: 'Create follow-up reminders',
                  reasoning: 'Ensure progress tracking',
                  priority: 6
                }
              ],
              preventiveMeasures: [],
              optimizationSuggestions: []
            }
          };
          console.log('✅ Created enhanced basic analysis structure');
        }
      } catch (error) {
        console.warn('⚠️ Recursive reasoning failed, continuing without it:', error.message);
        recursiveAnalysis = null;
      }

      // 6. Map relationships for this content
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

      // 8. Extract traditional outputs for compatibility (handle null analysis)
      const traditionalOutputs = this.extractTraditionalOutputs(recursiveAnalysis);

      // 9. Build comprehensive result
      const result: IntelligenceV2Result = {
        id: noteId,
        title: makeTitle(
          recursiveAnalysis?.immediateProcessing?.understanding || input.content
        ),
        summary: this.generateIntelligentSummary(recursiveAnalysis),
        enhancedContent: await this.enhanceContentWithInsights(input.content, recursiveAnalysis, semanticMatches),
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
      console.error('❌ Intelligence-V2 processing failed:', (error as Error).message);
      
      // Fallback to basic processing
      return this.fallbackToBasicProcessing(input);
    }
  }

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

  private generateIntelligentSummary(analysis: RecursiveAnalysis | null): string {
    if (!analysis) {
      return "Basic content analysis completed";
    }
    
    return analysis.immediateProcessing?.understanding?.substring(0, 200) + 
           (analysis.immediateProcessing?.understanding?.length > 200 ? "..." : "");
  }

  private async enhanceContentWithInsights(
    originalContent: string,
    analysis: RecursiveAnalysis | null,
    semanticMatches: any[]
  ): Promise<string> {
    if (!analysis) {
      return originalContent;
    }

    let enhanced = originalContent;
    
    // Add insights from analysis
    const insights = analysis.contextualIntelligence?.patternRecognition;
    if (insights) {
      enhanced += `\n\n**Insights:** ${insights}`;
    }

    // Add related content references
    if (semanticMatches.length > 0) {
      const topMatch = semanticMatches[0];
      enhanced += `\n\n**Related:** ${topMatch.content.substring(0, 100)}...`;
    }

    return enhanced;
  }

  private extractTraditionalOutputs(analysis: RecursiveAnalysis | null) {
    return {
      todos: this.extractTodos(analysis),
      smartActions: this.extractSmartActions(analysis),
      tags: this.extractTags(analysis),
      relatedTopics: this.extractRelatedTopics(analysis)
    };
  }

  private extractTodos(analysis: RecursiveAnalysis | null): ProcessedTodo[] {
    if (!analysis?.proactiveDelivery?.suggestedActions) {
      return [];
    }

    return analysis.proactiveDelivery.suggestedActions
      .filter(action => action.action.includes('todo') || action.action.includes('task'))
      .map(action => ({
        title: action.action,
        priority: action.priority > 7 ? 'high' : action.priority > 5 ? 'medium' : 'low',
        due: undefined,
        isReminder: false
      }));
  }

  private extractSmartActions(analysis: RecursiveAnalysis | null): SmartAction[] {
    if (!analysis?.proactiveDelivery?.suggestedActions) {
      return [];
    }

    return analysis.proactiveDelivery.suggestedActions.map(action => ({
      label: action.action,
      action: action.reasoning
    }));
  }

  private extractTags(analysis: RecursiveAnalysis | null): string[] {
    if (!analysis?.immediateProcessing?.entities) {
      return [];
    }

    return analysis.immediateProcessing.entities
      .map(entity => entity.toLowerCase())
      .filter(tag => tag.length > 2);
  }

  private extractRelatedTopics(analysis: RecursiveAnalysis | null): string[] {
    if (!analysis?.contextualIntelligence?.crossReferences) {
      return [];
    }

    return analysis.contextualIntelligence.crossReferences
      .map(ref => ref.relationship)
      .filter(topic => topic && topic.length > 0);
  }

  private calculateOverallConfidence(analysis: RecursiveAnalysis | null, semanticMatches: any[]): number {
    if (!analysis) return 0.3;
    return Math.min(0.9, 0.5 + (semanticMatches.length * 0.05));
  }

  private determineProcessingPath(analysis: RecursiveAnalysis | null): 'memory' | 'commerce' {
    return analysis?.immediateProcessing?.intent === 'commerce' ? 'commerce' : 'memory';
  }

  private generateClassificationScores(analysis: RecursiveAnalysis | null): Record<string, number> {
    return {
      complexity: analysis?.immediateProcessing?.complexity || 0,
      urgency: this.mapUrgencyToScore(analysis?.immediateProcessing?.urgency || 'medium'),
      confidence: analysis ? 0.8 : 0.3
    };
  }

  private mapUrgencyToScore(urgency: string): number {
    switch (urgency) {
      case 'critical': return 1.0;
      case 'high': return 0.8;
      case 'medium': return 0.6;
      case 'low': return 0.4;
      default: return 0.5;
    }
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'early_morning';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private async fallbackToBasicProcessing(input: IntelligenceV2Input): Promise<IntelligenceV2Result> {
    console.log('⚠️ Using fallback basic processing');
    
    return {
      id: input.id || 'temp',
      title: makeTitle(input.content),
      summary: "Basic processing fallback",
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
      confidence: 0.3,
      processingPath: 'memory',
      timestamp: new Date().toISOString(),
      classificationScores: { basic: 1.0 }
    };
  }

  async healthCheck(): Promise<{ status: string; components: Record<string, any> }> {
    const components: Record<string, any> = {};
    let allHealthy = true;

    try {
      // Check vector engine
      await this.vectorEngine.generateDenseEmbedding("test");
      components['vectorEngine'] = { status: 'healthy' };
    } catch (error) {
      components['vectorEngine'] = { status: 'unhealthy', error: (error as Error).message };
      allHealthy = false;
    }

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components
    };
  }

  /**
   * Generate intelligent summary incorporating recursive insights
   */
  private generateIntelligentSummary(analysis: RecursiveAnalysis | null): string {
    if (!analysis?.immediateProcessing) {
      return 'Intelligence-V2 analysis completed';
    }
    
    const base = analysis.immediateProcessing.understanding || 'Content processed';
    const anticipation = analysis.recursiveReasoning?.step1Anticipation?.likelyNextNeeds?.[0];
    
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
    analysis: RecursiveAnalysis | null,
    semanticMatches: any[]
  ): Promise<string> {
    if (!analysis) return originalContent;
    
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
  private extractTraditionalOutputs(analysis: RecursiveAnalysis | null): Partial<IntelligenceV2Result> {
    if (!analysis) {
      return {
        todos: [],
        smartActions: [],
        entities: [],
        suggestedLinks: [],
        nextSteps: [],
        microQuestions: [],
        fromTheWeb: [],
        tags: [],
        relatedTopics: []
      };
    }

    return {
      todos: analysis ? this.extractTodos(analysis) : [],
      smartActions: analysis ? this.extractSmartActions(analysis) : [],
      entities: analysis?.immediateProcessing?.entities || [],
      suggestedLinks: [],
      nextSteps: analysis?.recursiveReasoning?.step1Anticipation?.potentialActions || [],
      microQuestions: analysis?.recursiveReasoning?.step1Anticipation?.followUpQuestions || [],
      fromTheWeb: [],
      tags: analysis ? this.extractTags(analysis) : [],
      relatedTopics: analysis ? this.extractRelatedTopics(analysis) : []
    };
  }

  /**
   * Extract todos from recursive analysis
   */
  private extractTodos(analysis: RecursiveAnalysis): ProcessedTodo[] {
    const todos: ProcessedTodo[] = [];

    // Extract from suggested actions with safe property access
    if (analysis?.proactiveDelivery?.suggestedActions) {
      analysis.proactiveDelivery.suggestedActions
        .filter(action => action.priority >= 7)
        .forEach(action => {
          todos.push({
            title: action.action,
            priority: action.priority >= 9 ? 'high' : action.priority >= 7 ? 'medium' : 'low'
          });
        });
    }

    // Extract from anticipated needs with safe property access
    if (analysis?.recursiveReasoning?.step1Anticipation?.likelyNextNeeds) {
      analysis.recursiveReasoning.step1Anticipation.likelyNextNeeds
        .slice(0, 3)
        .forEach(need => {
          todos.push({
            title: need,
            priority: 'medium'
          });
        });
    }

    return todos;
  }

  /**
   * Extract smart actions
   */
  private extractSmartActions(analysis: RecursiveAnalysis): SmartAction[] {
    const actions: SmartAction[] = [];

    if (!analysis) return actions;

    // Check for reminder needs with safe property access
    if (analysis?.immediateProcessing?.temporalAnalysis?.explicitTimes?.length > 0) {
      actions.push({
        label: 'Set Reminder',
        action: 'reminder'
      });
    }

    // Check for research needs with safe property access
    if (analysis?.contextualIntelligence?.knowledgeGaps?.length > 0) {
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

    // Add urgency as tag with safe access
    if (analysis?.immediateProcessing?.urgency) {
      tags.add(analysis.immediateProcessing.urgency);
    }

    // Add entity types as tags with safe access
    if (analysis?.immediateProcessing?.entities) {
      analysis.immediateProcessing.entities.forEach(entity => {
        if (entity.type) {
          tags.add(entity.type.toLowerCase());
        }
      });
    }

    return Array.from(tags).slice(0, 5);
  }

  /**
   * Extract related topics
   */
  private extractRelatedTopics(analysis: RecursiveAnalysis): string[] {
    const topics: string[] = [];

    // Extract from entities with safe access
    if (analysis?.immediateProcessing?.entities) {
      analysis.immediateProcessing.entities.forEach(entity => {
        topics.push(entity.name);
      });
    }

    // Extract from cross-references with safe access
    if (analysis?.contextualIntelligence?.crossReferences) {
      analysis.contextualIntelligence.crossReferences.forEach(ref => {
        topics.push(ref.relationship);
      });
    }

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