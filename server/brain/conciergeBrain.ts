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
  
  // Create commerce-focused prompt
  const commercePrompt = `
SYSTEM: You are Mira's shopping concierge. Analyze this product query and provide comprehensive shopping assistance.

USER_QUERY: "${input.content}"

ANALYSIS_FOCUS:
- Extract product specifications and requirements
- Identify shopping intent and urgency
- Suggest specific products with pricing research
- Generate actionable shopping steps

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, product-focused headline)",
  "summary": "string (shopping analysis summary)",
  "intent": "product-query",
  "urgency": "low|medium|high|critical",
  "complexity": "number (1-10)",
  "todos": [{"title": "actionable shopping step", "priority": "urgency"}],
  "smartActions": [{"label": "action name", "action": "openLink|compare|research", "url": "optional"}],
  "assistantAddendum": "detailed product analysis and recommendations",
  "enrichments": {
    "products": [{"name": "product name", "price": "estimated range", "url": "shopping link", "rating": "4.5 stars"}]
  }
}

For product queries:
- Research current market prices and availability
- Compare top options in the category
- Include direct shopping links when possible
- Provide specific model recommendations
- Consider user's implied budget constraints

OUTPUT ONLY JSON:
`;

  try {
    // Process through OpenAI for product intelligence
    const result = await openaiModule.analyzeWithOpenAI(commercePrompt, 'enhanced');
    
    // Enhance with commerce-specific features
    const enhancedResult: MiraAIResult = {
      uid: '',
      timestamp: '',
      title: result.enhancedContent || extractProductTitle(input.content),
      summary: result.context || "Product query analyzed",
      intent: 'product-query',
      urgency: result.urgencyLevel || 'medium',
      complexity: Math.max(result.complexityScore || 5, 5), // Commerce queries are inherently complex
      confidence: classification.confidence,
      todos: result.todos?.map(todo => ({
        title: todo,
        priority: result.urgencyLevel || 'medium'
      })) || generateShoppingTodos(input.content),
      smartActions: generateCommerceActions(input.content, result),
      assistantAddendum: generateProductAnalysis(input.content, result),
      enrichments: {
        products: generateProductSuggestions(input.content)
      },
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