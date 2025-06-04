import Anthropic from '@anthropic-ai/sdk';

// Fragment completion patterns for predictive intelligence
export const FRAGMENT_COMPLETION_PATTERNS = {
  // Time-based fragments
  time_fragments: {
    triggers: ['tonight', 'tomorrow', 'today', 'morning', 'afternoon', 'evening', 'weekend'],
    completions: {
      'restaurant tonight': 'Find and book a restaurant for dinner tonight',
      'gym tomorrow': 'Plan workout routine and go to gym tomorrow',
      'dentist morning': 'Schedule dentist appointment for tomorrow morning',
      'meeting afternoon': 'Schedule or prepare for afternoon meeting',
      'grocery weekend': 'Plan grocery shopping trip for the weekend'
    }
  },
  
  // Person/place pickup fragments
  pickup_fragments: {
    triggers: ['pick up', 'pickup', 'get', 'collect'],
    patterns: [
      { input: /^(\w+)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))$/i, 
        completion: 'Reminder to pick up {name} at {time}' },
      { input: /^pick\s*up\s+(\w+)$/i, 
        completion: 'Reminder to pick up {name}' },
      { input: /^(\w+)\s+pickup$/i, 
        completion: 'Reminder for {name} pickup' }
    ]
  },
  
  // Device/item maintenance
  fix_replace_fragments: {
    triggers: ['fix', 'repair', 'broken', 'replace', 'new'],
    completions: {
      'fix laptop': 'Troubleshoot and repair laptop issues, research solutions',
      'new laptop': 'Research, compare, and purchase a new laptop',
      'repair car': 'Schedule car repair appointment and get quotes',
      'replace phone': 'Research and purchase new phone replacement',
      'fix wifi': 'Troubleshoot wifi connectivity issues'
    }
  },
  
  // Learning/skill development
  learning_fragments: {
    triggers: ['learn', 'study', 'course', 'tutorial'],
    completions: {
      'learn python': 'Create learning plan and start Python programming course',
      'study spanish': 'Set up Spanish language learning routine and resources',
      'guitar lessons': 'Find and schedule guitar lesson instructor',
      'cooking class': 'Research and enroll in cooking classes'
    }
  },
  
  // Travel planning
  travel_fragments: {
    triggers: ['trip', 'visit', 'vacation', 'travel'],
    completions: {
      'paris summer': 'Plan and book summer trip to Paris',
      'visit mom': 'Plan visit to see mom, check dates and travel',
      'beach weekend': 'Plan beach weekend getaway trip',
      'business trip': 'Organize business trip logistics and bookings'
    }
  },
  
  // Shopping/purchasing
  shopping_fragments: {
    triggers: ['buy', 'get', 'need', 'order'],
    completions: {
      'buy groceries': 'Create grocery list and plan shopping trip',
      'order pizza': 'Order pizza for dinner delivery',
      'get flowers': 'Purchase flowers for special occasion',
      'need shoes': 'Research and purchase new shoes'
    }
  },
  
  // Health/appointments
  health_fragments: {
    triggers: ['doctor', 'dentist', 'appointment', 'checkup'],
    completions: {
      'dentist': 'Schedule dentist appointment for cleaning and checkup',
      'doctor checkup': 'Schedule annual doctor checkup appointment',
      'eye exam': 'Schedule eye examination appointment',
      'pharmacy': 'Pick up prescription from pharmacy'
    }
  }
};

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

export interface FragmentCompletion {
  originalInput: string;
  completedIntent: string;
  confidence: number;
  category: string;
  reasoning: string;
}

export interface AmbiguousInput {
  originalInput: string;
  possibleIntents: {
    intent: string;
    likelihood: number;
    category: string;
    reasoning: string;
    immediateActions: string[];
  }[];
  clarificationQuestion: string;
  urgencyLevel: 'high' | 'medium' | 'low';
}

export interface TaxonomyAnalysis {
  category: string;
  confidence: number;
  microQuestions: string[];
  suggestedFollowUps: string[];
  contextualInsights: string[];
  fragmentCompletion?: FragmentCompletion;
  ambiguousInput?: AmbiguousInput;
}

// Predictive fragment completion function
export function completeFragment(input: string): FragmentCompletion | null {
  const inputLower = input.toLowerCase().trim();
  
  // Check exact matches first
  for (const [categoryKey, categoryData] of Object.entries(FRAGMENT_COMPLETION_PATTERNS)) {
    if ('completions' in categoryData) {
      for (const [fragment, completion] of Object.entries(categoryData.completions)) {
        if (inputLower === fragment.toLowerCase()) {
          return {
            originalInput: input,
            completedIntent: completion,
            confidence: 0.95,
            category: categoryKey,
            reasoning: `Exact match for common ${categoryKey.replace('_', ' ')} pattern`
          };
        }
      }
    }
    
    // Check pattern matches for pickup fragments
    if ('patterns' in categoryData) {
      for (const pattern of categoryData.patterns) {
        const match = input.match(pattern.input);
        if (match) {
          let completion = pattern.completion;
          if (match[1]) completion = completion.replace('{name}', match[1]);
          if (match[2]) completion = completion.replace('{time}', match[2]);
          
          return {
            originalInput: input,
            completedIntent: completion,
            confidence: 0.9,
            category: categoryKey,
            reasoning: `Pattern match for ${categoryKey.replace('_', ' ')}`
          };
        }
      }
    }
  }
  
  // Fuzzy matching for partial completions
  for (const [categoryKey, categoryData] of Object.entries(FRAGMENT_COMPLETION_PATTERNS)) {
    if ('completions' in categoryData) {
      for (const [fragment, completion] of Object.entries(categoryData.completions)) {
        const fragmentWords = fragment.toLowerCase().split(' ');
        const inputWords = inputLower.split(' ');
        
        // Check if input contains key words from fragment
        const matchedWords = fragmentWords.filter(word => 
          inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
        );
        
        const similarity = matchedWords.length / fragmentWords.length;
        
        if (similarity >= 0.6) {
          return {
            originalInput: input,
            completedIntent: completion,
            confidence: similarity * 0.8,
            category: categoryKey,
            reasoning: `Partial match (${Math.round(similarity * 100)}% similarity) for ${categoryKey.replace('_', ' ')}`
          };
        }
      }
    }
  }
  
  return null;
}

// Ambiguous input detection for single-word or highly ambiguous inputs
export function detectAmbiguousInput(input: string, userContext?: any): AmbiguousInput | null {
  const inputLower = input.toLowerCase().trim();
  
  // Define ambiguous patterns with multiple interpretations
  const ambiguousPatterns: Record<string, AmbiguousInput> = {
    'chicago': {
      originalInput: input,
      possibleIntents: [
        {
          intent: 'Plan trip to Chicago',
          likelihood: 0.4,
          category: 'travel_planning',
          reasoning: 'Most common use case for city names is travel planning',
          immediateActions: [
            'Check flight prices to Chicago',
            'Research hotels and accommodations',
            'Look up Chicago attractions and activities',
            'Check weather forecast for travel dates'
          ]
        },
        {
          intent: 'Watch Chicago (movie/musical)',
          likelihood: 0.3,
          category: 'entertainment',
          reasoning: 'Chicago is a popular movie and Broadway musical',
          immediateActions: [
            'Find Chicago movie streaming options',
            'Check local theater showtimes for Chicago musical',
            'Read reviews and ratings',
            'Purchase tickets if interested'
          ]
        },
        {
          intent: 'Chicago-related research or reference',
          likelihood: 0.3,
          category: 'research_inquiry',
          reasoning: 'Could be researching Chicago for work, school, or personal interest',
          immediateActions: [
            'Research Chicago history and facts',
            'Look up Chicago demographics and statistics',
            'Find Chicago news and current events',
            'Explore Chicago cultural information'
          ]
        }
      ],
      clarificationQuestion: 'I see you mentioned Chicago. Are you planning a trip there, looking for entertainment options like the movie/musical, or researching something specific about the city?',
      urgencyLevel: 'high'
    },
    
    'paris': {
      originalInput: input,
      possibleIntents: [
        {
          intent: 'Plan trip to Paris, France',
          likelihood: 0.7,
          category: 'travel_planning',
          reasoning: 'Paris is primarily known as a travel destination',
          immediateActions: [
            'Check flight prices to Paris',
            'Research Paris hotels and neighborhoods',
            'Look up Paris attractions (Eiffel Tower, Louvre, etc.)',
            'Check visa requirements for France'
          ]
        },
        {
          intent: 'Paris, Texas or other Paris locations',
          likelihood: 0.2,
          category: 'travel_planning',
          reasoning: 'Could refer to other cities named Paris',
          immediateActions: [
            'Clarify which Paris location',
            'Research local Paris attractions',
            'Check travel options to specific Paris'
          ]
        },
        {
          intent: 'Paris-related research or cultural reference',
          likelihood: 0.1,
          category: 'research_inquiry',
          reasoning: 'Could be studying French culture, history, or language',
          immediateActions: [
            'Research Paris history and culture',
            'Look up French language resources',
            'Find Paris photography or art references'
          ]
        }
      ],
      clarificationQuestion: 'Are you planning a trip to Paris, France, or looking into something else Paris-related?',
      urgencyLevel: 'medium'
    },

    'doctor': {
      originalInput: input,
      possibleIntents: [
        {
          intent: 'Schedule doctor appointment',
          likelihood: 0.6,
          category: 'health_fragments',
          reasoning: 'Most common reason to mention doctor',
          immediateActions: [
            'Call doctor\'s office to schedule appointment',
            'Check insurance coverage and copay',
            'Prepare list of symptoms or concerns',
            'Gather medical history and current medications'
          ]
        },
        {
          intent: 'Find a new doctor',
          likelihood: 0.3,
          category: 'health_fragments',
          reasoning: 'May need to find a new primary care physician',
          immediateActions: [
            'Search for doctors accepting new patients',
            'Check insurance provider network',
            'Read doctor reviews and ratings',
            'Verify office locations and hours'
          ]
        },
        {
          intent: 'Doctor-related question or research',
          likelihood: 0.1,
          category: 'research_inquiry',
          reasoning: 'Could be researching medical information',
          immediateActions: [
            'Research medical symptoms or conditions',
            'Look up medical procedures or treatments',
            'Find reputable medical information sources'
          ]
        }
      ],
      clarificationQuestion: 'Do you need to schedule an appointment with your doctor, find a new doctor, or are you looking for medical information?',
      urgencyLevel: 'high'
    },

    'gym': {
      originalInput: input,
      possibleIntents: [
        {
          intent: 'Go to gym for workout',
          likelihood: 0.5,
          category: 'health_fitness',
          reasoning: 'Most common gym-related intent',
          immediateActions: [
            'Check gym hours and availability',
            'Plan workout routine',
            'Pack gym bag with essentials',
            'Check if gym equipment is available'
          ]
        },
        {
          intent: 'Join a new gym',
          likelihood: 0.4,
          category: 'health_fitness',
          reasoning: 'May be looking for gym membership',
          immediateActions: [
            'Research local gyms and pricing',
            'Compare gym amenities and equipment',
            'Read member reviews and ratings',
            'Schedule gym tours and consultations'
          ]
        },
        {
          intent: 'Cancel or modify gym membership',
          likelihood: 0.1,
          category: 'health_fitness',
          reasoning: 'May need to make membership changes',
          immediateActions: [
            'Review gym membership contract',
            'Contact gym customer service',
            'Understand cancellation policies'
          ]
        }
      ],
      clarificationQuestion: 'Are you planning to work out at the gym, looking to join a new gym, or need help with your current membership?',
      urgencyLevel: 'medium'
    }
  };

  return ambiguousPatterns[inputLower] || null;
}

