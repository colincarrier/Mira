/**
 * Intelligence-V2 Router - Fixed Implementation
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
    this.reasoningEngine = new RecursiveReasoningEngine(openaiClient);
    this.relationshipMapper = new RelationshipMapper(openaiClient);
  }

  /**
   * Main processing entry point with full intelligence-v2 capabilities
   */
  async processWithIntelligenceV2(
    input: IntelligenceV2Input,
    userContext?: any
  ): Promise<IntelligenceV2Result> {
    try {
      console.log('🧠 Processing with Intelligence-V2:', input.content.substring(0, 100));

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
        // Create basic fallback analysis
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
      }

      // 6. Map relationships for this content
      const noteId = input.id || 'temp';
      const relationships = await this.relationshipMapper.mapRelationships(
        noteId,
        input.content,
        allNotes
      );

      // 7. Update vectors if we have a valid note ID
      if (input.id && !isNaN(parseInt(input.id))) {
        try {
          await this.vectorEngine.updateNoteVectors(parseInt(input.id), input.content, storage);
        } catch (vectorError) {
          console.warn('Vector update failed:', (vectorError as Error).message);
        }
      } else {
        console.warn('Skipping vector update - invalid note ID:', input.id);
      }

      // 8. Generate proactive recommendations
      const proactiveRecommendations = recursiveAnalysis ? 
        this.reasoningEngine.generateProactiveRecommendations(recursiveAnalysis) : 
        { immediate: [], upcoming: [], strategic: [] };

      // 9. Extract traditional outputs for compatibility
      const traditionalOutputs = this.extractTraditionalOutputs(recursiveAnalysis);

      // 10. Build comprehensive result
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
        
        // Intelligence-v2 enhancements
        recursiveAnalysis: recursiveAnalysis || {} as RecursiveAnalysis,
        vectorSimilarities: semanticMatches.map(match => ({
          noteId: match.noteId,
          similarity: match.similarity,
          reasoning: match.reasoning
        })),
        relationshipInsights: relationships,
        proactiveRecommendations,
        
        // Traditional outputs
        ...traditionalOutputs,
        confidence: this.calculateOverallConfidence(recursiveAnalysis, semanticMatches),
        processingPath: this.determineProcessingPath(recursiveAnalysis),
        timestamp: new Date().toISOString(),
        classificationScores: this.generateClassificationScores(recursiveAnalysis)
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
      entities: this.extractEntities(analysis),
      suggestedLinks: [],
      nextSteps: this.extractNextSteps(analysis),
      microQuestions: this.extractMicroQuestions(analysis),
      fromTheWeb: [],
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

  private extractEntities(analysis: RecursiveAnalysis | null): Entity[] {
    if (!analysis?.immediateProcessing?.entities) {
      return [];
    }

    return analysis.immediateProcessing.entities.map(entity => ({
      name: entity,
      type: 'general',
      details: undefined
    }));
  }

  private extractNextSteps(analysis: RecursiveAnalysis | null): string[] {
    return analysis?.recursiveReasoning?.step1Anticipation?.potentialActions || [];
  }

  private extractMicroQuestions(analysis: RecursiveAnalysis | null): string[] {
    return analysis?.recursiveReasoning?.step1Anticipation?.followUpQuestions || [];
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
}