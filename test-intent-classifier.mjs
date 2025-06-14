
import { IntentVectorClassifier } from './server/intelligence-v2/intent-vector-classifier.js';

async function testClassifier() {
  try {
    console.log('🧠 Testing IntentVectorClassifier...');
    
    const result = await IntentVectorClassifier.classify(
      'What is this image? How much is it worth? Remind me to take my other money to currency exchange.'
    );
    
    console.log('✅ Classification result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Classification failed:', error);
  }
}

testClassifier();
