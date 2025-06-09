/**
 * Comprehensive AI System Testing Suite
 * Validates enhanced image analysis, company intelligence, and multi-modal processing
 */

const API_BASE = 'http://localhost:5000';

async function makeRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${url}`, options);
  return await response.json();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Enhanced Image Analysis with Company Intelligence
 */
async function testEnhancedImageAnalysis() {
  console.log('\n=== Testing Enhanced Image Analysis ===');
  
  // Test the existing Pinata Farms hat image
  try {
    const note = await makeRequest('/api/notes/187');
    console.log('Current analysis quality check:');
    
    // Verify comprehensive company intelligence
    const hasFounderInfo = note.content.includes('Colin Carrier') || note.content.includes('Josh Hossain');
    const hasFundingInfo = note.content.includes('Andreessen Horowitz') || note.content.includes('a16z');
    const hasBusinessModel = note.content.includes('meme creation') || note.content.includes('AI company');
    const hasRecentDev = note.content.includes('TikTok') || note.content.includes('Discord');
    
    console.log(`✓ Founder information: ${hasFounderInfo ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Funding details: ${hasFundingInfo ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Business model: ${hasBusinessModel ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Recent developments: ${hasRecentDev ? 'PASS' : 'FAIL'}`);
    
    const overallQuality = hasFounderInfo && hasFundingInfo && hasBusinessModel && hasRecentDev;
    console.log(`\nOverall ChatGPT-level quality: ${overallQuality ? 'ACHIEVED' : 'NEEDS IMPROVEMENT'}`);
    
    return overallQuality;
  } catch (error) {
    console.error('Enhanced image analysis test failed:', error);
    return false;
  }
}

/**
 * Test 2: Multi-Modal Processing Pipeline
 */
async function testMultiModalProcessing() {
  console.log('\n=== Testing Multi-Modal Processing ===');
  
  try {
    // Create a test note with text content
    const textNote = await makeRequest('/api/notes', 'POST', {
      content: 'Research OpenAI GPT-4 capabilities and pricing structure',
      mode: 'text'
    });
    
    await sleep(3000); // Allow AI processing
    
    const processedNote = await makeRequest(`/api/notes/${textNote.id}`);
    
    // Verify AI enhancement quality
    const hasDetailedAnalysis = processedNote.aiEnhanced && processedNote.content.length > 100;
    const hasTodos = processedNote.todos && processedNote.todos.length > 0;
    const hasContext = processedNote.aiContext && processedNote.aiContext.length > 0;
    const hasRichContext = processedNote.richContext && processedNote.richContext !== 'null';
    
    console.log(`✓ Detailed AI analysis: ${hasDetailedAnalysis ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Generated todos: ${hasTodos ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Contextual information: ${hasContext ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Rich context data: ${hasRichContext ? 'PASS' : 'FAIL'}`);
    
    // Clean up test note
    await makeRequest(`/api/notes/${textNote.id}`, 'DELETE');
    
    return hasDetailedAnalysis && hasTodos && hasContext;
  } catch (error) {
    console.error('Multi-modal processing test failed:', error);
    return false;
  }
}

/**
 * Test 3: Company Intelligence Database
 */
async function testCompanyIntelligence() {
  console.log('\n=== Testing Company Intelligence Database ===');
  
  try {
    // Test with known companies from the intelligence database
    const testCompanies = [
      'Create a note about Meta AI developments',
      'Analyze Google DeepMind research initiatives', 
      'Research Anthropic Claude model improvements',
      'Investigate Microsoft AI partnership strategies'
    ];
    
    let successCount = 0;
    
    for (const testContent of testCompanies) {
      const note = await makeRequest('/api/notes', 'POST', {
        content: testContent,
        mode: 'text'
      });
      
      await sleep(2000);
      
      const processedNote = await makeRequest(`/api/notes/${note.id}`);
      
      // Check if company intelligence was applied
      const hasCompanyDetails = processedNote.content.length > testContent.length * 2;
      const hasBusinessContext = processedNote.aiContext && processedNote.aiContext.includes('company');
      
      if (hasCompanyDetails && hasBusinessContext) {
        successCount++;
        console.log(`✓ ${testContent.split(' ')[3]} intelligence: PASS`);
      } else {
        console.log(`✗ ${testContent.split(' ')[3]} intelligence: FAIL`);
      }
      
      // Clean up
      await makeRequest(`/api/notes/${note.id}`, 'DELETE');
    }
    
    const successRate = successCount / testCompanies.length;
    console.log(`\nCompany intelligence success rate: ${(successRate * 100).toFixed(1)}%`);
    
    return successRate >= 0.75; // 75% success threshold
  } catch (error) {
    console.error('Company intelligence test failed:', error);
    return false;
  }
}

/**
 * Test 4: Evolution and Reprocessing
 */
async function testEvolutionSystem() {
  console.log('\n=== Testing Evolution and Reprocessing ===');
  
  try {
    // Create a simple note
    const note = await makeRequest('/api/notes', 'POST', {
      content: 'Simple test note',
      mode: 'text'
    });
    
    await sleep(2000);
    
    // Test evolution with specific instruction
    await makeRequest(`/api/notes/${note.id}/evolve`, 'POST', {
      instruction: 'Enhance this with comprehensive business analysis',
      existingContent: 'Simple test note',
      existingContext: '',
      existingTodos: [],
      existingRichContext: null
    });
    
    await sleep(3000);
    
    const evolvedNote = await makeRequest(`/api/notes/${note.id}`);
    
    // Verify evolution quality
    const hasEvolved = evolvedNote.content.length > 50;
    const hasNewContext = evolvedNote.aiContext && evolvedNote.aiContext.length > 0;
    const hasIncreasedVersion = evolvedNote.version > 1;
    
    console.log(`✓ Content evolution: ${hasEvolved ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Context enhancement: ${hasNewContext ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Version tracking: ${hasIncreasedVersion ? 'PASS' : 'FAIL'}`);
    
    // Clean up
    await makeRequest(`/api/notes/${note.id}`, 'DELETE');
    
    return hasEvolved && hasNewContext && hasIncreasedVersion;
  } catch (error) {
    console.error('Evolution system test failed:', error);
    return false;
  }
}

/**
 * Test 5: Data Protection and Versioning
 */
async function testDataProtection() {
  console.log('\n=== Testing Data Protection System ===');
  
  try {
    // Create a note with valuable user content
    const note = await makeRequest('/api/notes', 'POST', {
      content: 'My personal project ideas:\n1. AI-powered fitness app\n2. Smart home automation\n3. Investment tracking tool',
      mode: 'text'
    });
    
    await sleep(2000);
    
    // Test safe evolution
    await makeRequest(`/api/notes/${note.id}/evolve`, 'POST', {
      instruction: 'Add market analysis for these ideas',
      existingContent: note.content,
      existingContext: '',
      existingTodos: [],
      existingRichContext: null
    });
    
    await sleep(3000);
    
    const protectedNote = await makeRequest(`/api/notes/${note.id}`);
    
    // Verify original content preservation
    const preservesOriginalIdeas = protectedNote.content.includes('AI-powered fitness app') &&
                                  protectedNote.content.includes('Smart home automation') &&
                                  protectedNote.content.includes('Investment tracking tool');
    
    const hasVersioning = protectedNote.version > 1;
    const hasProtectedContent = protectedNote.protectedContent !== null;
    
    console.log(`✓ Original content preserved: ${preservesOriginalIdeas ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Version tracking active: ${hasVersioning ? 'PASS' : 'FAIL'}`);
    console.log(`✓ Content protection enabled: ${hasProtectedContent ? 'PASS' : 'FAIL'}`);
    
    // Clean up
    await makeRequest(`/api/notes/${note.id}`, 'DELETE');
    
    return preservesOriginalIdeas && hasVersioning;
  } catch (error) {
    console.error('Data protection test failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive AI System Tests');
  console.log('==========================================');
  
  const testResults = {
    imageAnalysis: await testEnhancedImageAnalysis(),
    multiModal: await testMultiModalProcessing(),
    companyIntel: await testCompanyIntelligence(),
    evolution: await testEvolutionSystem(),
    dataProtection: await testDataProtection()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: AI system is performing at high quality');
  } else if (successRate >= 70) {
    console.log('⚠️  GOOD: AI system is functional with room for improvement');
  } else {
    console.log('🚨 NEEDS WORK: AI system requires significant improvements');
  }
  
  return testResults;
}

// Run tests if called directly
runComprehensiveTests().catch(console.error);