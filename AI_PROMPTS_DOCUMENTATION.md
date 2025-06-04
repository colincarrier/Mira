# AI Intelligence Framework - Prompts & Implementation

## Core AI Philosophy
Mira acts as a superhuman AI assistant that predictively completes incomplete user inputs and always stays 2 steps ahead. Every input is treated as a note with intelligent enhancement.

## AI Taxonomy Engine Prompts

### Fragment Completion System
```javascript
export const FRAGMENT_COMPLETION_PATTERNS = {
  // Restaurant/Food
  'restaurant tonight': 'Find and book a restaurant for dinner tonight',
  'dinner reservation': 'Make a dinner reservation for tonight',
  'food delivery': 'Order food delivery for tonight',
  
  // Pickup/Transportation
  'atlas 3pm': 'Reminder to pick up Atlas at 3pm',
  'pickup kids': 'Reminder to pick up kids from school',
  'airport pickup': 'Arrange airport pickup transportation',
  
  // Meeting/Events
  'call mom': 'Schedule call with mom',
  'team meeting': 'Schedule team meeting for this week',
  'dentist appointment': 'Book dentist appointment',
  
  // Shopping/Errands
  'grocery store': 'Create grocery shopping list and plan store visit',
  'gas station': 'Reminder to fill up gas tank',
  'pharmacy pickup': 'Pick up prescription from pharmacy'
};
```

### Ambiguous Input Detection
```javascript
export const AI_TAXONOMY_PATTERNS = {
  // Location-based ambiguity
  'chicago': {
    intents: [
      'Travel planning to Chicago',
      'Weather check for Chicago', 
      'Restaurant recommendations in Chicago',
      'Business research about Chicago'
    ]
  },
  
  // Time-based ambiguity
  'tomorrow': {
    intents: [
      'Schedule something for tomorrow',
      'Weather forecast for tomorrow',
      'Deadline reminder for tomorrow',
      'Travel plans for tomorrow'
    ]
  }
};
```

## Claude Sonnet 4 Analysis Prompts

### Enhanced Content Analysis
```
You are Mira, an AI assistant with superhuman intelligence for predictive task completion and contextual understanding.

Analyze this input and provide:
1. Enhanced content with full context completion
2. Complexity score (1-10)
3. Intent type classification
4. Urgency level assessment
5. Structured task hierarchy
6. Predictive next steps
7. Success factors and potential obstacles
8. Resource requirements
9. Time estimates

For incomplete inputs like "restaurant tonight", complete the full intent: "Find and book a restaurant for dinner tonight with good reviews nearby, considering dietary preferences and budget."

Always think 2 steps ahead of what the user actually needs.
```

### Collection Suggestion Logic
```
Based on the content analysis, suggest appropriate collections with:
- Semantic categorization (Personal, Work, Health, Travel, etc.)
- Color coding for visual organization
- Icon selection for quick recognition
- Hierarchical organization for complex projects
```

## AI Processing Features

### Real-time Intelligence
- Fragment completion for partial inputs
- Ambiguous input clarification with multiple interpretations
- Contextual micro-questions for deeper understanding
- Predictive follow-up suggestions
- Complex project breakdown into actionable phases

### Predictive Capabilities
- Time-to-completion estimates
- Success factor identification
- Obstacle prediction and mitigation
- Resource requirement analysis
- Skill gap identification

### Knowledge Connections
- Related topic suggestions
- Cross-reference with existing notes
- Pattern recognition across user behavior
- Contextual learning and adaptation

## Implementation Files
- `server/anthropic.ts` - Claude Sonnet 4 integration
- `server/ai-taxonomy-engine.ts` - Pattern recognition and completion
- `client/src/components/ai-taxonomy-demo.tsx` - Testing interface
- `client/src/pages/ai-demo.tsx` - Full demonstration
- `client/src/pages/test-ai.tsx` - Simple testing

## Testing Scenarios
1. Fragment completion: "restaurant tonight" → Enhanced booking intent
2. Pickup reminders: "Atlas 3pm" → Contextual reminder creation
3. Ambiguous inputs: "chicago" → Multiple interpretation options
4. Complex projects: Automatic task hierarchy generation
5. Predictive intelligence: Next steps and resource planning