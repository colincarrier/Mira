/**
 * Concierge Brain - Commerce/Product Enrichment Path
 * Handles product queries, shopping research, and commercial intelligence
 */

import { MiraAIInput, MiraAIResult } from './miraAIProcessing';
import { ClassificationResult } from './classifiers/commerceClassifier';

export async function conciergeBrain(
  input: MiraAIInput, 
  classification: ClassificationResult
): Promise<MiraAIResult> {
  
  // Import OpenAI for product analysis
  const openaiModule = await import('../openai');
  
  // Create commerce-focused prompt for comprehensive product research
  const commercePrompt = `
SYSTEM: You are an expert product research assistant. Analyze this query and provide comprehensive, detailed product recommendations with specific models, current pricing, and actionable insights - similar to what ChatGPT would provide.

USER_QUERY: "${input.content}"

INSTRUCTIONS:
1. Identify the specific product category and user requirements
2. Research current top-rated models (June 2025) with specific names and model numbers
3. Provide detailed comparisons including pros/cons, pricing, and key features
4. Include expert review insights and ratings
5. Suggest specific shopping actions with direct links
6. Organize by priority: premium, value, budget options
7. Be comprehensive and detailed - provide dense, helpful information

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, product-focused headline)",
  "summary": "string (comprehensive product analysis with specific models, pricing, comparisons, and expert insights - minimum 200 words)",
  "intent": "product-query",
  "urgency": "medium",
  "complexity": 7,
  "todos": [
    {"title": "Research specific models mentioned", "priority": "medium"},
    {"title": "Compare prices across retailers", "priority": "medium"},
    {"title": "Read expert reviews", "priority": "low"}
  ],
  "smartActions": [
    {"label": "Search Amazon", "action": "openLink", "url": "https://amazon.com/s?k=PRODUCT_QUERY"},
    {"label": "Compare Reviews", "action": "openLink", "url": "https://www.google.com/search?q=PRODUCT_QUERY+reviews+2025"},
    {"label": "Price Comparison", "action": "openLink", "url": "https://www.google.com/search?q=PRODUCT_QUERY+price+comparison"}
  ],
  "assistantAddendum": "string (detailed product breakdown with specific recommendations, model comparisons, pricing insights, and shopping guidance - minimum 150 words)",
  "enrichments": {
    "products": [
      {"name": "Premium Option - Specific Model Name", "price": "$XXX-XXX range", "url": "shopping link", "rating": "4.5/5 stars", "keyFeatures": "list key features"},
      {"name": "Value Pick - Specific Model Name", "price": "$XXX-XXX range", "url": "shopping link", "rating": "4.3/5 stars", "keyFeatures": "list key features"},
      {"name": "Budget Choice - Specific Model Name", "price": "$XXX-XXX range", "url": "shopping link", "rating": "4.0/5 stars", "keyFeatures": "list key features"}
    ]
  }
}

QUALITY REQUIREMENTS:
- Summary must be detailed and comprehensive (200+ words)
- Include specific product model names and numbers
- Provide current pricing estimates
- Mention key features and comparisons
- Reference expert reviews when possible
- Be as detailed and helpful as ChatGPT would be

OUTPUT ONLY JSON:
`;

  try {
    // Process through OpenAI for product intelligence
    const result = await openaiModule.analyzeWithOpenAI(commercePrompt, 'enhanced');
    
    console.log('Commerce brain - OpenAI result:', JSON.stringify(result, null, 2));
    
    // Extract structured commerce response - check for detailed analysis in various fields
    const detailedSummary = result.context || result.summary || result.assistantAddendum || "Product query processed";
    const productTitle = result.title || result.enhancedContent || extractProductTitle(input.content);
    
    // Extract todos from OpenAI response
    let todosList = [];
    if (Array.isArray(result.todos)) {
      todosList = result.todos.map(todo => ({
        title: typeof todo === 'string' ? todo : todo.title || `Research ${input.content}`,
        priority: typeof todo === 'object' ? todo.priority || 'medium' : 'medium'
      }));
    } else {
      todosList = generateShoppingTodos(input.content);
    }
    
    // Extract smart actions from OpenAI response
    let smartActionsList = [];
    if (Array.isArray(result.smartActions)) {
      smartActionsList = result.smartActions;
    } else {
      smartActionsList = generateCommerceActions(input.content, result);
    }
    
    // Extract enrichments from OpenAI response
    let enrichmentsList = { products: [] };
    if (result.enrichments && result.enrichments.products) {
      enrichmentsList = result.enrichments;
    } else {
      enrichmentsList = { products: generateProductSuggestions(input.content) };
    }
    
    const enhancedResult: MiraAIResult = {
      uid: '',
      timestamp: '',
      title: productTitle,
      summary: detailedSummary,
      intent: 'product-query',
      urgency: result.urgencyLevel || result.urgency || 'medium',
      complexity: Math.max(result.complexityScore || result.complexity || 7, 7), // Commerce queries are complex
      confidence: classification.confidence,
      todos: todosList,
      smartActions: smartActionsList,
      assistantAddendum: result.assistantAddendum || generateProductAnalysis(input.content, result),
      enrichments: enrichmentsList,
      processingPath: 'commerce',
      classificationScores: classification.scores,
      _rawModelJSON: result
    };
    
    return enhancedResult;
    
  } catch (error) {
    console.error('Concierge brain error:', error);
    
    // Fallback for commerce queries
    return {
      uid: '',
      timestamp: '',
      title: extractProductTitle(input.content),
      summary: "Shopping assistance available",
      intent: 'product-query',
      urgency: 'medium',
      complexity: 5,
      confidence: classification.confidence,
      todos: generateShoppingTodos(input.content),
      smartActions: generateCommerceActions(input.content),
      assistantAddendum: `I can help you research and find the best options for: ${input.content}`,
      enrichments: {
        products: generateProductSuggestions(input.content)
      },
      processingPath: 'commerce',
      classificationScores: classification.scores
    };
  }
}

