/**
 * Commerce Classifier - 1ms keyword scoring
 * Fast classification to route between commerce and memory paths
 */

export interface ClassificationResult {
  isCommerce: boolean;
  confidence: number;
  scores: Record<string, number>;
  primaryIntent: string;
}

// Commerce keywords weighted by specificity
const COMMERCE_KEYWORDS = {
  // High confidence indicators (0.8-1.0)
  buy: 0.9,
  purchase: 0.9,
  order: 0.8,
  shopping: 0.8,
  store: 0.7,
  price: 0.8,
  cost: 0.7,
  sale: 0.8,
  discount: 0.7,
  deals: 0.7,
  
  // Medium confidence indicators (0.5-0.7)
  best: 0.6,
  cheap: 0.6,
  affordable: 0.6,
  review: 0.5,
  compare: 0.6,
  recommendation: 0.5,
  
  // Product categories (0.4-0.6)
  tv: 0.5,
  laptop: 0.5,
  phone: 0.5,
  headphones: 0.4,
  shoes: 0.4,
  clothes: 0.4,
  furniture: 0.4,
  appliance: 0.5,
  
  // Retail context (0.3-0.5)
  amazon: 0.4,
  target: 0.4,
  walmart: 0.4,
  bestbuy: 0.4,
  online: 0.3,
  delivery: 0.3,
  shipping: 0.3
};

// Memory/personal keywords (negative commerce signals)
const MEMORY_KEYWORDS = {
  remember: -0.5,
  remind: -0.6,
  note: -0.3,
  memo: -0.4,
  appointment: -0.5,
  meeting: -0.5,
  call: -0.4,
  email: -0.3,
  todo: -0.5,
  task: -0.4,
  later: -0.3,
  tomorrow: -0.4,
  next: -0.3
};

/**
 * Fast commerce classification using keyword scoring
 */
export function commerceClassifier(content: string): ClassificationResult {
  const contentLower = content.toLowerCase();
  const words = contentLower.split(/\s+/);
  
  let commerceScore = 0;
  let memoryScore = 0;
  let totalMatches = 0;
  
  const scores: Record<string, number> = {};
  
  // Score commerce keywords
  for (const [keyword, weight] of Object.entries(COMMERCE_KEYWORDS)) {
    if (contentLower.includes(keyword)) {
      commerceScore += weight;
      totalMatches++;
      scores[`commerce_${keyword}`] = weight;
    }
  }
  
  // Score memory keywords (negative for commerce)
  for (const [keyword, weight] of Object.entries(MEMORY_KEYWORDS)) {
    if (contentLower.includes(keyword)) {
      memoryScore += Math.abs(weight);
      commerceScore += weight; // Subtract from commerce score
      scores[`memory_${keyword}`] = weight;
    }
  }
  
  // Boost score for price patterns ($X, €X, £X)
  const pricePattern = /[\$€£¥]\s*[\d,]+/;
  if (pricePattern.test(content)) {
    commerceScore += 0.7;
    scores['price_pattern'] = 0.7;
  }
  
  // Boost for model numbers (common in product searches)
  const modelPattern = /\b\w+\d+\w*\b/g;
  const modelMatches = content.match(modelPattern);
  if (modelMatches && modelMatches.length > 0) {
    commerceScore += 0.4;
    scores['model_pattern'] = 0.4;
  }
  
  // Boost for comparison language
  if (/\b(vs|versus|compared? to|better than)\b/.test(contentLower)) {
    commerceScore += 0.5;
    scores['comparison_language'] = 0.5;
  }
  
  // Normalize confidence score
  const maxPossibleScore = Math.max(commerceScore + memoryScore, 1);
  const confidence = Math.min(Math.max(commerceScore / maxPossibleScore, 0), 1);
  
  // Determine primary intent
  let primaryIntent = 'personal-reflection';
  if (commerceScore > 0.6) {
    primaryIntent = 'product-query';
  } else if (memoryScore > commerceScore) {
    primaryIntent = 'reminder';
  } else if (totalMatches > 0) {
    primaryIntent = 'simple-task';
  }
  
  return {
    isCommerce: commerceScore > memoryScore && confidence > 0.3,
    confidence,
    scores: {
      commerce: commerceScore,
      memory: memoryScore,
      ...scores
    },
    primaryIntent
  };
}