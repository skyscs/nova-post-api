// Simple script to load data from file
const filePath = process.argv[2] || './data-example.json';

async function loadData() {
  try {
    console.log(`Loading data from: ${filePath}`);
    
    const response = await fetch('http://localhost:3001/api/v1/system/load-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Data loaded successfully!');
      console.log(`📊 Stats: ${JSON.stringify(result.stats, null, 2)}`);
      console.log(`📝 Message: ${result.message}`);
    } else {
      console.error('❌ Failed to load data:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

loadData(); 