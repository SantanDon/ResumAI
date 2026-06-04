const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3002/api/cv/parse';
const TEST_DIR = path.join(__dirname, 'before');

async function testUpload() {
  console.log('Starting CV Parse Test...');
  
  if (!fs.existsSync(TEST_DIR)) {
    console.error(`Test directory not found: ${TEST_DIR}`);
    return;
  }

  const files = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('No PDF files found in /before folder.');
    return;
  }

  console.log(`Found ${files.length} CVs to test.`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    console.log(`\n📄 Testing: ${file}`);
    const filePath = path.join(TEST_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('cv', blob, file);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${file} (userId: ${data.userId || 'N/A'})`);
        successCount++;
      } else {
        console.error(`❌ Failed: ${file} - ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error('Response:', text.substring(0, 200));
        failCount++;
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.error(`⏱️ Timeout: ${file} - Server not responding`);
      } else {
        console.error(`❌ Error testing ${file}:`, error.message);
      }
      failCount++;
    }
  }
  
  console.log('\n═══════════════════════════════');
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${files.length}`);
  console.log(`═══════════════════════════════`);
  
  if (successCount > 0) {
    console.log('\n🎉 CV parsing is working correctly!');
  } else if (failCount === files.length) {
    console.log('\n⚠️ Server may not be running. Start with: cd server && npm run dev');
  }
}

testUpload();