/**
 * Extract product-focused title
 */
function extractProductTitle(content: string): string {
  // Look for product keywords and create focused title
  const productWords = content.toLowerCase().match(/\b(best|cheap|affordable|buy|purchase)\s+([^.!?]+)/);
  if (productWords) {
    return productWords[0].split(' ').slice(0, 5).join(' ');
  }
  
  const words = content.trim().split(/\s+/);
  return words.slice(0, 4).join(' ') + (words.length > 4 ? ' Search' : '');
}

/**
 * Generate shopping-focused todos
 */
function generateShoppingTodos(content: string): Array<{title: string, priority: string}> {
  const todos = [];
  
  // Research phase
  todos.push({
    title: `Research ${content.split(' ').slice(-3).join(' ')} options`,
    priority: 'medium'
  });
  
  // Compare phase
  todos.push({
    title: 'Compare prices and reviews',
    priority: 'medium'
  });
  
  // Purchase decision
  if (content.toLowerCase().includes('buy') || content.toLowerCase().includes('purchase')) {
    todos.push({
      title: 'Make purchase decision',
      priority: 'high'
    });
  }
  
  return todos;
}

/**
 * Generate commerce-specific smart actions
 */
function generateCommerceActions(content: string, result?: any): Array<{label: string, action: string, url?: string}> {
  const actions = [];
  
  // Research action
  actions.push({
    label: 'Research Online',
    action: 'openLink',
    url: `https://www.google.com/search?q=${encodeURIComponent(content + ' buy review')}`
  });
  
  // Price comparison
  actions.push({
    label: 'Compare Prices',
    action: 'compare'
  });
  
  // If product identified, add specific shopping links
  if (content.toLowerCase().includes('amazon')) {
    actions.push({
      label: 'View on Amazon',
      action: 'openLink',
      url: `https://amazon.com/s?k=${encodeURIComponent(content)}`
    });
  }
  
  return actions;
}

/**
 * Generate detailed product analysis
 */
function generateProductAnalysis(content: string, result?: any): string {
  return `Product Research Analysis:

Query: ${content}

I can help you find the best options by:
• Researching current market prices and availability
• Comparing top-rated products in this category  
• Finding the best deals and discounts
• Checking user reviews and expert recommendations

Would you like me to focus on any specific requirements like budget range, brand preferences, or particular features?`;
}

/**
 * Generate product suggestions based on query
 */
function generateProductSuggestions(content: string): Array<{name: string, price: string, url: string, rating?: string}> {
  // This would integrate with real shopping APIs in production
  // For now, provide structured placeholders that indicate research is needed
  
  const productType = content.toLowerCase();
  
  if (productType.includes('tv') || productType.includes('television')) {
    return [
      {
        name: 'Research needed for TV recommendations',
        price: 'Price comparison required',
        url: `https://www.google.com/search?q=${encodeURIComponent(content + ' best 2024')}`,
        rating: 'Reviews pending'
      }
    ];
  }
  
  return [
    {
      name: `Research needed for: ${content}`,
      price: 'Market analysis required',
      url: `https://www.google.com/search?q=${encodeURIComponent(content + ' best price')}`,
      rating: 'Comparison needed'
    }
  ];
}