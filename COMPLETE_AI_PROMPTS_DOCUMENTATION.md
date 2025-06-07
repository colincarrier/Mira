# MIRA AI INTELLIGENCE SYSTEM - COMPLETE DOCUMENTATION

## Overview
This document contains all AI instructions, prompts, field definitions, and dependencies for Mira's universal intelligence layer. All AI processing routes through OpenAI for consistency.

## Universal Intelligence Architecture

### Core Processing Function
**Location:** `server/utils/miraAIProcessing.ts`
**Entry Point:** `processMiraInput(input: MiraAIInput): Promise<MiraAIOutput>`

All AI analysis must go through this single function to ensure consistency.

## AI Input Interface (MiraAIInput)

```typescript
export interface MiraAIInput {
  content: string;               // Primary content to analyze
  mode: 'text' | 'voice' | 'image' | 'file';  // Input type
  imageData?: string;           // base64 for image analysis
  context?: string;             // Additional context like voice transcription
}
```

### Dependencies:
- **Used in:** `server/routes.ts` (lines 523, 817, 1223)
- **Processed by:** `processMiraInput()` function
- **Routed to:** OpenAI analysis functions

## AI Output Interface (MiraAIOutput)

### Core Fields (Always Returned)

#### title: string
- **Purpose:** 3-5 word newspaper headline style
- **Constraint:** CRITICAL - Must be enforced by `createNewspaperTitle()`
- **Processing:** Strips articles, prepositions, takes first 3 meaningful words
- **Examples:** "Call Mom Tomorrow", "Research Starting Mobile", "Solid Green Background"
- **Dependencies:** 
  - Enforced in `enforceStructure()` function
  - Used in note cards, lists, detail views
  - Stored in database `notes.content` field after processing

#### context: string
- **Purpose:** Brief contextual summary (1-2 sentences)
- **Default:** "General content analysis." if AI doesn't provide
- **Dependencies:** 
  - Stored as `notes.aiContext` in database
  - Displayed in note cards and detail views

#### todos: Array<TodoItem>
- **Purpose:** Extracted actionable items with rich metadata
- **Structure:**
```typescript
{
  title: string;                    // Main task description
  itemType?: 'task' | 'reminder';  // Classification
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeDue?: string;                 // ISO date string
  timeDependency?: 'none' | 'sequential' | 'parallel';
  plannedNotificationStructure?: {
    enabled: boolean;
    reminderCategory: 'today' | 'tomorrow' | 'this-week' | 'later';
    repeatPattern: 'none' | 'daily' | 'weekly' | 'monthly';
    leadTimeNotifications: string[];
  };
  isActiveReminder?: boolean;
}
```
- **Dependencies:**
  - Converted to database `todos` table entries
  - Used in todo management system
  - Affects notification scheduling

#### intentType: string
- **Values:** 'simple-task' | 'complex-project' | 'research-inquiry' | 'personal-reflection' | 'reference-material'
- **Purpose:** Determines AI processing approach and UI treatment
- **Default:** 'simple-task'

#### urgencyLevel: string
- **Values:** 'low' | 'medium' | 'high' | 'critical'
- **Purpose:** Affects prioritization and notification timing
- **Default:** 'medium'

#### complexityScore: number
- **Range:** 1-10 scale
- **Purpose:** Determines depth of AI analysis and suggested actions
- **Default:** 5

### Enhanced Context Fields (Conditional)

#### suggestion?: string
- **Purpose:** AI-generated follow-up suggestion
- **Dependencies:** 
  - Stored as `notes.aiSuggestion` in database
  - Displayed in note detail views

#### richContext?: object
- **Purpose:** Comprehensive contextual information
- **Structure:**
```typescript
{
  recommendedActions: Array<{
    title: string;
    description: string;
    links?: Array<{ title: string; url: string }>;
  }>;
  researchResults?: Array<{
    title: string;
    description: string;
    rating?: string;
    keyPoints: string[];
    contact?: string;
  }>;
  quickInsights: string[];
  fromTheWeb?: Array<{
    title: string;
    url: string;
    summary: string;
  }>;
}
```
- **Dependencies:**
  - Stored as JSON in `notes.richContext` database field
  - Parsed and displayed in note detail views
  - Used by recommendation engine

