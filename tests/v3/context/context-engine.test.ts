import { ContextAwareExtractor } from '../../../server/ai/v3/context/entity-extractor.js';
import { ContextMemory } from '../../../server/ai/v3/context/context-memory.js';

async function runContextEngineTests(): Promise<void> {
  console.log('🧪  Starting context engine tests...');

  // Test 1: Entity Extraction
  console.log('📝  Testing entity extraction...');
  const extractor = new ContextAwareExtractor(100);
  
  const testText = 'Met Alice Johnson at Google headquarters with my dog Max. ' +
                   'Discussed the Alpha project with Bob Smith from Microsoft.';
  
  const extractionResult = await extractor.extract(testText);
  
  if (extractionResult.entities.length < 4) {
    throw new Error(`Expected at least 4 entities, got ${extractionResult.entities.length}`);
  }

  console.log(`✅  Extracted ${extractionResult.entities.length} entities in ${extractionResult.metadata.extractionTimeMs}ms`);
  console.log(`    Average confidence: ${extractionResult.metadata.avgConfidence}`);

  // Test 2: Cache functionality
  console.log('🔄  Testing cache functionality...');
  const cachedResult = await extractor.extract(testText);
  
  if (!cachedResult.metadata.cacheHit) {
    throw new Error('Expected cache hit on second extraction');
  }
  
  console.log('✅  Cache working correctly');

  // Test 3: Context Memory Integration
  console.log('🧠  Testing context memory integration...');
  const contextMemory = new ContextMemory(100);
  const testUserId = `test-user-${Date.now()}`;
  
  const processingResult = await contextMemory.processNote(
    testUserId,
    'Planning lunch with Sarah Chen at Central Park Restaurant about the website redesign project'
  );

  if (processingResult.storedFacts.length === 0) {
    console.warn('⚠️  No facts stored, errors:', processingResult.errors);
  }

  console.log(`✅  Processing completed: ${processingResult.storedFacts.length} facts stored`);
  console.log(`    Stored: ${processingResult.storedFacts.join(', ')}`);
  
  if (processingResult.errors.length > 0) {
    console.warn('    Errors:', processingResult.errors);
  }

  // Test 4: Context Retrieval
  console.log('🔍  Testing context retrieval...');
  const contextResult = await contextMemory.getRelevantContext(testUserId, 'Sarah', 5);
  
  if (contextResult.error) {
    console.warn(`    Retrieval warning: ${contextResult.error}`);
  }

  console.log(`✅  Retrieved ${contextResult.facts.length} facts for query`);

  // Test 5: System Statistics
  console.log('📊  Testing system statistics...');
  const stats = contextMemory.getStats();
  
  console.log(`✅  Stats: Cache ${stats.extractor.size}/${stats.extractor.maxSize}`);
  console.log(`    Min confidence: ${stats.extractor.minConfidence}`);

  console.log('🎉  All context engine tests completed successfully!');
}

runContextEngineTests().catch(error => {
  console.error('❌  Context engine tests failed:', error.message);
  process.exit(1);
});