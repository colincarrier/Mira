# Mira Intelligence V3 Changeover Plan

## Executive Summary

This document outlines the complete implementation plan for Mira Intelligence V3, which consolidates all AI processing into a single superhuman intelligence system while preserving V2's sophisticated capabilities and adding contextual awareness, seamless document integration, and cost-controlled recursion.

## Architecture Overview

### Single-Source Intelligence
- **Master File**: `server/ai/mira-superintelligence.ts` - The only location for AI logic
- **Consolidation**: Remove scattered prompts from existing files
- **Entry Point**: Single `processInput()` function for all AI operations
- **Backwards Compatibility**: Maintain existing API interfaces

### Cost Model
- **Base Tier**: 8K tokens per request, $30/month user ceiling
- **Burst Capability**: Up to 8K tokens for high-value requests
- **Smart Throttling**: Value-driven recursion with soft caps
- **No External APIs**: All enrichment through GPT-4o prompting

## Implementation Phases

### Phase 1: Core Infrastructure Setup

#### 1.1 Create Master Intelligence File
**File**: `server/ai/mira-superintelligence.ts`

**Structure**:
```typescript
// Core Types
export interface UserInput {
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  userId: string;
  contextualData?: any;
}

export interface LivingDocState {
  content: string;
  cursorPosition?: number;
  selectedText?: string;
  documentId: string;
}

export interface ProfileSnapshot {
  userId: string;
  bioSummary: string;
  recentHistory: string[];
  preferences: UserPreferences;
  relationshipContext: RelationshipMap;
}

export interface DocUpdate {
  content: string;
  meta: {
    todos: ExtractedTodo[];
    reminders: ExtractedReminder[];
    collections: CollectionSuggestion[];
    vectors: VectorData[];
    links: EnrichedLink[];
  };
}

// Main Entry Point
export async function processInput(
  raw: UserInput,
  docState: LivingDocState,
  userProfile: ProfileSnapshot
): Promise<DocUpdate>

// Engine Classes
export class ContextEngine
export class ReasoningEngine
export class LinkEnrichmentEngine
export class TaskReminderEngine
export class NotificationEngine
export class ContentWeaver
```

#### 1.2 Environment Configuration
**File**: `.env` additions
```
# V3 Intelligence Settings
MIRA_V3_ENABLED=true
MIRA_AI_MAX_TOKENS=8192
MIRA_AI_TEMPERATURE=0.35
AI_SPEND_SOFT_CAP_USD=30
AI_SPEND_USER_WEEKLY_CEIL_USD=50
AI_OVERRUN_MODE=warn
```

#### 1.3 Feature Flag Integration
**File**: `server/feature-flags-runtime.ts`
```typescript
export const FEATURE_FLAGS = {
  INTELLIGENCE_V3_ENABLED: process.env.MIRA_V3_ENABLED === 'true',
  V3_RECURSIVE_REASONING: true,
  V3_LINK_ENRICHMENT: true,
  V3_SMART_TASKS: true,
  V3_LIVING_DOCUMENT: true,
  // ... existing flags
}
```

### Phase 2: Context Engine Implementation

#### 2.1 User Profile Builder
**Functionality**: Extract and build rich user profiles from historical data

**Implementation Details**:
```typescript
class ContextEngine {
  // Extract biographical information from user's note history
  async extractBioSummary(userId: string): Promise<string> {
    // 1. Query last 100 notes from user
    // 2. Use GPT-4o to extract: name, role, location, key relationships
    // 3. Cache result for 7 days
    // 4. Return 50-word summary
  }

  // Build relationship context mapping
  async buildRelationshipMap(userId: string): Promise<RelationshipMap> {
    // 1. Analyze mentions of people in notes
    // 2. Classify relationships: family, friends, colleagues, clients
    // 3. Track interaction patterns and communication styles
    // 4. Store in user profile for quick lookup
  }

  // Determine stakes level for current input
  assessStakes(content: string, relationships: RelationshipMap): StakesLevel {
    // Critical: money ≥$5k, VC meetings, health emergencies, legal deadlines
    // High: travel bookings, important meetings, contracts
    // Medium: shopping >$100, multi-day projects
    // Low: personal journaling, routine tasks
  }

  // Analyze preparation opportunity
  calculatePrepOpportunity(
    stakes: StakesLevel,
    relationship: RelationshipType,
    novelty: NoveltyScore
  ): PrepOpportunity {
    // Research: High stakes + new domain = research opportunity
    // Logistics: Travel/events = logistics opportunity  
    // Connections: Business context = networking opportunity
    // Summary: Low stakes = summary only
  }
}
```

