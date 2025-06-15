# Mira Intelligence-V2 - AI Prompts and Processing Frameworks

## Overview
This document contains all AI prompts, processing instructions, and intelligence frameworks directly referenced in the Intelligence-V2 pipeline.

---

## 1. Recursive Reasoning Engine Prompts

### Core System Prompt (Primary Intelligence Framework)
**File**: `server/intelligence-v2/recursive-reasoning-engine.ts`
**Method**: `buildRecursivePrompt()`

```
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
      "cascadingEffects": ["broader effect 1", "broader effect 2"],
      "optimizationOpportunities": ["system improvement 1", "system improvement 2"],
      "longTermValue": "extended strategic value",
      "learningOpportunities": ["learning from patterns 1", "learning from patterns 2"]
    },
    "step3Implications": {
      "likelyNextNeeds": ["long-term need 1", "long-term need 2"],
      "followUpQuestions": ["strategic question 1", "strategic question 2"],
      "requiredInformation": ["strategic info 1", "strategic info 2"],
      "potentialActions": ["strategic action 1", "strategic action 2"],
      "cascadingEffects": ["system-wide effect 1", "system-wide effect 2"],
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
    "surfaceImmediately": [{"contentId": "string", "reason": "specific value proposition", "timing": "now"}],
    "prepareForLater": [{"contentId": "string", "reason": "anticipated future need", "timing": "ISO_datetime"}],
    "suggestedActions": [{"action": "specific actionable step", "reasoning": "why this helps", "priority": 1-10}],
    "preventiveMeasures": [{"risk": "identified risk", "prevention": "specific prevention", "urgency": "high|medium|low"}],
    "optimizationSuggestions": [{"area": "improvement area", "suggestion": "specific optimization", "impact": "expected benefit"}]
  }
}

CRITICAL: Focus on recursive reasoning - think ahead, anticipate needs, and deliver proactive value.
OUTPUT ONLY JSON:
```

---

## 2. Intent Classification Framework

### Intent Classification Prompt
**File**: `server/intelligence-v2/vector-engine.ts`
**Method**: `classifyIntent()`

```
Analyze this content and classify the primary intent. Consider the user's underlying goal and motivation.

Content: "${content}"

Return JSON:
{
  "intent": "specific_intent_category",
  "confidence": 0.95,
  "reasoning": "brief explanation",
  "secondary_intents": ["intent1", "intent2"]
}

Intent Categories:
- research: seeking information or learning
- planning: organizing future activities
- reminder: time-based tasks or notifications
- creative: content creation or brainstorming
- analysis: data interpretation or decision support
- communication: message preparation or social
- commerce: shopping, purchasing, or financial
- productivity: task management or efficiency
- documentation: record keeping or knowledge capture
- general: mixed or unclear intent
```

---

## 3. Predictive Action Generation

### Next Action Prediction Prompt
**File**: `server/intelligence-v2/recursive-reasoning-engine.ts`
**Method**: `generateProactiveRecommendations()`

```
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
  ],
  "confidence": 0.85,
  "reasoning": "basis for predictions",
  "timing": "when these actions will likely occur"
}
```

---

## 4. Commerce vs Memory Classification

### Fast Classification Framework
**File**: `server/brain/miraAIProcessing.ts`
**Method**: `classifyProcessingPath()`

```javascript
// 1ms keyword-based classification system
const commerceKeywords = [
  'buy', 'purchase', 'shop', 'price', 'cost', 'order', 'cart', 
  'shipping', 'delivery', 'payment', 'store', 'product', 'brand',
  'compare', 'review', 'rating', 'discount', 'sale', 'deal'
];

const memoryKeywords = [
  'remember', 'remind', 'note', 'todo', 'task', 'meeting', 
  'appointment', 'deadline', 'schedule', 'plan', 'organize',
  'personal', 'private', 'journal', 'diary', 'thought'
];

// Orthogonal processing paths:
// - Commerce: Shopping assistance, product research, price comparison
// - Memory: Personal organization, task management, reminders
```

---

## 5. Enhanced Content Generation

