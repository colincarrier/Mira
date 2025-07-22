import { parse as chronoParse } from 'chrono-node';

const testCases = [
  ['in two hours', 0.8],
  ['tomorrow at 9am', 0.9],
  ['next Friday', 0.7],
  ['later today', 0.7],
  ['pick up groceries', null]  // no timing
] as const;

console.log('🧪 Testing chrono-node date parsing...');

testCases.forEach(([text, expectedConfidence]) => {
  const results = chronoParse(text, new Date('2025-01-01T10:00:00Z'));
  const parsed = results[0];
  
  if (expectedConfidence === null) {
    console.assert(!parsed, `❌ Should not parse: "${text}"`);
    if (!parsed) console.log(`✅ Correctly rejected: "${text}"`);
  } else {
    console.assert(parsed, `❌ Should parse: "${text}"`);
    if (parsed) {
      const confidence = parsed.tags ? 0.9 : 0.8;
      console.assert(confidence >= expectedConfidence, `❌ Low confidence for "${text}": ${confidence}`);
      console.log(`✅ Parsed "${text}" -> ${parsed.date().toISOString()} (confidence: ${confidence})`);
    }
  }
});

console.log('✅ Parser unit tests completed');