#### 2.2 Entity Extraction Integration
**Preserve V2 Capabilities**: Integrate with existing vector engine

```typescript
// Leverage existing V2 vector engine for entity recognition
async extractEntities(content: string): Promise<Entity[]> {
  // 1. Use V2's sparse vector for fast entity detection
  // 2. Avoid re-processing known entities
  // 3. Focus GPT-4o on new/complex entities
  // 4. Return structured entity list with types and confidence
}
```

#### 2.3 Time Sensitivity Analysis
**Integration**: Use existing chrono-node parsing

```typescript
async analyzeTimeSensitivity(content: string): Promise<TimeContext> {
  // 1. Extract dates, times, recurrences
  // 2. Parse cultural idioms ("tomorrow morning", "next week")
  // 3. Calculate urgency based on time until deadline
  // 4. Return structured time context
}
```

### Phase 3: Reasoning Engine Implementation

#### 3.1 Prompt Engineering System
**Centralized Prompts**: All prompts in single location

```typescript
const PROMPTS = {
  system: `You are Mira, a team of superhuman assistants. ALWAYS:
    - Preserve the user's voice and writing style
    - Think multi-disciplinarily: personal, professional, logistical
    - Prefer concise usefulness over verbosity
    - Surface relevant links, prices, availability when valuable
    - Only create todos/reminders that clearly save future effort
    - Maintain context awareness of relationships and stakes`,

  initial: `CONTEXT:
    User Profile: {{PROFILE}}
    Current Document: {{DOCUMENT}}
    Relationship Context: {{RELATIONSHIPS}}
    Stakes Level: {{STAKES}}
    
    USER INPUT:
    "{{INPUT}}"
    
    TASK:
    1. Understand the user's intent and context
    2. Enhance with high-value additions (research, logistics, connections)
    3. Extract actionable todos/reminders (0-N, explain reasoning)
    4. Generate relevant links and resources
    5. Draft collaborative content to weave into document
    
    Return JSON:
    {
      "enhanced_content": "...markdown content...",
      "todos": [...],
      "reminders": [...],
      "links": [...],
      "reasoning": "explanation of decisions"
    }`,

  recursive: `You previously generated:
    {{CURRENT_OUTPUT}}
    
    For the original input: "{{INPUT}}"
    With context: {{CONTEXT}}
    
    CRITICAL QUESTION: "Will additional analysis create significant extra value?"
    
    Consider:
    - Are there unexplored angles that would save the user time/effort?
    - Could you provide better research, logistics, or connections?
    - Would deeper analysis change your recommendations?
    
    If YES: Provide enhanced analysis (max 300 tokens additional)
    If NO: Return the original output unchanged
    
    Return same JSON format.`,

  // Domain-specific prompts
  travel: `You are analyzing travel-related content. Focus on:
    - Practical logistics (flights, hotels, transportation)
    - Local context (weather, culture, requirements)
    - Cost optimization and timing
    - Safety and preparation considerations`,

  business: `You are analyzing business-related content. Focus on:
    - Industry context and competitive landscape
    - Professional relationship dynamics
    - Strategic implications and opportunities
    - Risk assessment and mitigation`,

  personal: `You are analyzing personal content. Focus on:
    - Relationship dynamics and communication style
    - Personal growth and well-being
    - Time management and life balance
    - Emotional intelligence and empathy`
};
```

#### 3.2 Value-Driven Recursion Engine
**Smart Recursion**: Only recurse when adding genuine value

```typescript
class ReasoningEngine {
  private MAX_RECURSION_DEPTH = 4;
  private VALUE_THRESHOLD = 0.25;

  async recursiveRefine(
    initialOutput: string,
    originalInput: string,
    context: ContextData,
    depth: number = 0
  ): Promise<string> {
    if (depth >= this.MAX_RECURSION_DEPTH) return initialOutput;

    const valueScore = this.estimateMarginalValue(initialOutput, context);
    if (valueScore < this.VALUE_THRESHOLD) return initialOutput;

    // Cost gate: ensure we have budget for additional processing
    const costOk = await this.checkCostBudget(context.userId, 2000);
    if (!costOk) return initialOutput;

    const prompt = this.buildRecursivePrompt(initialOutput, originalInput, context);
    const enhanced = await this.callGPT4o(prompt, 2000);

    return this.recursiveRefine(enhanced, originalInput, context, depth + 1);
  }

  private estimateMarginalValue(output: string, context: ContextData): number {
    let score = 0;

    // Stakes multiplier
    const stakesMultiplier = {
      critical: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.2
    }[context.stakes];

    // Content depth analysis
    const hasNewEntities = this.countNewEntities(output, context.knownEntities);
    const hasActionableItems = this.countActionableItems(output);
    const hasResearchValue = this.assessResearchValue(output, context);

    score = stakesMultiplier * (
      hasNewEntities * 0.3 +
      hasActionableItems * 0.4 +
      hasResearchValue * 0.3
    );

    return Math.min(score, 1.0);
  }
}
```