### Content Enhancement Framework
**File**: `server/intelligence-v2/intelligence-router.ts`
**Method**: `enhanceContentWithInsights()`

```javascript
// Content enhancement rules:
1. Preserve original user intent and content
2. Add proactive insights without overwhelming
3. Surface related content when relevant (>70% similarity)
4. Include actionable next steps from recursive reasoning
5. Provide research opportunities for knowledge gaps
6. Suggest automation opportunities for repeated patterns

// Enhancement structure:
Original Content
+ Suggested actions: [action1, action2]
+ Research opportunities: [gap1, gap2]  
+ Related content: X similar items found
+ Next steps: [step1, step2]
```

---

## 6. Vector Similarity Search

### Semantic Search Framework
**File**: `server/intelligence-v2/vector-engine.ts`
**Method**: `searchSimilar()`

```sql
-- PostgreSQL vector similarity query
SELECT 
  id as note_id,
  content,
  (1 - (vector_dense <=> $1)) as similarity
FROM notes 
WHERE 
  vector_dense IS NOT NULL
  AND (1 - (vector_dense <=> $1)) > $2
ORDER BY vector_dense <=> $1
LIMIT $3;

-- Similarity thresholds:
-- > 0.9: Nearly identical content
-- > 0.8: Highly related topics  
-- > 0.7: Moderately related (default)
-- > 0.6: Loosely related
-- < 0.6: Not meaningfully related
```

---

## 7. Error Handling and Fallback Instructions

### Graceful Degradation Framework
**File**: `server/intelligence-v2/intelligence-router.ts`
**Method**: `fallbackToBasicProcessing()`

```javascript
// Multi-level fallback system:
1. Intelligence-V2 Full → Enhanced Basic → Standard Processing
2. Preserve user experience during failures
3. Log errors for debugging without user disruption
4. Maintain core functionality even with partial system failures

// Fallback analysis structure provides:
- Enhanced content analysis
- Basic entity extraction
- Standard todo processing  
- Vector storage (when possible)
- Error-free user experience
```

---

## 8. Data Protection and Privacy Framework

### Content Protection Rules
**File**: `server/data-protection.ts`

```javascript
// Content protection guidelines:
1. Never modify user's original content without explicit permission
2. Preserve high-value user input sections during AI enhancement
3. Implement version control for all AI modifications
4. Provide rollback capabilities for sensitive changes
5. Maintain audit trail of all content modifications
6. Respect user privacy levels and sharing preferences
```

---

## 9. Notification Intelligence Framework

### Smart Notification Generation
**File**: `server/notification-system.ts`

```javascript
// Intelligent notification rules:
1. Category-based lead time calculation
2. Context-aware reminder scheduling  
3. Urgency assessment for notification timing
4. User pattern learning for optimal delivery
5. Multi-channel notification support
6. Completion tracking and optimization

// Lead time categories:
- Meetings: 15 minutes before
- Appointments: 30 minutes before  
- Deadlines: 1 day before + 2 hours before
- Personal tasks: 1 hour before
- Recurring items: Pattern-based timing
```

---

## 10. Performance Optimization Guidelines

### Processing Efficiency Framework

```javascript
// Performance targets:
- Vector embedding generation: <200ms
- Similarity search: <50ms  
- Database operations: <30ms
- Total note processing: <2 seconds
- UI responsiveness: No blocking operations

// Optimization strategies:
1. Parallel processing where possible
2. Caching for repeated operations
3. Efficient vector storage formats
4. Optimized database queries
5. Graceful degradation for slow operations
```

---

## Implementation Status Summary

✅ **Fully Implemented Frameworks**:
- Vector similarity search
- Intent classification  
- Commerce/memory routing
- Content enhancement
- Error handling and fallbacks

⚠️ **Implemented with Limitations**:
- Recursive reasoning (property structure issues)
- Proactive delivery (dependent on recursive reasoning)
- Advanced relationship mapping

🔄 **Current Active Framework**:
Enhanced basic processing with vector storage, semantic search, and intelligent content enhancement while recursive reasoning issues are resolved.

---

*This document represents the complete AI intelligence framework as implemented in the Mira Intelligence-V2 system as of June 15, 2025.*