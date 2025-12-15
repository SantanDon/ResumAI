const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api/cv/parse';
const TEMPLATE_DIR = path.join(__dirname, 'templateCV');

async function testUpload() {
  console.log('Starting E2E Test...');
  
  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(`Template directory not found: ${TEMPLATE_DIR}`);
    return;
  }

  const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('No PDF files found in templateCV.');
    return;
  }

  console.log(`Found ${files.length} CVs to test.`);

  for (const file of files) {
    console.log(`\nTesting: ${file}`);
    const filePath = path.join(TEMPLATE_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('cv', blob, file);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${file}`);
      } else {
        console.error(`❌ Failed: ${file} - ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Response:', text);
      }
    } catch (error) {
      console.error(`❌ Error testing ${file}:`, error);
    }
  }
  console.log('\nE2E Test Complete.');
}

testUpload();
