// Test script to load a single division
async function testSingle() {
  try {
    console.log('Testing single division load...');
    
    const response = await fetch('http://localhost:3001/api/v1/system/load-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath: './data-example.json' })
    });

    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSingle(); 