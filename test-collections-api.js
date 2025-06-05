import fetch from 'node-fetch';

async function testCollectionsAPI() {
  try {
    console.log('Testing collections API...');
    
    const response = await fetch('http://localhost:5000/api/collections', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Total collections returned:', data.length);
    
    console.log('\nCollections summary:');
    data.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name} (ID: ${collection.id}) - ${collection.noteCount} notes`);
    });
    
    const moviesCollection = data.find(c => c.name === 'Movies & TV');
    if (moviesCollection) {
      console.log('\n✓ Movies & TV collection found!');
      console.log('Details:', JSON.stringify(moviesCollection, null, 2));
      
      // Test the items endpoint
      console.log('\nTesting items for Movies & TV...');
      const itemsResponse = await fetch(`http://localhost:5000/api/collections/${moviesCollection.id}/items`);
      const items = await itemsResponse.json();
      console.log('Movie items found:', items.length);
      items.forEach(item => {
        console.log(`- ${item.title} (${item.type})`);
      });
    } else {
      console.log('\n✗ Movies & TV collection NOT found in API response');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCollectionsAPI();