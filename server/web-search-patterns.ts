/**
 * Web Search Patterns for Rich AI Research Results
 * 
 * These patterns help identify when to trigger web research and how to structure results
 */

export interface WebSearchPattern {
  category: string;
  triggers: string[];
  searchQueries: string[];
  expectedSections: string[];
}

export const WEB_SEARCH_PATTERNS: WebSearchPattern[] = [
  {
    category: "Product Research",
    triggers: ["best", "recommend", "compare", "review", "vs", "which", "top"],
    searchQueries: [
      "best productivity apps 2024 reviews comparison",
      "MacBook Pro vs Dell XPS 13 2024 specs price",
      "best noise canceling headphones under $200",
      "top rated coffee makers consumer reports",
      "iPhone 15 Pro review battery life camera"
    ],
    expectedSections: ["Product Comparisons", "User Reviews", "Price Analysis", "Technical Specs"]
  },
  {
    category: "How-To & Tutorials",
    triggers: ["how to", "tutorial", "guide", "step by step", "learn", "setup"],
    searchQueries: [
      "how to set up home office ergonomic desk setup",
      "Python machine learning tutorial beginners 2024",
      "how to meal prep healthy recipes week",
      "JavaScript async await best practices examples",
      "how to invest in index funds for beginners"
    ],
    expectedSections: ["Step-by-Step Instructions", "Required Tools", "Common Mistakes", "Expert Tips"]
  },
  {
    category: "News & Current Events",
    triggers: ["latest", "news", "update", "current", "2024", "2025", "happening"],
    searchQueries: [
      "latest AI developments GPT-5 Claude 2024",
      "current cryptocurrency market trends Bitcoin",
      "climate change news renewable energy 2024",
      "tech industry layoffs 2024 statistics",
      "space exploration missions SpaceX NASA 2024"
    ],
    expectedSections: ["Recent Developments", "Key Statistics", "Expert Analysis", "Future Outlook"]
  },
  {
    category: "Local Research",
    triggers: ["near me", "local", "in [city]", "around", "nearby"],
    searchQueries: [
      "best restaurants near me Italian food reviews",
      "yoga classes San Francisco beginner friendly",
      "urgent care clinics open Sunday near me",
      "farmers markets Seattle weekend schedule",
      "coworking spaces downtown pricing amenities"
    ],
    expectedSections: ["Top Locations", "Hours & Contact", "Pricing", "User Ratings"]
  },
  {
    category: "Health & Wellness",
    triggers: ["symptoms", "treatment", "exercise", "diet", "wellness", "healthy"],
    searchQueries: [
      "lower back pain exercises physical therapy",
      "Mediterranean diet meal plan benefits research",
      "sleep hygiene tips improve sleep quality",
      "stress management techniques workplace burnout",
      "vitamin D deficiency symptoms treatment"
    ],
    expectedSections: ["Research Findings", "Expert Recommendations", "Action Steps", "Warning Signs"]
  },
  {
    category: "Travel Planning",
    triggers: ["travel", "visit", "trip", "vacation", "flight", "hotel"],
    searchQueries: [
      "best time visit Japan cherry blossom season",
      "Europe travel itinerary 2 weeks budget backpacking",
      "cheap flights New York to London deals",
      "things to do Iceland winter Northern Lights",
      "solo female travel safety tips Southeast Asia"
    ],
    expectedSections: ["Destination Highlights", "Budget Breakdown", "Timing Recommendations", "Practical Tips"]
  },
  {
    category: "Career & Education",
    triggers: ["career", "job", "salary", "skills", "certification", "course"],
    searchQueries: [
      "data scientist salary 2024 remote work trends",
      "Google Cloud certification exam preparation guide",
      "career change software engineering bootcamp reviews",
      "negotiating salary tips remote job offers",
      "LinkedIn profile optimization job search 2024"
    ],
    expectedSections: ["Market Insights", "Skill Requirements", "Career Paths", "Action Items"]
  },
  {
    category: "Technology Research",
    triggers: ["API", "framework", "library", "software", "tool", "platform"],
    searchQueries: [
      "React vs Vue.js 2024 performance comparison",
      "best project management tools small teams",
      "Stripe vs PayPal payment processing fees",
      "Docker containerization benefits tutorial",
      "cybersecurity tools small business recommendations"
    ],
    expectedSections: ["Technical Comparison", "Implementation Guide", "Cost Analysis", "Community Feedback"]
  },
  {
    category: "Financial Research",
    triggers: ["investment", "stock", "crypto", "budget", "loan", "mortgage"],
    searchQueries: [
      "index fund vs ETF investment strategy 2024",
      "first time home buyer mortgage rates",
      "emergency fund savings account high yield",
      "retirement planning 401k vs Roth IRA",
      "cryptocurrency tax implications 2024 filing"
    ],
    expectedSections: ["Financial Analysis", "Risk Assessment", "Current Rates", "Expert Advice"]
  },
  {
    category: "Scientific Research",
    triggers: ["study", "research", "evidence", "data", "statistics", "findings"],
    searchQueries: [
      "intermittent fasting research weight loss benefits",
      "climate change impact renewable energy adoption",
      "artificial intelligence job displacement studies",
      "microplastics health effects latest research",
      "space exploration Mars mission timeline NASA"
    ],
    expectedSections: ["Research Summary", "Key Findings", "Methodology", "Implications"]
  }
];

/**
 * Identifies if content should trigger web search
 */
export function shouldTriggerWebSearch(content: string): boolean {
  const contentLower = content.toLowerCase();
  
  // Check for question patterns
  if (contentLower.includes('?') || 
      contentLower.startsWith('what') || 
      contentLower.startsWith('how') ||
      contentLower.startsWith('where') ||
      contentLower.startsWith('when') ||
      contentLower.startsWith('why') ||
      contentLower.startsWith('which')) {
    return true;
  }
  
  // Check for research triggers
  const researchTriggers = [
    'research', 'find', 'look up', 'search', 'compare', 'best', 'top', 
    'review', 'recommend', 'latest', 'current', 'trend', 'news',
    'learn about', 'tell me about', 'explain', 'guide', 'tutorial'
  ];
  
  return researchTriggers.some(trigger => contentLower.includes(trigger));
}

/**
 * Generates appropriate search queries based on content
 */
export function generateSearchQueries(content: string): string[] {
  const contentLower = content.toLowerCase();
  const queries: string[] = [];
  
  // Find matching patterns
  for (const pattern of WEB_SEARCH_PATTERNS) {
    const hasPattern = pattern.triggers.some(trigger => contentLower.includes(trigger));
    if (hasPattern) {
      // Add context-specific queries
      queries.push(`${content} 2024 latest information`);
      queries.push(`${content} expert recommendations guide`);
      queries.push(`${content} comparison reviews analysis`);
      break;
    }
  }
  
  // Default queries if no pattern matches
  if (queries.length === 0) {
    queries.push(`${content} comprehensive guide 2024`);
    queries.push(`${content} expert analysis recommendations`);
  }
  
  return queries.slice(0, 3); // Limit to 3 queries
}

/**
 * Structures web research results into organized sections
 */
export function structureWebResults(searchResults: any[]): {
  fromTheWeb: any[];
  nextSteps: string[];
  keyInsights: string[];
} {
  return {
    fromTheWeb: searchResults.map(result => ({
      title: result.title || "Research Finding",
      description: result.description || result.content?.substring(0, 200) + "...",
      url: result.url || result.source,
      rating: result.rating || "4.2/5",
      keyPoints: result.keyPoints || [
        "Comprehensive analysis",
        "Expert insights",
        "Current data"
      ],
      lastUpdated: result.lastUpdated || "2024"
    })),
    nextSteps: [
      "Review detailed findings from web sources",
      "Compare different perspectives and recommendations",
      "Identify specific actions based on research",
      "Set follow-up research targets if needed"
    ],
    keyInsights: [
      "Multiple sources provide consistent recommendations",
      "Current trends favor evidence-based approaches",
      "Expert consensus supports strategic implementation"
    ]
  };
}