#### 3.3 Cost Management System
**Budget Tracking**: Track and limit spending per user

```typescript
class CostManager {
  async checkCostBudget(userId: string, estimatedTokens: number): Promise<boolean> {
    const weeklySpend = await this.getWeeklySpend(userId);
    const estimatedCost = estimatedTokens * 0.00001; // GPT-4o pricing
    
    return weeklySpend + estimatedCost < 50; // $50 weekly limit
  }

  async recordUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
    const cost = (inputTokens * 0.000005) + (outputTokens * 0.000015);
    await this.updateSpendingRecord(userId, cost);
  }
}
```

### Phase 4: Link Enrichment Engine

#### 4.1 GPT-4o Based Link Generation
**No External APIs**: Generate all links through intelligent prompting

```typescript
class LinkEnrichmentEngine {
  async enrich(content: string, context: ContextData): Promise<EnrichedLink[]> {
    if (!this.shouldEnrichLinks(context)) return [];

    const entities = await this.extractLinkableEntities(content);
    const links = await this.generateContextualLinks(entities, context);
    
    return this.filterAndRankLinks(links, context);
  }

  private async generateContextualLinks(
    entities: Entity[],
    context: ContextData
  ): Promise<EnrichedLink[]> {
    const prompt = `Given these entities: ${JSON.stringify(entities)}
    
    Generate 3-5 high-value links for each entity based on context:
    - Stakes level: ${context.stakes}
    - Domain: ${context.domain}
    - User location: ${context.userLocation}
    
    For each link provide:
    1. URL (deep link when possible)
    2. Title (descriptive)
    3. Description (why it's valuable)
    4. Type (search, product, booking, reference)
    
    Focus on actionable, time-saving resources.
    
    Return JSON array of links.`;

    return await this.callGPT4o(prompt, 1500);
  }

  private shouldEnrichLinks(context: ContextData): boolean {
    // Skip for low stakes unless explicitly requested
    if (context.stakes === 'low' && !context.explicitLinkRequest) return false;
    
    // Check cost budget
    if (!this.hasBudgetForEnrichment(context.userId)) return false;
    
    return true;
  }
}
```

#### 4.2 Domain-Specific Link Strategies
**Contextual Intelligence**: Different strategies for different domains

```typescript
private getLinkStrategy(entityType: string, context: ContextData): LinkStrategy {
  const strategies = {
    travel: {
      flight: ['Google Flights', 'Kayak', 'airline direct'],
      hotel: ['Booking.com', 'Hotels.com', 'local hotel sites'],
      activities: ['TripAdvisor', 'local tourism boards'],
      logistics: ['visa requirements', 'weather', 'currency']
    },
    
    product: {
      research: ['manufacturer specs', 'review sites', 'comparison tools'],
      pricing: ['price tracking', 'deal sites', 'retailer comparison'],
      availability: ['stock checkers', 'shipping calculators']
    },
    
    business: {
      company: ['Crunchbase', 'LinkedIn', 'recent news'],
      market: ['industry reports', 'competitive analysis'],
      networking: ['professional connections', 'event listings']
    }
  };

  return strategies[context.domain]?.[entityType] || strategies.default;
}
```

### Phase 5: Task and Reminder Intelligence

#### 5.1 Smart Task Extraction
**Contextual Task Recognition**: Avoid todo overload

```typescript
class TaskReminderEngine {
  async extract(content: string, context: ContextData): Promise<TaskExtractionResult> {
    const candidates = await this.identifyTaskCandidates(content);
    const filteredTasks = this.filterTasks(candidates, context);
    const reminders = this.extractReminders(filteredTasks, context);
    
    return {
      todos: filteredTasks,
      reminders: reminders,
      reasoning: this.explainTaskDecisions(candidates, filteredTasks)
    };
  }

  private filterTasks(candidates: TaskCandidate[], context: ContextData): ExtractedTodo[] {
    return candidates.filter(task => {
      // Always create for explicit promises
      if (task.explicitness > 0.9) return true;
      
      // High stakes + clear action = create
      if (context.stakes === 'high' && task.hasTimeComponent) return true;
      
      // Check user's historical todo acceptance rate
      if (task.explicitness < 0.7 && context.userProfile.todoAcceptanceRate < 0.5) {
        return false;
      }
      
      // Avoid creating todos for brainstorming/planning sessions
      if (this.isBrainstormingContext(context)) return false;
      
      return task.explicitness > 0.6;
    });
  }

  private calculateReminderLeadTime(
    task: ExtractedTodo,
    context: ContextData
  ): number {
    const baseLeadTimes = {
      critical: 0.3, // 30% of time until deadline
      high: 0.5,     // 50% of time until deadline
      medium: 0.7,   // 70% of time until deadline
      low: 0.9       // 90% of time until deadline
    };

    const baseLead = baseLeadTimes[context.stakes];
    const userPreference = context.userProfile.reminderPreference || 1.0;
    
    return Math.max(baseLead * userPreference, 0.1); // Minimum 10% lead time
  }
}
```

#### 5.2 Intelligent Reminder Scheduling
**Context-Aware Scheduling**: Adapt to user patterns and relationship dynamics

```typescript
class NotificationEngine {
  async schedule(reminders: ExtractedReminder[], userProfile: ProfileSnapshot): Promise<void> {
    for (const reminder of reminders) {
      const leadTime = this.calculateLeadTime(reminder, userProfile);
      const notificationTime = this.calculateNotificationTime(reminder.dueDate, leadTime);
      
      await this.scheduleNotification({
        userId: userProfile.userId,
        title: reminder.title,
        scheduledTime: notificationTime,
        leadTime: leadTime,
        importance: reminder.importance,
        type: reminder.recurring ? 'recurring' : 'one-time'
      });
    }
  }

  private calculateLeadTime(reminder: ExtractedReminder, userProfile: ProfileSnapshot): number {
    // Base lead time from stakes
    let leadTime = this.getBaseLeadTime(reminder.stakes);
    
    // Adjust for relationship context
    if (reminder.relationshipType === 'family') {
      leadTime *= 0.8; // Shorter lead time for family
    } else if (reminder.relationshipType === 'business') {
      leadTime *= 1.2; // Longer lead time for business
    }
    
    // Adjust for user's historical response patterns
    leadTime *= userProfile.reminderResponseRate || 1.0;
    
    return Math.max(leadTime, 0.1); // Minimum 10% lead time
  }
}
```

### Phase 6: Living Document Integration

#### 6.1 Content Weaver Implementation
**Seamless Integration**: Merge AI content naturally into documents

```typescript
class ContentWeaver {
  async integrate(
    currentContent: string,
    updates: DocUpdate,
    cursorPosition?: number
  ): Promise<string> {
    const integrationStrategy = this.determineIntegrationStrategy(
      currentContent,
      updates,
      cursorPosition
    );

    switch (integrationStrategy) {
      case 'inline':
        return this.inlineIntegration(currentContent, updates, cursorPosition);
      case 'append':
        return this.appendIntegration(currentContent, updates);
      case 'contextual':
        return this.contextualIntegration(currentContent, updates);
      default:
        return this.safeAppend(currentContent, updates);
    }
  }

  private inlineIntegration(
    content: string,
    updates: DocUpdate,
    cursorPosition: number
  ): string {
    // Insert AI content at cursor position
    // Add data-mira-id attributes for rollback capability
    // Maintain document structure and formatting
  }

  private contextualIntegration(
    content: string,
    updates: DocUpdate
  ): string {
    // Find relevant section based on content similarity
    // Insert AI content in appropriate location
    // Maintain document flow and coherence
  }

  private addRollbackMarkers(content: string, updates: DocUpdate): string {
    // Add invisible HTML comments for rollback capability
    // Format: <!-- mira:start:${updateId} -->...<!-- mira:end:${updateId} -->
    return content.replace(
      updates.content,
      `<!-- mira:start:${updates.id} -->${updates.content}<!-- mira:end:${updates.id} -->`
    );
  }
}
```

#### 6.2 Real-time Collaboration Features
**Floating Input Bar**: Maintain existing UI while adding AI collaboration

```typescript
// Frontend integration - maintain existing contenteditable
// Add context-aware AI suggestions
// Provide seamless undo/redo functionality
// Support offline operation with sync when online
```

### Phase 7: Integration and Migration

#### 7.1 V2 to V3 Migration Strategy
**Preserve Existing Intelligence**: Maintain V2 capabilities during transition

```typescript
// server/brain/miraAIProcessing.ts modifications
async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  // Check V3 feature flag
  if (FEATURE_FLAGS.INTELLIGENCE_V3_ENABLED) {
    return await processWithV3Intelligence(input);
  }
  
  // Fallback to V2 processing
  return await processWithV2Intelligence(input);
}

async function processWithV3Intelligence(input: MiraAIInput): Promise<MiraAIResult> {
  // Convert input to V3 format
  const v3Input = convertToV3Input(input);
  
  // Process with V3 system
  const v3Result = await MiraSuperIntelligence.processInput(v3Input);
  
  // Convert back to V2 format for compatibility
  return convertToV2Result(v3Result);
}
```

#### 7.2 Database Schema Updates
**Minimal Schema Changes**: Preserve existing data structure

```sql
-- Add V3 specific columns to existing tables
ALTER TABLE notes ADD COLUMN v3_processed BOOLEAN DEFAULT false;
ALTER TABLE notes ADD COLUMN context_data JSONB;
ALTER TABLE notes ADD COLUMN processing_metadata JSONB;

-- Create new tables for V3 features
CREATE TABLE user_profiles (
  user_id VARCHAR PRIMARY KEY,
  bio_summary TEXT,
  relationship_map JSONB,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cost_tracking (
  user_id VARCHAR,
  date DATE,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  PRIMARY KEY (user_id, date)
);
```

#### 7.3 API Compatibility Layer
**Backwards Compatibility**: Maintain existing API endpoints

```typescript
// Existing endpoints continue to work
// New V3 endpoints for enhanced features
// Gradual migration path for clients
```

### Phase 8: Testing and Validation

#### 8.1 Test Suite Expansion
**Comprehensive Testing**: Validate all V3 features

```typescript
// Expand existing 50-case test suite
// Add V3 specific test cases
// Performance and cost testing
// User acceptance testing
```

#### 8.2 Performance Monitoring
**Real-time Monitoring**: Track system performance and costs

```typescript
// Cost tracking per user
// Response time monitoring
// Quality metrics tracking
// User satisfaction measurement
```

## Implementation Timeline

### Week 1: Core Infrastructure
- Create master intelligence file
- Set up feature flags and environment
- Implement basic routing

### Week 2: Context Engine
- User profile builder
- Relationship mapping
- Stakes assessment
- Entity extraction integration

### Week 3: Reasoning Engine
- Prompt engineering system
- Value-driven recursion
- Cost management integration

### Week 4: Link Enrichment
- GPT-4o based link generation
- Domain-specific strategies
- Value filtering

### Week 5: Task Intelligence
- Smart task extraction
- Reminder scheduling
- Notification integration

### Week 6: Living Document
- Content weaver implementation
- Real-time collaboration
- Rollback mechanisms

### Week 7: Integration
- V2 to V3 migration
- Database updates
- API compatibility

### Week 8: Testing & Validation
- Comprehensive testing
- Performance optimization
- User acceptance testing

## Risk Mitigation

### Technical Risks
1. **Performance**: Implement caching and optimization
2. **Cost Control**: Multiple layers of budget protection
3. **Quality**: Extensive testing and validation
4. **Compatibility**: Gradual migration with fallbacks

### User Experience Risks
1. **Over-complexity**: Maintain simple, intuitive interface
2. **AI Overload**: Smart filtering and value assessment
3. **Privacy**: Secure handling of user data
4. **Reliability**: Robust error handling and fallbacks

## Success Metrics

### Quantitative Metrics
- Response quality scores
- User engagement rates
- Cost per user per month
- Task completion rates
- System performance metrics

### Qualitative Metrics
- User satisfaction surveys
- Feedback on AI helpfulness
- Ease of use assessments
- Feature adoption rates

## Rollback Plan

### Immediate Rollback
- Feature flag disable: `MIRA_V3_ENABLED=false`
- Automatic fallback to V2 system
- No data loss or corruption

### Gradual Rollback
- Disable specific V3 features individually
- Migrate users back to V2 gradually
- Preserve user data and preferences

## Conclusion

This comprehensive plan provides a clear roadmap for implementing Mira Intelligence V3 while preserving the sophisticated capabilities of V2 and adding the contextual awareness and seamless integration requested. The phased approach ensures minimal risk while delivering maximum value to users.

The single-source architecture, cost-controlled recursion, and intelligent task extraction will create a truly superhuman AI assistant that anticipates user needs and delivers contextually appropriate intelligence.