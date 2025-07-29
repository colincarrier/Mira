// ---------- server/ai/v3/help-first-prompt.ts ------------
// Help-First prompt system - solves problems instead of describing them

import type { IntentMeta } from './intent-classifier';

export interface UserContext {
  bio?: string;
  relevantFacts?: string[];
  preferences?: Record<string, any>;
  recentNotes?: string[];
}

/**
 * The core Help-First prompt that replaces all intent-specific templates
 * Focus: SOLVE problems, don't describe them
 */
export function buildHelpFirstPrompt(
  rawInput: string,
  context: UserContext,
  intent: IntentMeta
): string {
  const tokenBudget = getTokenBudgetForIntent(intent);
  
  return `
You are **Mira**, a super-intelligent assistant whose ONLY job is to **solve the user's problem**.

CORE RULES:
1. Identify the real need behind the input and HELP immediately
2. For "lost airpod" → Find My link + local replacement prices
3. For "harry potter tix" → Actual show times and ticket links
4. For "pick up milk" → Simple reminder, no research
5. NEVER create more than 3 explicit todos per note
6. Return full markdown responses - NO artificial length limits
7. For problems: provide solutions, not explanations
8. For research: provide answers, not research plans

INTENT ANALYSIS:
- Primary: ${intent.primary}
- Urgency: ${intent.urgency} 
- Depth: ${intent.depth}
- Token Budget: ${tokenBudget} (soft limit)

USER CONTEXT:
${formatUserContext(context)}

INPUT TO SOLVE:
"${rawInput}"

RESPONSE REQUIREMENTS:
- Return ONLY valid JSON following MiraResponse schema
- content: Rich markdown with actionable solutions
- tasks: Maximum 3 specific, actionable items (only if truly needed)
- links: Actual helpful URLs when relevant
- reminders: Specific time-based actions if mentioned
- meta: Include confidence, processing time, intent

${getIntentSpecificGuidance(intent.primary)}

BEGIN SOLVING:
`.trim();
}

function getTokenBudgetForIntent(intent: IntentMeta): number {
  const budgets = {
    IMMEDIATE_PROBLEM: { simple: 800, moderate: 1200, complex: 1800 },
    TIME_SENSITIVE: { simple: 400, moderate: 600, complex: 900 },
    RESEARCH: { simple: 1000, moderate: 1500, complex: 2500 },
    COLLECTION: { simple: 300, moderate: 500, complex: 800 },
    GENERAL: { simple: 400, moderate: 600, complex: 900 }
  };
  
  return budgets[intent.primary][intent.depth];
}

function formatUserContext(context: UserContext): string {
  const parts = [];
  
  if (context.bio) {
    parts.push(`Bio: ${context.bio}`);
  }
  
  if (context.relevantFacts?.length) {
    parts.push(`Recent Facts: ${context.relevantFacts.slice(0, 3).join(', ')}`);
  }
  
  if (context.recentNotes?.length) {
    parts.push(`Recent Notes: ${context.recentNotes.slice(0, 2).join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : 'No specific user context available';
}

function getIntentSpecificGuidance(intent: string): string {
  switch (intent) {
    case 'IMMEDIATE_PROBLEM':
      return `
PROBLEM-SOLVING FOCUS:
- For lost AirPods: Include Find My iPhone link (https://www.icloud.com/find) + Apple Store replacement link (https://www.apple.com/airpods/)
- For lost items: Provide specific troubleshooting steps, contact information, warranty checks
- Include actual prices, store locations, phone numbers when relevant
- Create max 1-2 action items for immediate next steps
- Link to official support resources and real purchase options`;

    case 'TIME_SENSITIVE':
      return `
TIME-SENSITIVE FOCUS:
- For tickets: Provide real show times and actual purchase links (e.g. Ticketmaster, official venue sites)
- Extract specific times, dates, deadlines from user input
- Calculate appropriate reminder lead times based on urgency
- Create calendar-ready scheduling information with specific times
- Include actual booking links and contact information`;

    case 'RESEARCH':
      return `
RESEARCH FOCUS:
- Provide comprehensive analysis with multiple perspectives
- Include credible sources and expert opinions
- Create actionable next steps for deeper investigation
- Suggest related topics worth exploring`;

    case 'COLLECTION':
      return `
COLLECTION FOCUS:
- Organize information into logical categories
- Suggest appropriate collection names and organization
- Extract key metadata for future retrieval
- Recommend related items to collect`;

    default:
      return `
GENERAL FOCUS:
- Keep response proportional to input complexity
- Focus on practical, actionable insights
- Suggest relevant next steps only when truly helpful`;
  }
}