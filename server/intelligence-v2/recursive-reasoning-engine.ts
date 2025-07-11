/**
 * Intelligence-V2 Recursive Reasoning Engine
 * Implements sophisticated 2-3 step ahead thinking for proactive intelligence
 */

import { VectorEngine, SemanticSearchResult } from './vector-engine.js';

export interface RecursiveAnalysis {
  immediateProcessing: {
    understanding: string;
    entities: Entity[];
    intent: string;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    complexity: number;
    temporalAnalysis: TemporalAnalysis;
  };
  recursiveReasoning: {
    step1Anticipation: StepProjection;
    step2Projection: StepProjection;
    step3Implications: StepProjection;
  };
  contextualIntelligence: {
    crossReferences: CrossReference[];
    patternRecognition: string;
    anomalyDetection: string;
    knowledgeGaps: string[];
    unexpectedConnections: UnexpectedConnection[];
  };
  proactiveDelivery: {
    surfaceImmediately: ProactiveAction[];
    prepareForLater: ProactiveAction[];
    suggestedActions: SuggestedAction[];
    preventiveMeasures: PreventiveMeasure[];
    optimizationSuggestions: OptimizationSuggestion[];
  };
}

export interface Entity {
  name: string;
  type: string;
  relevance: number;
  relationships: string[];
}

export interface TemporalAnalysis {
  explicitTimes: TimeReference[];
  implicitUrgency: string;
  deadlineImplications: string;
  recurringPatterns: string;
}

export interface TimeReference {
  text: string;
  parsed: string;
  confidence: number;
  precision: 'exact' | 'approximate' | 'relative';
}

export interface StepProjection {
  likelyNextNeeds: string[];
  followUpQuestions: string[];
  requiredInformation: string[];
  potentialActions: string[];
  cascadingEffects?: string[];
  optimizationOpportunities?: string[];
  longTermValue?: string;
  learningOpportunities?: string[];
}

export interface CrossReference {
  contentId: string;
  relationship: string;
  strength: number;
  reasoning: string;
}

export interface UnexpectedConnection {
  connection: string;
  value: string;
  confidence: number;
}

export interface ProactiveAction {
  contentId?: string;
  reason: string;
  timing: string;
}

export interface SuggestedAction {
  action: string;
  reasoning: string;
  priority: number;
}

export interface PreventiveMeasure {
  risk: string;
  prevention: string;
  urgency: string;
}

export interface OptimizationSuggestion {
  area: string;
  suggestion: string;
  impact: string;
}

export class RecursiveReasoningEngine {
  private vectorEngine: VectorEngine;
  private openai: any;

  constructor(openaiClient: any, vectorEngine: VectorEngine) {
    this.openai = openaiClient;
    this.vectorEngine = vectorEngine;
  }

