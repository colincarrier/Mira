# Mira AI Prompts & Intelligence Strategy
## Comprehensive Prompt Engineering Documentation

### Table of Contents
1. [AI Strategy Overview](#ai-strategy-overview)
2. [Prompt Engineering Framework](#prompt-engineering-framework)
3. [Model-Specific Implementations](#model-specific-implementations)
4. [Taxonomy Intelligence](#taxonomy-intelligence)
5. [Context-Aware Processing](#context-aware-processing)
6. [Performance Optimization](#performance-optimization)

---

## AI Strategy Overview

### Dual-Model Architecture Rationale

**OpenAI GPT-4o (Primary)**
- **Strengths**: Creative content generation, image analysis, structured JSON output
- **Use Cases**: Todo extraction, collection suggestions, creative enhancement
- **Response Format**: Structured JSON with consistent schema
- **Reliability**: 95% success rate for structured tasks

**Claude Sonnet 4 (Secondary)**
- **Strengths**: Deep contextual analysis, research capabilities, nuanced understanding
- **Use Cases**: Complex content analysis, predictive intelligence, research tasks
- **Response Format**: Rich text with embedded insights
- **Reliability**: 92% success rate for analytical tasks

### Intelligence Layering Strategy
```
Layer 1: Basic Processing (keyword extraction, simple categorization)
Layer 2: Contextual Analysis (intent classification, complexity scoring)
Layer 3: Predictive Intelligence (next steps, success factors, obstacles)
Layer 4: Learning Integration (user pattern recognition, personalization)
```

---

## Prompt Engineering Framework

### Core System Prompt Template
```
You are Mira, an intelligent memory assistant that helps users capture, process, and organize information. Your role is to:

1. ANALYZE content for complexity, intent, and urgency
2. EXTRACT actionable tasks with proper prioritization
3. SUGGEST appropriate organization and next steps
4. PROVIDE contextual insights and recommendations

RESPONSE REQUIREMENTS:
- Always respond in valid JSON format
- Include confidence scores (0.0-1.0) for suggestions
- Provide reasoning for classifications
- Suggest specific, actionable next steps
- Consider user context and patterns

CLASSIFICATION FRAMEWORK:
- Complexity: 1-10 scale (1=simple task, 10=complex multi-phase project)
- Intent: simple-task, complex-project, research-inquiry, personal-reflection, reference-material
- Urgency: low, medium, high, critical
- Collection: Based on content analysis and user patterns
```

### Content Analysis Prompt
```
Analyze this content comprehensively:

CONTENT ANALYSIS REQUIREMENTS:
1. Complexity Assessment (1-10 scale):
   - Consider scope, dependencies, time requirements
   - Account for skill level needed and resources required
   - Factor in potential complications or unknowns

2. Intent Classification:
   - simple-task: Single action, clear endpoint, < 30 minutes
   - complex-project: Multiple phases, dependencies, > 1 day
   - research-inquiry: Information gathering, analysis needed
   - personal-reflection: Thoughts, feelings, personal growth
   - reference-material: Facts, data, documentation

3. Urgency Determination:
   - critical: Deadline today, emergency, blocking others
   - high: This week, important deadline, high impact
   - medium: This month, scheduled work, moderate impact
   - low: Someday/maybe, low impact, flexible timing

4. Todo Extraction:
   - Identify ALL actionable items
   - Create logical sequence and dependencies
   - Estimate time requirements
   - Suggest optimal grouping

5. Collection Recommendation:
   - Analyze content theme and context
   - Consider existing user collections
   - Suggest icon and color based on content type
   - Provide confidence score

Content to analyze: {CONTENT}
```

### Predictive Intelligence Prompt
```
As Mira's predictive intelligence engine, analyze this content for future planning:

PREDICTIVE ANALYSIS FRAMEWORK:
1. Next Steps Identification:
   - What are the immediate next actions?
   - What preparation is needed before starting?
   - What decisions must be made first?
   - What information is still needed?

2. Success Factor Analysis:
   - What conditions increase likelihood of success?
   - What skills or knowledge gaps exist?
   - What resources would accelerate progress?
   - What external support might be helpful?

3. Obstacle Anticipation:
   - What typically goes wrong with this type of work?
   - What external dependencies could cause delays?
   - What personal patterns might interfere?
   - What contingency plans should be considered?

4. Time and Resource Estimation:
   - Realistic time requirements for completion
   - Breakdown by phases or major milestones
   - Buffer time for unexpected challenges
   - Resource requirements (tools, people, information)

5. Context Connection:
   - How does this relate to other user projects?
   - What skills from other areas apply here?
   - What synergies exist with current work?
   - What knowledge can be leveraged?

Content: {CONTENT}
User Context: {USER_PATTERNS}
```

---

## Model-Specific Implementations

### OpenAI GPT-4o Implementation

#### Structured Analysis Prompt
```typescript
const OPENAI_ANALYSIS_PROMPT = `
You are Mira's primary intelligence engine. Analyze the provided content and return a JSON response with this exact structure:

{
  "complexityScore": number (1-10),
  "intentType": "simple-task" | "complex-project" | "research-inquiry" | "personal-reflection" | "reference-material",
  "urgencyLevel": "low" | "medium" | "high" | "critical",
  "todos": string[],
  "taskHierarchy": [{
    "phase": string,
    "description": string,
    "tasks": string[],
    "estimatedTime": string,
    "dependencies": string[]
  }],
  "collectionSuggestion": {
    "name": string,
    "icon": string,
    "color": string,
    "reasoning": string,
    "confidence": number
  },
  "nextSteps": string[],
  "timeToComplete": string,
  "successFactors": string[],
  "potentialObstacles": string[]
}

ANALYSIS GUIDELINES:
- Be specific and actionable in todo extraction
- Consider realistic time estimates
- Provide clear reasoning for classifications
- Include confidence scores for suggestions
- Focus on practical next steps

Content to analyze: "{content}"
Mode: {mode}
`;
```

#### Creative Enhancement Prompt
```typescript
const OPENAI_CREATIVE_PROMPT = `
As Mira's creative intelligence, enhance this content while preserving the user's voice and intent:

ENHANCEMENT GOALS:
1. Improve clarity and structure
2. Add relevant context and connections
3. Suggest creative approaches or alternatives
4. Identify opportunities for expansion
5. Maintain authenticity and personal style

RESPONSE FORMAT:
{
  "enhancedContent": "improved version with better structure and clarity",
  "suggestions": ["specific improvement suggestions"],
  "creativeAlternatives": ["alternative approaches or perspectives"],
  "expansionOpportunities": ["areas that could be developed further"],
  "contextualConnections": ["related topics, ideas, or resources"]
}

Original content: "{content}"
Enhancement mode: {mode}
`;
```

### Claude Sonnet 4 Implementation

#### Deep Analysis Prompt
```typescript
const CLAUDE_DEEP_ANALYSIS_PROMPT = `
As Mira's deep intelligence engine, provide comprehensive contextual analysis of this content.

DEEP ANALYSIS FRAMEWORK:

1. CONTEXTUAL UNDERSTANDING:
   - What is the deeper meaning or significance?
   - What assumptions or context is implicit?
   - What broader themes or patterns are present?
   - How does this connect to larger goals or projects?

2. KNOWLEDGE MAPPING:
   - What domain knowledge is required?
   - What skills need to be developed or applied?
   - What resources or tools would be most helpful?
   - What experts or communities could provide support?

3. STRATEGIC THINKING:
   - What are the long-term implications?
   - How does this fit into bigger picture planning?
   - What strategic decisions need to be made?
   - What trade-offs or priorities should be considered?

4. RESEARCH INTELLIGENCE:
   - What questions should be investigated further?
   - What information would change the approach?
   - What data or evidence would be most valuable?
   - What alternative perspectives should be considered?

5. WISDOM SYNTHESIS:
   - What lessons from similar situations apply?
   - What mental models or frameworks are relevant?
   - What counterintuitive insights might be valuable?
   - What would an expert in this field recommend?

Content for analysis: "{content}"
User context: {userContext}
`;
```

#### Research Enhancement Prompt
```typescript
const CLAUDE_RESEARCH_PROMPT = `
As Mira's research intelligence, provide comprehensive research guidance and insights.

RESEARCH FRAMEWORK:

1. INFORMATION ARCHITECTURE:
   - What are the key research questions?
   - What information hierarchy should guide investigation?
   - What primary vs secondary sources are needed?
   - What validation methods should be used?

2. METHODOLOGY RECOMMENDATIONS:
   - What research approaches would be most effective?
   - What tools or platforms should be utilized?
   - What sequence of investigation would be optimal?
   - What documentation standards should be followed?

3. EXPERT INSIGHTS:
   - Who are the leading authorities in this area?
   - What organizations or institutions are relevant?
   - What publications or resources are essential?
   - What conferences or events provide learning opportunities?

4. CRITICAL ANALYSIS:
   - What biases or limitations should be considered?
   - What contradictory viewpoints exist?
   - What evidence would change current understanding?
   - What gaps in knowledge need to be addressed?

Research topic: "{content}"
Research depth: {depth}
Time constraints: {timeframe}
`;
```

---

## Taxonomy Intelligence

### Advanced Pattern Recognition

#### Content Categorization Engine
```typescript
export const ADVANCED_TAXONOMY_PATTERNS = {
  LEARNING_AND_DEVELOPMENT: {
    primaryKeywords: ['learn', 'study', 'understand', 'research', 'explore', 'master'],
    secondaryKeywords: ['course', 'book', 'tutorial', 'practice', 'skill', 'knowledge'],
    contextClues: ['how to', 'need to understand', 'want to learn', 'figure out'],
    microQuestions: [
      'What specific skills need development?',
      'What learning resources would be most effective?',
      'How will progress be measured and validated?',
      'What practical applications will reinforce learning?',
      'What timeframe is realistic for mastery?'
    ],
    suggestedActions: [
      'Create learning schedule with milestones',
      'Identify practice opportunities',
      'Find mentor or study group',
      'Set up progress tracking system'
    ],
    confidence: 0.87
  },
  
  PROJECT_MANAGEMENT: {
    primaryKeywords: ['project', 'deadline', 'milestone', 'deliverable', 'timeline', 'scope'],
    secondaryKeywords: ['team', 'stakeholder', 'budget', 'resource', 'risk', 'dependency'],
    contextClues: ['need to complete', 'working on', 'responsible for', 'coordinating'],
    microQuestions: [
      'What are the critical path dependencies?',
      'Who are the key stakeholders and decision makers?',
      'What risks could derail this project?',
      'What resources are required vs available?',
      'How will success be measured?'
    ],
    suggestedActions: [
      'Create detailed project timeline',
      'Identify and engage stakeholders',
      'Develop risk mitigation strategies',
      'Set up regular progress reviews'
    ],
    confidence: 0.92
  },
  
  CREATIVE_WORK: {
    primaryKeywords: ['design', 'create', 'brainstorm', 'concept', 'inspiration', 'artistic'],
    secondaryKeywords: ['visual', 'aesthetic', 'style', 'mood', 'theme', 'expression'],
    contextClues: ['want to create', 'designing', 'artistic vision', 'creative process'],
    microQuestions: [
      'What creative constraints or parameters exist?',
      'How will creative decisions be validated?',
      'What references or inspiration guide this work?',
      'What feedback mechanisms will improve the outcome?',
      'What technical skills need development?'
    ],
    suggestedActions: [
      'Gather reference materials and inspiration',
      'Create mood boards or style guides',
      'Plan iterative feedback cycles',
      'Set up creative workspace and tools'
    ],
    confidence: 0.84
  },
  
  PROBLEM_SOLVING: {
    primaryKeywords: ['problem', 'issue', 'challenge', 'solution', 'fix', 'resolve'],
    secondaryKeywords: ['error', 'bug', 'troubleshoot', 'debug', 'investigate', 'analyze'],
    contextClues: ['not working', 'having trouble', 'need to solve', 'figure out why'],
    microQuestions: [
      'What is the root cause of this problem?',
      'What solutions have been tried already?',
      'What constraints limit possible solutions?',
      'What expertise or resources could help?',
      'How can similar problems be prevented?'
    ],
    suggestedActions: [
      'Document problem symptoms and context',
      'Research similar problems and solutions',
      'Consult relevant experts or communities',
      'Plan systematic troubleshooting approach'
    ],
    confidence: 0.89
  }
};
```

#### Context-Aware Classification
```typescript
export async function analyzeContentTaxonomy(
  content: string, 
  userHistory?: string[], 
  currentContext?: string
): Promise<TaxonomyAnalysis> {
  
  // Multi-layer analysis
  const keywordAnalysis = analyzeKeywords(content);
  const semanticAnalysis = await analyzeSemantics(content);
  const contextualAnalysis = analyzeContext(content, userHistory, currentContext);
  
  // Weighted scoring
  const categoryScores = calculateCategoryScores({
    keywords: keywordAnalysis,
    semantics: semanticAnalysis,
    context: contextualAnalysis
  });
  
  // Select best match with confidence threshold
  const bestMatch = selectBestCategory(categoryScores, 0.7);
  
  return {
    category: bestMatch.category,
    confidence: bestMatch.confidence,
    microQuestions: generateMicroQuestions(bestMatch, content),
    suggestedFollowUps: generateFollowUps(bestMatch, content),
    contextualInsights: generateInsights(bestMatch, content, userHistory)
  };
}
```

### Micro-Question Generation

#### Dynamic Question Creation
```typescript
export function generateMicroQuestions(
  category: TaxonomyCategory,
  content: string,
  userContext?: UserContext
): string[] {
  
  const baseQuestions = category.microQuestions;
  const contextualQuestions = generateContextualQuestions(content, category);
  const personalizedQuestions = generatePersonalizedQuestions(userContext, category);
  
  // Combine and prioritize
  const allQuestions = [
    ...baseQuestions,
    ...contextualQuestions,
    ...personalizedQuestions
  ];
  
  // Select most relevant 3-5 questions
  return prioritizeQuestions(allQuestions, content, 5);
}

function generateContextualQuestions(content: string, category: TaxonomyCategory): string[] {
  const questions: string[] = [];
  
  // Extract specific entities and generate targeted questions
  const entities = extractEntities(content);
  
  if (entities.timeframes.length > 0) {
    questions.push(`How does the ${entities.timeframes[0]} timeline affect your approach?`);
  }
  
  if (entities.people.length > 0) {
    questions.push(`How will ${entities.people[0]} be involved in this process?`);
  }
  
  if (entities.tools.length > 0) {
    questions.push(`Are there alternatives to ${entities.tools[0]} worth considering?`);
  }
  
  return questions;
}
```

---

## Context-Aware Processing

### User Pattern Recognition

#### Behavioral Learning Framework
```typescript
interface UserPattern {
  workingHours: { start: number; end: number };
  productivityPeaks: number[];
  preferredTaskDuration: number;
  commonObstacles: string[];
  successfulApproaches: string[];
  energyLevels: { time: number; level: number }[];
  contextSwitchingTolerance: number;
}

export async function analyzeUserPatterns(
  userHistory: UserAction[],
  timeframe: number = 30 // days
): Promise<UserPattern> {
  
  const recentHistory = filterRecentHistory(userHistory, timeframe);
  
  return {
    workingHours: extractWorkingHours(recentHistory),
    productivityPeaks: identifyProductivityPeaks(recentHistory),
    preferredTaskDuration: calculatePreferredDuration(recentHistory),
    commonObstacles: extractCommonObstacles(recentHistory),
    successfulApproaches: identifySuccessfulApproaches(recentHistory),
    energyLevels: modelEnergyLevels(recentHistory),
    contextSwitchingTolerance: calculateSwitchingTolerance(recentHistory)
  };
}
```

#### Personalized Recommendations
```typescript
export function generatePersonalizedRecommendations(
  content: string,
  analysis: AIAnalysisResult,
  userPattern: UserPattern
): PersonalizedRecommendation[] {
  
  const recommendations: PersonalizedRecommendation[] = [];
  
  // Time-based recommendations
  if (analysis.complexityScore > 7) {
    const optimalTime = findOptimalWorkTime(userPattern, analysis.timeToComplete);
    recommendations.push({
      type: 'timing',
      suggestion: `Schedule this during your peak productivity hours (${optimalTime})`,
      confidence: 0.85,
      reasoning: 'Complex tasks benefit from high-energy periods'
    });
  }
  
  // Task breakdown recommendations
  if (analysis.timeToComplete > userPattern.preferredTaskDuration) {
    recommendations.push({
      type: 'breakdown',
      suggestion: 'Consider breaking this into smaller, focused sessions',
      confidence: 0.90,
      reasoning: `Your optimal session length is ${userPattern.preferredTaskDuration} minutes`
    });
  }
  
  // Context switching recommendations
  if (userPattern.contextSwitchingTolerance < 0.5) {
    recommendations.push({
      type: 'focus',
      suggestion: 'Block dedicated time to minimize context switching',
      confidence: 0.88,
      reasoning: 'You work best with sustained focus periods'
    });
  }
  
  return recommendations;
}
```

### Adaptive Intelligence

#### Learning from User Feedback
```typescript
export class AdaptiveIntelligence {
  private feedbackHistory: UserFeedback[] = [];
  private modelAccuracy: Map<string, number> = new Map();
  
  async updateFromFeedback(
    originalAnalysis: AIAnalysisResult,
    userFeedback: UserFeedback,
    actualOutcome: TaskOutcome
  ): Promise<void> {
    
    // Store feedback for pattern analysis
    this.feedbackHistory.push({
      analysis: originalAnalysis,
      feedback: userFeedback,
      outcome: actualOutcome,
      timestamp: new Date()
    });
    
    // Update model accuracy metrics
    this.updateAccuracyMetrics(originalAnalysis, userFeedback, actualOutcome);
    
    // Adjust future predictions based on learning
    await this.adjustPredictionModels(originalAnalysis, userFeedback);
  }
  
  private updateAccuracyMetrics(
    analysis: AIAnalysisResult,
    feedback: UserFeedback,
    outcome: TaskOutcome
  ): void {
    
    // Complexity prediction accuracy
    const complexityError = Math.abs(analysis.complexityScore - outcome.actualComplexity);
    this.updateMetric('complexity', complexityError);
    
    // Time estimation accuracy
    const timeError = Math.abs(
      parseTimeEstimate(analysis.timeToComplete) - outcome.actualDuration
    );
    this.updateMetric('timeEstimation', timeError);
    
    // Collection suggestion accuracy
    if (feedback.collectionChoice === analysis.collectionSuggestion?.name) {
      this.updateMetric('collection', 1.0);
    } else {
      this.updateMetric('collection', 0.0);
    }
  }
}
```

---

## Performance Optimization

### Request Batching Strategy

#### Intelligent Batching
```typescript
export class AIRequestBatcher {
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchSize = 5;
  private readonly batchDelay = 500; // ms
  
  async addRequest(request: AIRequest): Promise<AIAnalysisResult> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.scheduleBatchProcessing();
    });
  }
  
  private scheduleBatchProcessing(): void {
    if (this.batchTimer) clearTimeout(this.batchTimer);
    
    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch();
    } else {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }
  
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0, this.batchSize);
    
    try {
      const results = await this.processBatchedRequests(
        batch.map(b => b.request)
      );
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
      
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
}
```

### Caching Strategy

#### Intelligent Response Caching
```typescript
export class AIResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxSize = 1000;
  
  async get(content: string, mode: string): Promise<AIAnalysisResult | null> {
    const key = this.generateKey(content, mode);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time for LRU eviction
    cached.lastAccessed = Date.now();
    return cached.result;
  }
  
  async set(
    content: string, 
    mode: string, 
    result: AIAnalysisResult
  ): Promise<void> {
    
    const key = this.generateKey(content, mode);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldestEntries();
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }
  
  private generateKey(content: string, mode: string): string {
    // Generate content hash for consistent caching
    const hash = require('crypto')
      .createHash('sha256')
      .update(content + mode)
      .digest('hex');
    return hash.substring(0, 16);
  }
}
```

### Rate Limiting and Error Recovery

#### Adaptive Rate Limiting
```typescript
export class AdaptiveRateLimiter {
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private backoffMultipliers: Map<string, number> = new Map();
  
  async executeWithRateLimit<T>(
    provider: 'openai' | 'claude',
    operation: () => Promise<T>
  ): Promise<T> {
    
    const key = provider;
    const currentRequests = this.requestCounts.get(key) || 0;
    const errorCount = this.errorCounts.get(key) || 0;
    const backoffMultiplier = this.backoffMultipliers.get(key) || 1;
    
    // Calculate dynamic rate limit based on error history
    const baseLimit = provider === 'openai' ? 60 : 50; // requests per minute
    const adjustedLimit = Math.floor(baseLimit / backoffMultiplier);
    
    if (currentRequests >= adjustedLimit) {
      const waitTime = (60 / adjustedLimit) * 1000 * backoffMultiplier;
      await this.wait(waitTime);
    }
    
    try {
      this.incrementRequestCount(key);
      const result = await operation();
      
      // Success - reduce backoff
      this.reduceBackoff(key);
      return result;
      
    } catch (error) {
      this.incrementErrorCount(key);
      this.increaseBackoff(key);
      throw error;
    }
  }
  
  private increaseBackoff(provider: string): void {
    const current = this.backoffMultipliers.get(provider) || 1;
    this.backoffMultipliers.set(provider, Math.min(current * 2, 8));
  }
  
  private reduceBackoff(provider: string): void {
    const current = this.backoffMultipliers.get(provider) || 1;
    if (current > 1) {
      this.backoffMultipliers.set(provider, Math.max(current * 0.9, 1));
    }
  }
}
```

This comprehensive AI documentation provides complete context for ChatGPT consultation on prompt engineering strategies, model implementation details, and performance optimization approaches used in Mira.