#### extractedItems?: Array<ExtractedItem>
- **Purpose:** Individual items found within content
- **Structure:**
```typescript
{
  title: string;
  description?: string;
  category: string;
  metadata?: Record<string, any>;
}
```
- **Dependencies:**
  - Can be converted to separate notes or todos
  - Used in content splitting functionality

### Predictive Intelligence Fields

#### nextSteps?: string[]
- **Purpose:** AI-suggested next actions
- **Dependencies:** Used in action recommendation system

#### timeToComplete?: string
- **Purpose:** Estimated completion time
- **Dependencies:** Used in planning and scheduling

#### successFactors?: string[]
- **Purpose:** Key factors for success
- **Dependencies:** Used in guidance and tips system

#### potentialObstacles?: string[]
- **Purpose:** Anticipated challenges
- **Dependencies:** Used in risk assessment and preparation

### Knowledge Connection Fields

#### relatedTopics?: string[]
- **Purpose:** Connected subject areas
- **Dependencies:** Used in content discovery and linking

#### skillsRequired?: string[]
- **Purpose:** Necessary capabilities
- **Dependencies:** Used in learning recommendations

#### resourcesNeeded?: string[]
- **Purpose:** Required tools/materials
- **Dependencies:** Used in preparation checklists

### Collection Organization

#### collectionSuggestion?: object
- **Structure:**
```typescript
{
  name: string;    // Suggested collection name
  icon: string;    // Icon identifier
  color: string;   // Color theme
}
```
- **Dependencies:**
  - Used in auto-collection assignment
  - Affects note organization and categorization

## AI Prompt Templates

### Core Instructions (Applied to All)
```
You are Mira's AI brain. Process this content and return a structured response.

CRITICAL REQUIREMENTS:
1. Title MUST be 3-5 words maximum - newspaper headline style
2. Extract actionable todos with rich metadata
3. Provide contextual insights and suggestions
4. Maintain consistent output structure

RESPONSE FORMAT: Return valid JSON matching MiraAIOutput interface
```

### Simple Task Template
**Trigger:** Short content (< 200 chars), simple language patterns
**Focus:** Quick actionable extraction, basic context
**Examples:** "Call mom", "Buy groceries", "Meeting at 3pm"

### Complex Project Template
**Trigger:** Long content (> 200 chars), complex language
**Focus:** Comprehensive analysis, detailed planning, research insights
**Examples:** Business plans, research queries, multi-step projects

### Image Analysis Template
**Trigger:** `mode: 'image'` with base64 data
**Focus:** Visual recognition, context extraction, design insights
**Provider:** OpenAI GPT-4o (latest vision model)

### Voice Analysis Template
**Trigger:** `mode: 'voice'` with transcription
**Focus:** Intent extraction, urgency detection, contextual understanding

## AI Provider Routing

### Current Configuration (Post-Update)
**Primary:** OpenAI for ALL processing
**Reason:** Consistency over mixed providers
**Models:**
- Text Analysis: GPT-4o (latest model)
- Image Analysis: GPT-4o Vision
- Audio Transcription: Whisper-1

### Previous Mixed Approach (Deprecated)
- ~~OpenAI for simple text/images~~
- ~~Claude for complex analysis~~
- **Issue:** Inconsistent output formats and quality

## Title Enforcement System

### Newspaper Headline Rules
1. **Length:** 3-5 words maximum
2. **Style:** Proper case (Title Case)
3. **Content:** Remove articles (the, a, an), prepositions (in, on, at, to, for, of, with, by)
4. **Processing:** Take first 3 meaningful words from AI response

### Implementation
**Function:** `createNewspaperTitle(input: string): string`
**Location:** `server/utils/miraAIProcessing.ts`
**Process:**
1. Clean input (remove quotes, trim)
2. Split into words
3. Filter out filler words
4. Take first 3 words
5. Apply proper case formatting

### Examples
- Input: "I need to call my mom tomorrow about dinner plans"
- Output: "Call Mom Tomorrow"

- Input: "Research starting a mobile app development consultancy"
- Output: "Research Starting Mobile"

