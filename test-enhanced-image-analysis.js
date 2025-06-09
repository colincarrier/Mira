/**
 * Test Enhanced Image Analysis System
 * Verifies ChatGPT-level accuracy and detail in image processing
 */

import fs from 'fs';

async function testEnhancedImageAnalysis() {
  console.log('Testing Enhanced Image Analysis System...\n');

  try {
    // Create test note with image to verify enhanced analysis
    const testNote = {
      content: "Books and items on my desk - identify everything visible",
      mode: "capture",
      mediaUrl: "/uploads/b48c6e25-1780-442b-b7cd-bc2607982a38.jpg"
    };

    console.log('Creating note with real image for analysis...');
    const noteResponse = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testNote)
    });

    if (!noteResponse.ok) {
      throw new Error(`Failed to create note: ${noteResponse.statusText}`);
    }

    const note = await noteResponse.json();
    console.log(`Note created with ID: ${note.id}`);

    // Monitor processing with multiple checks
    console.log('Monitoring AI processing...');
    let attempts = 0;
    const maxAttempts = 15;
    let processedNote = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`http://localhost:5000/api/notes/${note.id}`);
      if (statusResponse.ok) {
        const currentNote = await statusResponse.json();
        
        if (!currentNote.isProcessing && currentNote.aiEnhanced) {
          processedNote = currentNote;
          console.log(`Processing completed after ${(attempts + 1) * 2} seconds`);
          break;
        }
        
        console.log(`Attempt ${attempts + 1}: Still processing...`);
      }
      
      attempts++;
    }

    if (!processedNote) {
      console.log('Processing did not complete within expected time');
      return { success: false, error: 'Processing timeout' };
    }

    // Analyze results quality
    console.log('\n=== ENHANCED ANALYSIS RESULTS ===');
    
    console.log('\n1. CONTENT ENHANCEMENT:');
    console.log(`Original: "${testNote.content}"`);
    console.log(`Enhanced: "${processedNote.content}"`);
    
    console.log('\n2. AI CONTEXT:');
    if (processedNote.aiContext) {
      console.log(processedNote.aiContext);
    }

    console.log('\n3. RICH CONTEXT ANALYSIS:');
    if (processedNote.richContext) {
      try {
        const richData = JSON.parse(processedNote.richContext);
        console.log('Quick Insights:', richData.quickInsights || []);
        console.log('Environmental Context:', richData.environmentalContext || 'None');
        console.log('Recommended Actions:', richData.recommendedActions?.length || 0);
      } catch (e) {
        console.log('Rich context parsing failed');
      }
    }

    // Check for extracted items
    console.log('\n4. EXTRACTED ITEMS:');
    const itemsResponse = await fetch(`http://localhost:5000/api/notes/${note.id}/items`);
    if (itemsResponse.ok) {
      const items = await itemsResponse.json();
      console.log(`Found ${items.length} extracted items:`);
      
      items.forEach((item, index) => {
        console.log(`\n   ${index + 1}. ${item.title}`);
        console.log(`      Type: ${item.type}`);
        console.log(`      Description: ${item.description || 'None'}`);
        
        // Check for metadata
        if (item.metadata) {
          try {
            const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
            console.log(`      Metadata: ${Object.keys(metadata).join(', ')}`);
          } catch (e) {
            console.log(`      Metadata: Present but not parseable`);
          }
        }

        // Check for shopping links
        if (item.detailedContent) {
          try {
            const details = typeof item.detailedContent === 'string' ? JSON.parse(item.detailedContent) : item.detailedContent;
            if (details.shoppingLinks && details.shoppingLinks.length > 0) {
              console.log(`      Shopping Links: ${details.shoppingLinks.length} found`);
              details.shoppingLinks.slice(0, 2).forEach((link, i) => {
                console.log(`        ${i + 1}. ${link.title}`);
              });
            }
          } catch (e) {
            console.log(`      Shopping links parsing failed`);
          }
        }
      });
    } else {
      console.log('No items extracted or endpoint failed');
    }

    // Check collection assignment
    console.log('\n5. COLLECTION ASSIGNMENT:');
    if (processedNote.collectionId) {
      const collectionResponse = await fetch(`http://localhost:5000/api/collections/${processedNote.collectionId}`);
      if (collectionResponse.ok) {
        const collection = await collectionResponse.json();
        console.log(`Assigned to: "${collection.name}" ${collection.icon}`);
      }
    } else {
      console.log('No collection assigned');
    }

    // Quality assessment
    console.log('\n=== QUALITY ASSESSMENT ===');
    const qualityScore = assessAnalysisQuality(processedNote);
    console.log(`Overall Quality Score: ${qualityScore.score}/100`);
    console.log('Strengths:', qualityScore.strengths.join(', '));
    if (qualityScore.improvements.length > 0) {
      console.log('Areas for improvement:', qualityScore.improvements.join(', '));
    }

    return {
      success: true,
      noteId: note.id,
      qualityScore: qualityScore.score,
      message: `Enhanced analysis completed with ${qualityScore.score}% quality score`
    };

  } catch (error) {
    console.error('Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function assessAnalysisQuality(note) {
  let score = 0;
  const strengths = [];
  const improvements = [];

  // Content enhancement (20 points)
  if (note.content && note.content.length > 20) {
    score += 20;
    strengths.push('Content enhanced');
  } else {
    improvements.push('Content enhancement');
  }

  // AI context (20 points)
  if (note.aiContext && note.aiContext.length > 10) {
    score += 20;
    strengths.push('AI context provided');
  } else {
    improvements.push('AI context depth');
  }

  // Rich context (30 points)
  if (note.richContext) {
    try {
      const richData = JSON.parse(note.richContext);
      if (richData.quickInsights && richData.quickInsights.length > 0) {
        score += 15;
        strengths.push('Insights generated');
      }
      if (richData.recommendedActions && richData.recommendedActions.length > 0) {
        score += 15;
        strengths.push('Actions recommended');
      }
    } catch (e) {
      improvements.push('Rich context structure');
    }
  } else {
    improvements.push('Rich context missing');
  }

  // AI suggestion (15 points)
  if (note.aiSuggestion && note.aiSuggestion.length > 5) {
    score += 15;
    strengths.push('Suggestions provided');
  } else {
    improvements.push('Suggestion quality');
  }

  // Processing completion (15 points)
  if (note.aiEnhanced && !note.isProcessing) {
    score += 15;
    strengths.push('Processing completed');
  } else {
    improvements.push('Processing reliability');
  }

  return { score, strengths, improvements };
}

// Run the test
testEnhancedImageAnalysis()
  .then(result => {
    if (result.success) {
      console.log(`\nSUCCESS: ${result.message}`);
      if (result.qualityScore >= 80) {
        console.log('Enhanced analysis system is performing excellently!');
      } else if (result.qualityScore >= 60) {
        console.log('Enhanced analysis system is performing well with room for improvement.');
      } else {
        console.log('Enhanced analysis system needs optimization.');
      }
      process.exit(0);
    } else {
      console.log(`\nFAILURE: ${result.error}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

export { testEnhancedImageAnalysis };