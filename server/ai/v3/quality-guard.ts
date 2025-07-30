// ---------- server/ai/v3/quality-guard.ts ------------
// Quality guard for preventing generic AI responses

/**
 * Enhanced quality detection for AI responses
 */
export function isGenericResponse(content: string): boolean {
  const genericPhrases = [
    /visit official website/i,
    /check their website/i,
    /contact.*directly/i,
    /subject to availability/i,
    /various options available/i,
    /consult.*professional/i,
    /may vary/i,
    /please refer to/i,
    /for more information/i,
    /terms and conditions apply/i
  ];

  const hasSpecificData = /\$[\d,]+|\d{1,2}:\d{2}|https?:\/\/[\w.-]+|Section \d+|\d+ (miles?|km|minutes?|hours?)/;
  const isSubstantial = content.length > 150;

  const isGeneric = genericPhrases.some(phrase => phrase.test(content));
  const hasValue = hasSpecificData.test(content) && isSubstantial;

  return isGeneric && !hasValue;
}

/**
 * Calculate response quality score (0-1)
 */
export function calculateQualityScore(content: string): number {
  // Specific data indicators
  const specificDataCount = (content.match(/\$[\d,]+|\d{1,2}:\d{2}|https?:\/\/[\w.-]+/g) || []).length;
  
  // Actionable language indicators
  const actionableWords = ['step', 'download', 'call', 'visit', 'click', 'go to', 'use', 'try'];
  const actionableCount = actionableWords.reduce((count, word) => {
    return count + (content.toLowerCase().split(word).length - 1);
  }, 0);
  
  // Generic phrase penalty
  const genericPhrases = ['may vary', 'contact directly', 'visit website', 'subject to'];
  const genericPenalty = genericPhrases.reduce((penalty, phrase) => {
    return penalty + (content.toLowerCase().includes(phrase) ? 0.2 : 0);
  }, 0);
  
  // Calculate base score
  const specificDataScore = Math.min(specificDataCount / 3, 1.0);
  const actionableScore = Math.min(actionableCount / 5, 1.0);
  const lengthScore = Math.min(content.length / 200, 1.0);
  
  const baseScore = (specificDataScore + actionableScore + lengthScore) / 3;
  const finalScore = Math.max(0, baseScore - genericPenalty);
  
  return finalScore;
}

/**
 * Check if response needs enhancement
 */
export function needsEnhancement(content: string, threshold: number = 0.6): boolean {
  const qualityScore = calculateQualityScore(content);
  return qualityScore < threshold;
}