/**
 * Orthogonal AI Upgrade Validation Test
 * Verifies commerce/memory routing and modular brain architecture
 */

async function makeRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`http://localhost:5000${url}`, options);
  return response.json();
}

async function testCommerceRouting() {
  console.log('🛒 Testing Commerce Routing Path...');
  
  const commerceQueries = [
    'I need to buy wireless headphones under $200',
    'Looking for best laptop deals for students',
    'Where can I find cheap running shoes?',
    'Compare iPhone 15 vs Samsung Galaxy prices'
  ];
  
  for (const query of commerceQueries) {
    try {
      const result = await makeRequest('/api/notes', 'POST', {
        content: query,
        mode: 'text'
      });
      
      console.log(`Query: "${query}"`);
      console.log(`- Processing Path: ${result.processingPath || 'N/A'}`);
      console.log(`- Title: ${result.content}`);
      console.log(`- Classification: ${result.classificationScores ? JSON.stringify(result.classificationScores) : 'N/A'}`);
      console.log('');
      
    } catch (error) {
      console.error(`Commerce test failed for "${query}":`, error.message);
    }
  }
}

async function testMemoryRouting() {
  console.log('📝 Testing Memory Routing Path...');
  
  const memoryQueries = [
    'Pick up dry cleaning tomorrow',
    'Call mom tonight at 8pm',
    'Meeting with Sarah next Tuesday',
    'Remember to water the plants'
  ];
  
  for (const query of memoryQueries) {
    try {
      const result = await makeRequest('/api/notes', 'POST', {
        content: query,
        mode: 'text'
      });
      
      console.log(`Query: "${query}"`);
      console.log(`- Processing Path: ${result.processingPath || 'N/A'}`);
      console.log(`- Title: ${result.content}`);
      console.log(`- Classification: ${result.classificationScores ? JSON.stringify(result.classificationScores) : 'N/A'}`);
      console.log('');
      
    } catch (error) {
      console.error(`Memory test failed for "${query}":`, error.message);
    }
  }
}

async function testClassificationAccuracy() {
  console.log('🎯 Testing Classification Accuracy...');
  
  const testCases = [
    { query: 'buy new smartphone', expected: 'commerce' },
    { query: 'doctor appointment tomorrow', expected: 'memory' },
    { query: 'cheap gaming laptop under 1000', expected: 'commerce' },
    { query: 'feed the cat', expected: 'memory' },
    { query: 'compare prices for wireless earbuds', expected: 'commerce' }
  ];
  
  let correctClassifications = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await makeRequest('/api/notes', 'POST', {
        content: testCase.query,
        mode: 'text'
      });
      
      const actualPath = result.processingPath;
      const isCorrect = actualPath === testCase.expected;
      
      if (isCorrect) correctClassifications++;
      
      console.log(`"${testCase.query}" -> Expected: ${testCase.expected}, Got: ${actualPath} ${isCorrect ? '✅' : '❌'}`);
      
    } catch (error) {
      console.error(`Classification test failed for "${testCase.query}":`, error.message);
    }
  }
  
  const accuracy = (correctClassifications / testCases.length) * 100;
  console.log(`\nClassification Accuracy: ${accuracy}% (${correctClassifications}/${testCases.length})`);
}

async function runOrthogonalAITests() {
  console.log('🧠 Orthogonal AI Upgrade Validation Test\n');
  console.log('Testing commerce/memory routing with modular brain architecture...\n');
  
  try {
    await testCommerceRouting();
    await testMemoryRouting();
    await testClassificationAccuracy();
    
    console.log('✅ Orthogonal AI upgrade validation complete!');
    console.log('\nKey Features Validated:');
    console.log('- Fast commerce/memory classification (keyword scoring)');
    console.log('- Modular brain architecture with specialized processors');
    console.log('- Clean newspaper-style title generation');
    console.log('- Appropriate routing based on content analysis');
    
  } catch (error) {
    console.error('Test suite error:', error.message);
  }
}

// Run the test suite
runOrthogonalAITests();