## Database Field Mappings

### Notes Table
- `content` → Final processed title (from MiraAIOutput.title)
- `aiContext` → MiraAIOutput.context
- `aiSuggestion` → MiraAIOutput.suggestion
- `richContext` → JSON.stringify(MiraAIOutput.richContext)
- `aiEnhanced` → true when AI processing completes

### Todos Table
- Created from `MiraAIOutput.todos` array
- Each todo item becomes separate database record
- Metadata fields mapped to todo properties

### Collections Table
- `collectionSuggestion` used for auto-assignment
- Affects note categorization and organization

## Error Handling and Fallbacks

### AI Processing Failures
**Fallback Response:**
```typescript
{
  title: extractFallbackTitle(input.content),
  context: "Content processed successfully",
  todos: [],
  intentType: 'personal-reflection',
  urgencyLevel: 'low',
  complexityScore: 1
}
```

### Title Extraction Fallback
**Function:** `extractFallbackTitle(content: string): string`
**Logic:** Take first few words from original content, apply same headline rules

## Integration Points

### Route Dependencies
1. **POST /api/notes** - Text note creation
2. **POST /api/notes/media** - Image/media upload
3. **POST /api/notes/voice** - Voice note processing
4. **PUT /api/notes/:id** - Note updates and reprocessing

### Frontend Dependencies
1. **Note Cards** - Display title, context, suggestion
2. **Note Detail** - Show rich context, todos, recommendations
3. **Todo Management** - Process extracted todos with metadata
4. **Collection System** - Use suggestion for auto-organization

### Background Processing
- All AI analysis runs asynchronously (non-blocking)
- Notes created immediately, enhanced via background processing
- Status tracked via `isProcessing` flag

## Testing and Validation

### Test Cases
**Location:** `server/utils/miraAIProcessing.ts` - TEST_CASES object

1. **Simple Reminder Test**
   - Input: "Call mom tomorrow at 2pm about dinner plans"
   - Expected Title: "Call Mom Tomorrow"
   - Validation: 3-word newspaper headline ✓

2. **Business Research Test**
   - Input: Complex consultancy research query
   - Expected Title: "Research Starting Mobile" 
   - Validation: Meaningful keyword extraction ✓

3. **Image Analysis Test**
   - Input: Image with contextual description
   - Expected: Visual recognition + context synthesis
   - Validation: GPT-4o vision processing ✓

## Performance Considerations

### Rate Limiting
- AI requests subject to OpenAI API limits
- Subscription tiers control usage quotas
- Graceful degradation when limits exceeded

### Caching Strategy
- No AI response caching (content is dynamic)
- Database-level caching for processed results
- Background processing prevents UI blocking

## Security and Privacy

### API Key Management
- OpenAI API key stored in environment variables
- No API keys exposed to frontend
- All AI processing server-side only

### Content Privacy
- User content sent to OpenAI for processing
- No content logging or storage on AI provider side
- Results stored in user's private database

## Monitoring and Debugging

### Logging Points
1. AI analysis start/completion
2. Title enforcement results
3. Error conditions and fallbacks
4. Processing time metrics

### Debug Information
- AI raw responses logged in development
- Structured output validation
- Title transformation tracking

## Future Enhancements

### Planned Improvements
1. **Context Awareness** - Previous note analysis for better suggestions
2. **Learning System** - Adapt to user preferences over time
3. **Multi-language Support** - Headline rules for different languages
4. **Advanced Scheduling** - Smart reminder timing based on content analysis

### Extension Points
- Plugin system for custom AI providers
- User-configurable prompt templates
- Custom field extraction rules
- Advanced collection auto-assignment logic

---

## Editing Instructions

This document serves as the single source of truth for Mira's AI system. When making changes:

1. **Update Interface Definitions** - Modify TypeScript interfaces in code first
2. **Update Prompt Templates** - Adjust templates in miraAIProcessing.ts
3. **Update Documentation** - Reflect changes in this document
4. **Test Integration** - Validate all dependencies and integration points
5. **Update Examples** - Ensure test cases remain current

All modifications should maintain backward compatibility and consistent output structure.