  /**
   * Perform comprehensive recursive analysis of input
   */
  async performRecursiveAnalysis(
    input: string,
    userContext: any,
    relatedContent: SemanticSearchResult[],
    temporalContext: any
  ): Promise<RecursiveAnalysis> {
    try {
      const prompt = this.buildRecursivePrompt(input, userContext, relatedContent, temporalContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Enhance with vector-based insights
      const enhancedAnalysis = await this.enhanceWithVectorInsights(analysis, input, relatedContent);
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('Recursive reasoning analysis failed:', error);
      throw new Error('Failed to perform recursive analysis');
    }
  }

  /**
   * Build sophisticated prompt for recursive reasoning
   */
  private buildRecursivePrompt(
    input: string,
    userContext: any,
    relatedContent: SemanticSearchResult[],
    temporalContext: any
  ): string {
    return `
SYSTEM: You are Mira's Advanced Intelligence Core with recursive reasoning capabilities. Process this input thinking 2-3 steps ahead to anticipate user needs and deliver proactive intelligence.

CORE_DIRECTIVE: Think recursively - don't just process what the user said, anticipate what they'll need next and proactively prepare solutions.

ANALYSIS_FRAMEWORK:
1. IMMEDIATE_UNDERSTANDING:
   - Parse content with semantic depth
   - Extract entities, relationships, and implicit context
   - Classify intent with confidence scoring
   - Assess temporal urgency and complexity

2. RECURSIVE_REASONING (Critical - Think Ahead):
   Step 1 Projection: What will the user likely need next?
   Step 2 Projection: What follows after that?
   Step 3 Projection: What are the longer-term implications?

3. CONTEXTUAL_INTELLIGENCE:
   - Cross-reference with user's knowledge base
   - Identify patterns and anomalies
   - Find unexpected but valuable connections
   - Generate predictive insights

4. PROACTIVE_DELIVERY:
   - Surface relevant content before it's requested
   - Anticipate information needs
   - Suggest optimization opportunities
   - Identify and prevent potential issues

USER_INPUT: "${input}"
USER_CONTEXT: ${JSON.stringify(userContext)}
TEMPORAL_STATE: ${JSON.stringify(temporalContext)}
RELATED_CONTENT: ${JSON.stringify(relatedContent.slice(0, 5))}

PROCESSING_RULES:
- Think 2-3 steps ahead of user needs
- Connect disparate information intelligently
- Anticipate follow-up questions and actions
- Identify optimization opportunities proactively
- Surface unexpected but valuable insights
- Maintain temporal awareness and urgency sensitivity

REQUIRED_OUTPUT_STRUCTURE:
{
  "immediateProcessing": {
    "understanding": "Deep semantic comprehension",
    "entities": [{"name": "string", "type": "string", "relevance": 0.95, "relationships": []}],
    "intent": "primary_intent_with_confidence",
    "urgency": "critical|high|medium|low",
    "complexity": 1-10,
    "temporalAnalysis": {
      "explicitTimes": [{"text": "string", "parsed": "ISO_date", "confidence": 0.95, "precision": "exact|approximate|relative"}],
      "implicitUrgency": "assessment of time pressure",
      "deadlineImplications": "impact analysis",
      "recurringPatterns": "detected patterns"
    }
  },
  
  "recursiveReasoning": {
    "step1Anticipation": {
      "likelyNextNeeds": ["anticipated need 1", "anticipated need 2"],
      "followUpQuestions": ["question 1", "question 2"],
      "requiredInformation": ["info need 1", "info need 2"],
      "potentialActions": ["action 1", "action 2"],
      "cascadingEffects": ["effect 1", "effect 2"],
      "optimizationOpportunities": ["opportunity 1", "opportunity 2"],
      "longTermValue": "strategic value",
      "learningOpportunities": ["learning 1", "learning 2"]
    },
    "step2Projection": {
      "likelyNextNeeds": ["subsequent need 1", "subsequent need 2"],
      "followUpQuestions": ["follow-up question 1", "follow-up question 2"],
      "requiredInformation": ["future info need 1", "future info need 2"],
      "potentialActions": ["future action 1", "future action 2"],
      "cascadingEffects": ["effect 1", "effect 2"],
      "optimizationOpportunities": ["opportunity 1", "opportunity 2"],
      "longTermValue": "extended value",
      "learningOpportunities": ["learning 2", "learning 3"]
    },
    "step3Implications": {
      "likelyNextNeeds": ["long-term need 1", "long-term need 2"],
      "followUpQuestions": ["strategic question 1", "strategic question 2"],
      "requiredInformation": ["strategic info 1", "strategic info 2"],
      "potentialActions": ["strategic action 1", "strategic action 2"],
      "cascadingEffects": ["system effect 1", "system effect 2"],
      "optimizationOpportunities": ["strategic optimization 1", "strategic optimization 2"],
      "longTermValue": "transformational value",
      "learningOpportunities": ["strategic learning 1", "strategic learning 2"]
    }
  },
  
  "contextualIntelligence": {
    "crossReferences": [{"contentId": "string", "relationship": "string", "strength": 0.95, "reasoning": "why connected"}],
    "patternRecognition": "identified patterns and their significance",
    "anomalyDetection": "unusual aspects requiring attention",
    "knowledgeGaps": ["gap 1 with research suggestion", "gap 2 with action plan"],
    "unexpectedConnections": [{"connection": "string", "value": "why valuable", "confidence": 0.85}]
  },
  
  "proactiveDelivery": {
    "surface_immediately": [{"content_id": "string", "reason": "specific value proposition", "timing": "now"}],
    "prepare_for_later": [{"content_id": "string", "reason": "anticipated future need", "timing": "ISO_datetime"}],
    "suggested_actions": [{"action": "specific actionable step", "reasoning": "why this helps", "priority": 1-10}],
    "preventive_measures": [{"risk": "identified risk", "prevention": "specific prevention", "urgency": "high|medium|low"}],
    "optimization_suggestions": [{"area": "improvement area", "suggestion": "specific optimization", "impact": "expected benefit"}]
  }
}

CRITICAL: Focus on recursive reasoning - think ahead, anticipate needs, and deliver proactive value.
OUTPUT ONLY JSON:
`;
  }

  /**
   * Enhance analysis with vector-based insights
   */
  private async enhanceWithVectorInsights(
    analysis: any,
    input: string,
    relatedContent: SemanticSearchResult[]
  ): Promise<RecursiveAnalysis> {
    // Ensure contextualIntelligence structure exists with proper camelCase
    if (!analysis.contextualIntelligence) {
      analysis.contextualIntelligence = {
        crossReferences: [],
        patternRecognition: '',
        anomalyDetection: '',
        knowledgeGaps: [],
        unexpectedConnections: []
      };
    }

    // Add vector-based cross-references with safe property access
    const vectorCrossReferences = relatedContent.map(content => ({
      contentId: content.noteId?.toString() || 'unknown',
      relationship: content.reasoning || 'semantic_similarity',
      strength: content.similarity,
      reasoning: `Vector similarity: ${(content.similarity * 100).toFixed(1)}%`
    }));

    // Safely merge with existing cross-references
    analysis.contextualIntelligence.crossReferences = [
      ...(analysis.contextualIntelligence.crossReferences || []),
      ...vectorCrossReferences
    ].slice(0, 10);

    // Add pattern recognition insights
    if (relatedContent.length > 2) {
      analysis.contextualIntelligence.patternRecognition = 
        `Vector analysis reveals ${relatedContent.length} related items suggesting recurring themes.`;
    }

    return analysis as RecursiveAnalysis;
  }

  /**
   * Find unexpected semantic connections between content
   */
  private async findSemanticConnections(
    input: string,
    relatedContent: SemanticSearchResult[]
  ): Promise<UnexpectedConnection[]> {
    const connections: UnexpectedConnection[] = [];

    // Look for non-obvious but valuable connections
    for (const content of relatedContent.slice(0, 3)) {
      if (content.similarity > 0.4 && content.similarity < 0.7) {
        // Mid-range similarity might indicate unexpected connections
        connections.push({
          connection: `Semantic bridge between "${input}" and previous note "${content.content.substring(0, 50)}..."`,
          value: `Provides complementary perspective or background context`,
          confidence: content.similarity
        });
      }
    }

    return connections;
  }

  /**
   * Predict next user actions based on patterns
   */
  async predictNextActions(
    currentInput: string,
    userHistory: any[],
    analysis: RecursiveAnalysis
  ): Promise<string[]> {
    try {
      const prompt = `
SYSTEM: Predict the next 3 most likely actions this user will take based on their current input and historical patterns.

CURRENT_INPUT: "${currentInput}"
USER_PATTERNS: ${JSON.stringify(userHistory.slice(0, 10))}
ANALYSIS_CONTEXT: ${JSON.stringify(analysis.immediateProcessing)}

Provide 3 specific, actionable predictions of what the user will likely do next.
Consider their typical workflows, timing patterns, and context.

OUTPUT JSON:
{
  "predictions": [
    "specific action prediction 1",
    "specific action prediction 2", 
    "specific action prediction 3"
  ]
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const predictions = JSON.parse(response.choices[0].message.content);
      return predictions.predictions || [];
    } catch (error) {
      console.error('Action prediction failed:', error);
      return [];
    }
  }

  /**
   * Generate proactive recommendations based on recursive analysis
   */
  generateProactiveRecommendations(analysis: RecursiveAnalysis): {
    immediate: string[];
    upcoming: string[];
    strategic: string[];
  } {
    // Safe property access with comprehensive fallbacks
    if (!analysis) {
      return { immediate: [], upcoming: [], strategic: [] };
    }

    const immediate = analysis.proactiveDelivery?.suggestedActions
      ?.filter((action: any) => action.priority >= 8)
      ?.map((action: any) => action.action) || [];
    
    const upcoming = [
      ...(analysis.recursiveReasoning?.step1Anticipation?.potentialActions || []),
      ...(analysis.recursiveReasoning?.step2Projection?.potentialActions || [])
    ].slice(0, 5);
    
    const strategic = analysis.recursiveReasoning?.step3Implications?.potentialActions || [];

    return {
      immediate,
      upcoming,
      strategic
    };
  }

  /**
   * Assess the quality and confidence of recursive analysis
   */
  assessAnalysisQuality(analysis: RecursiveAnalysis): {
    overallConfidence: number;
    reasoningDepth: number;
    proactiveValue: number;
    recommendations: string[];
  } {
    // Calculate confidence based on various factors
    const entityConfidence = analysis.immediateProcessing?.entities
      ?.reduce((sum: number, entity: any) => sum + (entity.relevance || 0), 0) / (analysis.immediateProcessing?.entities?.length || 1) || 0;
    
    const crossReferenceStrength = analysis.contextualIntelligence?.crossReferences
      ?.reduce((sum: number, ref: any) => sum + (ref.strength || 0), 0) / (analysis.contextualIntelligence?.crossReferences?.length || 1) || 0;
    
    const reasoningDepth = 
      (analysis.recursiveReasoning?.step1Anticipation?.likelyNextNeeds?.length || 0) +
      (analysis.recursiveReasoning?.step2Projection?.likelyNextNeeds?.length || 0) +
      (analysis.recursiveReasoning?.step3Implications?.likelyNextNeeds?.length || 0);
    
    const proactiveValue = 
      (analysis.proactiveDelivery?.suggestedActions?.length || 0) +
      (analysis.proactiveDelivery?.preventiveMeasures?.length || 0) +
      (analysis.proactiveDelivery?.optimizationSuggestions?.length || 0);

    const overallConfidence = (entityConfidence + crossReferenceStrength) / 2;

    const recommendations = [];
    if (overallConfidence < 0.6) {
      recommendations.push("Consider gathering more context for higher confidence analysis");
    }
    if (reasoningDepth < 6) {
      recommendations.push("Recursive reasoning could be deeper - consider more projection steps");
    }
    if (proactiveValue < 3) {
      recommendations.push("Limited proactive value identified - explore more anticipatory suggestions");
    }

    return {
      overallConfidence,
      reasoningDepth,
      proactiveValue,
      recommendations
    };
  }
}