export async function analyzeTaxonomy(content: string): Promise<TaxonomyAnalysis | null> {
  const contentLower = content.toLowerCase();
  
  // First try fragment completion
  const fragmentCompletion = completeFragment(content);
  
  // Check for ambiguous input if no high-confidence fragment completion
  let ambiguousInput = null;
  if (!fragmentCompletion || fragmentCompletion.confidence < 0.8) {
    ambiguousInput = detectAmbiguousInput(content);
  }
  
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

  if (matches.length === 0 && !fragmentCompletion && !ambiguousInput) return null;

  // Get the best match or use fragment completion category
  let bestMatch;
  if (matches.length > 0) {
    bestMatch = matches.sort((a, b) => b.confidence - a.confidence)[0];
    if (bestMatch.confidence < 0.2 && !fragmentCompletion && !ambiguousInput) return null;
  }

  const category = fragmentCompletion?.category || ambiguousInput?.possibleIntents[0]?.category || bestMatch?.category || 'general';
  const confidence = fragmentCompletion?.confidence || (ambiguousInput ? 0.3 : bestMatch?.confidence) || 0.5;
  
  return {
    category,
    confidence,
    microQuestions: bestMatch?.pattern?.microQuestions || [],
    suggestedFollowUps: bestMatch?.pattern?.followUpActions || [],
    contextualInsights: generateContextualInsights(category, content),
    fragmentCompletion: fragmentCompletion ?? undefined,
    ambiguousInput: ambiguousInput ?? undefined
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

// Enhanced AI analysis that incorporates taxonomy patterns and fragment completion
export async function enhancedAIAnalysis(content: string, mode: string): Promise<any> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // First, analyze taxonomy and get fragment completion
  const taxonomyAnalysis = await analyzeTaxonomy(content);
  
  // Use completed intent if available, otherwise use original content
  const analysisContent = taxonomyAnalysis?.fragmentCompletion?.completedIntent || content;
  
  let enhancedPrompt = `You are Mira, an AI with superhuman predictive intelligence. You understand incomplete thoughts and complete the full intended meaning.

ORIGINAL INPUT: "${content}"`;

  if (taxonomyAnalysis?.fragmentCompletion) {
    enhancedPrompt += `

🧠 PREDICTIVE COMPLETION DETECTED:
Original fragment: "${content}"
Completed intent: "${taxonomyAnalysis.fragmentCompletion.completedIntent}"
Confidence: ${Math.round(taxonomyAnalysis.fragmentCompletion.confidence * 100)}%
Reasoning: ${taxonomyAnalysis.fragmentCompletion.reasoning}

ANALYZE THE COMPLETED INTENT: "${taxonomyAnalysis.fragmentCompletion.completedIntent}"`;
  } else {
    enhancedPrompt += `

ANALYZE THE INPUT: "${content}"`;
  }
  
  if (taxonomyAnalysis && taxonomyAnalysis.microQuestions.length > 0) {
    enhancedPrompt += `

DETECTED PATTERN: ${taxonomyAnalysis.category} (${Math.round(taxonomyAnalysis.confidence * 100)}% confidence)

MICRO-QUESTIONS TO ADDRESS:
${taxonomyAnalysis.microQuestions.map(q => `- ${q}`).join('\n')}

SUGGESTED FOLLOW-UPS:
${taxonomyAnalysis.suggestedFollowUps.map(f => `- ${f}`).join('\n')}

CONTEXTUAL INSIGHTS:
${taxonomyAnalysis.contextualInsights.map(i => `- ${i}`).join('\n')}`;
  }

  enhancedPrompt += `

Provide intelligent analysis with complexity scoring, task hierarchy for complex projects, and predictive next steps. Focus on authentic research and actionable intelligence for the COMPLETED INTENT, not just the fragment.`;

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
    // Clean the response text - remove markdown code blocks if present
    let cleanedContent = textContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const result = JSON.parse(cleanedContent);
    // Add taxonomy analysis to the result
    if (taxonomyAnalysis) {
      result.taxonomyInsights = taxonomyAnalysis;
    }
    return result;
  } catch (parseError) {
    console.error('Failed to parse enhanced AI response:', parseError);
    console.log('Raw response:', textContent);
    // Return a basic fallback response
    return {
      enhancedContent: content,
      complexityScore: 3,
      intentType: 'simple-task',
      urgencyLevel: 'medium',
      todos: [],
      collectionSuggestion: {
        name: "General Notes",
        icon: "lightbulb",
        color: "blue"
      }
    };
  }
}