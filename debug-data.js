// Debug script to examine data structure
import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('./data-example.json', 'utf-8'));
  
  console.log('Data structure:');
  console.log('- items length:', data.items?.length);
  
  if (data.items && data.items.length > 0) {
    console.log('\nFirst item structure:');
    const firstItem = data.items[0];
    console.log('- id:', firstItem.id);
    console.log('- name:', firstItem.name);
    console.log('- countryCode:', firstItem.countryCode);
    console.log('- settlement:', JSON.stringify(firstItem.settlement, null, 2));
    console.log('- latitude:', firstItem.latitude);
    console.log('- longitude:', firstItem.longitude);
    console.log('- fullAddress:', JSON.stringify(firstItem.fullAddress, null, 2));
    
    console.log('\nLast few items:');
    const lastItems = data.items.slice(-3);
    lastItems.forEach((item, index) => {
      console.log(`${data.items.length - 3 + index + 1}. ${item.id} - ${item.name} (${item.countryCode})`);
    });
  }
} catch (error) {
  console.error('Error:', error.message);
} 