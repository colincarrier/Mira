import Anthropic from '@anthropic-ai/sdk';

// Micro-question patterns for high-frequency input types
export const AI_TAXONOMY_PATTERNS = {
  // Food & Restaurants
  food_decision: {
    triggers: ['restaurant', 'dinner', 'lunch', 'eat', 'food', 'hungry'],
    microQuestions: [
      'What cuisine type are you craving?',
      'What\'s your budget range?',
      'How far are you willing to travel?',
      'Dining alone or with others?',
      'Any dietary restrictions?'
    ],
    followUpActions: [
      'Check restaurant hours and availability',
      'Read recent reviews',
      'Compare menu prices',
      'Check if reservations needed'
    ]
  },

  // Shopping & Purchases
  purchase_decision: {
    triggers: ['buy', 'purchase', 'need', 'shopping', 'get'],
    microQuestions: [
      'What\'s your max budget?',
      'When do you need this by?',
      'Any specific brand preferences?',
      'Where do you prefer to shop?',
      'Is this a replacement or new purchase?'
    ],
    followUpActions: [
      'Compare prices across retailers',
      'Check for current deals or coupons',
      'Read customer reviews',
      'Verify return policy'
    ]
  },

  // Travel Planning
  travel_planning: {
    triggers: ['trip', 'travel', 'vacation', 'visit', 'fly', 'hotel'],
    microQuestions: [
      'What are your travel dates?',
      'What\'s your total budget?',
      'Who\'s traveling with you?',
      'What type of experience do you want?',
      'Any must-see attractions or activities?'
    ],
    followUpActions: [
      'Check flight prices and schedules',
      'Research accommodation options',
      'Look into local transportation',
      'Find popular attractions and activities',
      'Check weather for travel dates'
    ]
  },

  // Learning & Skill Development
  learning_goal: {
    triggers: ['learn', 'study', 'course', 'skill', 'practice', 'improve'],
    microQuestions: [
      'What\'s your current skill level?',
      'How much time can you dedicate daily/weekly?',
      'Do you prefer structured courses or self-directed learning?',
      'What\'s your learning budget?',
      'What\'s your target proficiency timeline?'
    ],
    followUpActions: [
      'Find highly-rated courses or tutorials',
      'Identify practice resources and communities',
      'Create a structured learning schedule',
      'Set measurable milestones'
    ]
  },

  // Health & Fitness
  health_fitness: {
    triggers: ['workout', 'exercise', 'gym', 'health', 'diet', 'weight'],
    microQuestions: [
      'What are your specific health/fitness goals?',
      'What\'s your current activity level?',
      'Any physical limitations or injuries?',
      'How much time can you commit?',
      'Do you prefer home or gym workouts?'
    ],
    followUpActions: [
      'Research appropriate workout programs',
      'Find local fitness facilities or classes',
      'Consider nutrition planning',
      'Track progress methods'
    ]
  },

  // Career & Professional
  career_development: {
    triggers: ['job', 'career', 'work', 'interview', 'resume', 'promotion'],
    microQuestions: [
      'What\'s your current career stage?',
      'What specific role or field interests you?',
      'What\'s your experience level?',
      'Are you looking locally or open to relocation?',
      'What\'s your salary expectation range?'
    ],
    followUpActions: [
      'Research job market trends',
      'Update resume and LinkedIn profile',
      'Identify skill gaps to address',
      'Network with industry professionals'
    ]
  },

  // Home & Living
  home_improvement: {
    triggers: ['home', 'house', 'apartment', 'room', 'decorate', 'furniture'],
    microQuestions: [
      'What\'s your budget for this project?',
      'What\'s the timeline?',
      'DIY or hiring professionals?',
      'What style/aesthetic do you prefer?',
      'Any functional requirements?'
    ],
    followUpActions: [
      'Get quotes from contractors if needed',
      'Research materials and costs',
      'Check local permits if required',
      'Find design inspiration and references'
    ]
  },

  // Entertainment & Events
  entertainment: {
    triggers: ['movie', 'show', 'concert', 'event', 'weekend', 'fun'],
    microQuestions: [
      'What type of entertainment do you enjoy?',
      'What\'s your budget?',
      'Preferred date/time?',
      'Going alone or with others?',
      'Any location preferences?'
    ],
    followUpActions: [
      'Check event schedules and ticket availability',
      'Compare prices across platforms',
      'Read reviews or ratings',
      'Plan transportation and timing'
    ]
  },

  // Financial Planning
  financial_planning: {
    triggers: ['money', 'budget', 'save', 'invest', 'debt', 'loan', 'financial'],
    microQuestions: [
      'What\'s your current financial situation?',
      'What are your financial goals?',
      'What\'s your risk tolerance?',
      'Timeline for achieving goals?',
      'Any existing debts or obligations?'
    ],
    followUpActions: [
      'Research financial products and services',
      'Compare rates and fees',
      'Consider consulting a financial advisor',
      'Create a structured plan with milestones'
    ]
  }
};

