# AI Prompts and Commands Comparison: Before vs After

## Overview
This document compares the AI implementation before and after the recent changes to identify what may have caused the step back in AI quality.

| Component | Before (Original Implementation) | After (Current Implementation) | Key Differences |
|-----------|----------------------------------|--------------------------------|-----------------|
| **Claude Primary Prompt** | Complex multi-stage analysis with detailed structure and rich context generation | Uses Mira Brain template - simpler classification-focused approach | **MAJOR CHANGE**: Lost complex analysis structure, rich context generation, and sophisticated reasoning |
| **OpenAI Primary Prompt** | Complex multi-stage analysis matching Claude's sophistication | Uses Mira Brain template - same simplified approach as Claude | **MAJOR CHANGE**: Lost complex analysis structure and sophisticated reasoning |
| **Analysis Structure** | Comprehensive AIAnalysisResult with 15+ fields including richContext, taskHierarchy, nextSteps, etc. | Simplified MiraAIOutput with basic type, title, description | **MAJOR REGRESSION**: Lost most analytical depth and intelligence |
| **Prompt Template** | Model-specific, detailed analysis instructions | Generic Mira Brain template for both models | **UNIFORMITY LOSS**: Lost model-specific optimization |
| **Output Format** | Rich JSON with nested objects, arrays, and complex data structures | Simple flat structure focused on classification | **COMPLEXITY LOSS**: Lost sophisticated data structure |
| **Context Generation** | Rich context with recommendedActions, researchResults, quickInsights | Basic description field only | **INTELLIGENCE LOSS**: Lost context enrichment |
| **Todo Extraction** | Sophisticated analysis with taskHierarchy, phases, dependencies | Basic todo array extraction | **PLANNING LOSS**: Lost project management capabilities |
| **Collection Suggestions** | Intelligent categorization with icons and colors | Basic collection suggestion | **UX LOSS**: Lost visual and organizational intelligence |

## Detailed Breakdown

### 1. Claude Analysis Function

**BEFORE (anthropic.ts - Original):**
```typescript
// Complex analysis with multiple reasoning stages
const analysis = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: `You are Mira, an intelligent personal assistant. Analyze the following note and provide comprehensive insights including:
  
  1. CONTENT ENHANCEMENT: Improve clarity and completeness
  2. TASK EXTRACTION: Identify actionable items and create todos
  3. COMPLEXITY ASSESSMENT: Rate from 1-10 and classify intent type
  4. INTELLIGENT CATEGORIZATION: Suggest appropriate collections
  5. RICH CONTEXT GENERATION: Provide research, recommendations, insights
  6. PREDICTIVE INTELLIGENCE: Next steps, time estimates, success factors
  
  Return detailed JSON with all analysis fields...`,
  messages: [{ role: 'user', content: content }]
});
```

**AFTER (anthropic.ts - Current):**
```typescript
// Simple classification using generic Mira Brain template
const prompt = miraPromptTemplate.replace('{user_input}', content);
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  system: "You are Mira, an intelligent research assistant. Always respond with valid JSON.",
  messages: [{ role: 'user', content: prompt }]
});
```

### 2. OpenAI Analysis Function

**BEFORE (openai.ts - Original):**
```typescript
// Sophisticated analysis matching Claude's capabilities
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: `You are Mira, an intelligent note analysis system. Provide comprehensive analysis including:
      - Enhanced content with clarity improvements
      - Task hierarchy with phases and dependencies  
      - Rich context with research and recommendations
      - Predictive intelligence and success factors
      Return detailed JSON structure...`
    },
    { role: "user", content: content }
  ],
  response_format: { type: "json_object" }
});
```

**AFTER (openai.ts - Current):**
```typescript
// Generic Mira Brain template (same as Claude)
const prompt = miraPromptTemplate.replace('{user_input}', content);
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system", 
      content: "You are Mira, an intelligent research assistant. Always respond with valid JSON."
    },
    { role: "user", content: prompt }
  ],
  response_format: { type: "json_object" }
});
```

### 3. Data Structures

**BEFORE - AIAnalysisResult (Rich Structure):**
```typescript
interface AIAnalysisResult {
  enhancedContent?: string;
  suggestion?: string;
  context?: string;
  complexityScore: number; // 1-10 scale
  intentType: 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  todos: string[];
  taskHierarchy?: {
    phase: string;
    description: string;
    tasks: string[];
    estimatedTime: string;
    dependencies?: string[];
  }[];
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
  richContext?: {
    recommendedActions: {
      title: string;
      description: string;
      links?: { title: string; url: string }[];
    }[];
    researchResults: {
      title: string;
      description: string;
      rating?: string;
      keyPoints: string[];
      contact?: string;
    }[];
    quickInsights: string[];
  };
  nextSteps?: string[];
  timeToComplete?: string;
  successFactors?: string[];
  potentialObstacles?: string[];
  relatedTopics?: string[];
  skillsRequired?: string[];
  resourcesNeeded?: string[];
}
```

**AFTER - MiraAIOutput (Simplified Structure):**
```typescript
interface MiraAIOutput {
  type: 'reminder' | 'todo' | 'collection';
  title: string;
  description: string;
  followUps?: string[];
  layoutHint?: 'checklist' | 'calendar' | 'card' | 'timeline' | 'list';
  notificationSchedule?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  collectionSuggestion?: {
    name: string;
    icon: string;
    color: string;
  };
}
```

### 4. Prompt Templates

**BEFORE - Model-Specific Prompts:**
- Claude: Detailed analysis instructions with context understanding
- OpenAI: Optimized for GPT-4o capabilities with structured reasoning
- Each model leveraged its specific strengths

**AFTER - Generic Mira Brain Template:**
```typescript
export const miraPromptTemplate = `
You are Mira, an AI-powered personal assistant...
Your Role:
- You are NOT a summarizer.
- You transform user input into smart, actionable, or memory-catalogued records.
- You determine whether something is a REMINDER, a TO-DO, or a COLLECTION item.
...
`;
```

## Impact Analysis

### What We Lost:
1. **Analytical Depth**: Rich context generation, research capabilities, predictive intelligence
2. **Task Management**: Complex task hierarchies, project phases, dependencies
3. **Intelligence Features**: Success factors, potential obstacles, skill requirements
4. **Model Optimization**: Each AI model was optimized for its strengths
5. **Data Richness**: Nested structures, detailed metadata, comprehensive insights

### What We Gained:
1. **Consistency**: Both models use the same approach
2. **Simplicity**: Easier to maintain and debug
3. **Classification Focus**: Clear categorization of content types

### Root Cause:
The change from sophisticated, model-specific analysis prompts to a generic "Mira Brain" template significantly reduced the AI's analytical capabilities. The original implementation treated each note as requiring deep analysis, while the current implementation focuses on simple classification.

## Recommendations:
1. **Restore rich analysis structure** while keeping classification benefits
2. **Reintroduce model-specific optimizations** 
3. **Combine both approaches**: Use Mira Brain for classification, rich analysis for enhancement
4. **Gradually restore lost features** like taskHierarchy, richContext, predictive intelligence