export interface TaxonomyAnalysis {
  category: string;
  confidence: number;
  microQuestions: string[];
  suggestedFollowUps: string[];
  contextualInsights: string[];
}

export async function analyzeTaxonomy(content: string): Promise<TaxonomyAnalysis | null> {
  const contentLower = content.toLowerCase();
  
  // Find matching patterns
  const matches = Object.entries(AI_TAXONOMY_PATTERNS).map(([category, pattern]) => {
    const triggerMatches = pattern.triggers.filter(trigger => 
      contentLower.includes(trigger)
    ).length;
    
    const confidence = triggerMatches / pattern.triggers.length;
    
    return {
      category,
      confidence,
      pattern
    };
  }).filter(match => match.confidence > 0);

  if (matches.length === 0) return null;

  // Get the best match
  const bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
  
  if (bestMatch.confidence < 0.2) return null; // Minimum confidence threshold

  return {
    category: bestMatch.category,
    confidence: bestMatch.confidence,
    microQuestions: bestMatch.pattern.microQuestions,
    suggestedFollowUps: bestMatch.pattern.followUpActions,
    contextualInsights: generateContextualInsights(bestMatch.category, content)
  };
}

function generateContextualInsights(category: string, content: string): string[] {
  // Generate specific insights based on category and content
  const insights: Record<string, string[]> = {
    food_decision: [
      'Consider checking recent reviews for food safety',
      'Peak dining times may require reservations',
      'Many restaurants offer online ordering for pickup'
    ],
    purchase_decision: [
      'Compare prices across at least 3 retailers',
      'Check return policies before purchasing',
      'Look for seasonal sales or discount codes'
    ],
    travel_planning: [
      'Book flights on Tuesday-Thursday for better rates',
      'Check visa requirements well in advance',
      'Consider travel insurance for international trips'
    ],
    learning_goal: [
      'Start with free resources to gauge interest',
      'Join communities for motivation and support',
      'Set small, achievable milestones'
    ],
    health_fitness: [
      'Consult healthcare provider before major changes',
      'Start gradually to avoid injury',
      'Track progress to maintain motivation'
    ],
    career_development: [
      'Update your skills to match current market demands',
      'Network actively in your target industry',
      'Practice interview skills regularly'
    ],
    home_improvement: [
      'Get multiple quotes for major projects',
      'Check local building codes and permits',
      'Consider seasonal timing for outdoor work'
    ],
    entertainment: [
      'Book popular events early for better selection',
      'Check cancellation policies',
      'Consider transportation and parking'
    ],
    financial_planning: [
      'Emergency fund should cover 3-6 months expenses',
      'Diversify investments to reduce risk',
      'Review and adjust plans annually'
    ]
  };

  return insights[category] || [];
}

// Enhanced AI analysis that incorporates taxonomy patterns
export async function enhancedAIAnalysis(content: string, mode: string): Promise<any> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // First, analyze taxonomy
  const taxonomyAnalysis = await analyzeTaxonomy(content);
  
  let enhancedPrompt = `You are Mira, analyzing this input: "${content}"`;
  
  if (taxonomyAnalysis) {
    enhancedPrompt += `

DETECTED PATTERN: ${taxonomyAnalysis.category} (${Math.round(taxonomyAnalysis.confidence * 100)}% confidence)

MICRO-QUESTIONS TO ADDRESS:
${taxonomyAnalysis.microQuestions.map(q => `- ${q}`).join('\n')}

SUGGESTED FOLLOW-UPS:
${taxonomyAnalysis.suggestedFollowUps.map(f => `- ${f}`).join('\n')}

CONTEXTUAL INSIGHTS:
${taxonomyAnalysis.contextualInsights.map(i => `- ${i}`).join('\n')}

Use this pattern recognition to provide more targeted, specific assistance.`;
  }

  enhancedPrompt += `

Provide intelligent analysis with complexity scoring, task hierarchy for complex projects, and predictive next steps. Focus on authentic research and actionable intelligence.`;

  // Continue with regular AI analysis using the enhanced prompt...
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    system: 'You are Mira, an intelligent personal assistant. Always respond with valid JSON only.',
    messages: [
      {
        role: 'user',
        content: enhancedPrompt
      }
    ]
  });

  const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
  
  try {
    const result = JSON.parse(textContent);
    // Add taxonomy analysis to the result
    if (taxonomyAnalysis) {
      result.taxonomyInsights = taxonomyAnalysis;
    }
    return result;
  } catch (parseError) {
    console.error('Failed to parse enhanced AI response:', parseError);
    return null;
  }
}