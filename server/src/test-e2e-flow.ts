import fs from 'fs';
import path from 'path';

// Polyfill fetch if needed (Node 18+ has it native)
// @ts-ignore
const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';
const PDF_PATH = path.join(__dirname, '../test_cv.pdf');

async function runTest() {
    console.log('🚀 Starting End-to-End Workflow Test');
    console.log(`📂 Using CV: ${PDF_PATH}`);

    // 1. Parse CV
    console.log('\n--- Step 1: Parsing CV ---');
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(PDF_PATH);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('cv', blob, 'test_cv.pdf');

    try {
        const parseRes = await fetch(`${BASE_URL}/cv/parse`, {
            method: 'POST',
            body: formData,
        });
        const parseData = await parseRes.json();
        
        if (!parseData.success) {
            throw new Error(`Parse failed: ${parseData.error}`);
        }
        
        const userId = parseData.userId;
        console.log(`✅ CV Parsed! User ID: ${userId}`);

        // 2. Get Summary
        console.log('\n--- Step 2: Fetching Summary ---');
        const summaryRes = await fetch(`${BASE_URL}/cv/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        const summaryData = await summaryRes.json();

        if (!summaryData.success) {
            throw new Error(`Summary failed: ${summaryData.error}`);
        }

        console.log('✅ Summary Received:');
        console.log(`   Overview: ${summaryData.summary.overview}`);
        console.log(`   Skills: ${summaryData.summary.keySkills.join(', ')}`);

        // 3. Chat
        console.log('\n--- Step 3: Testing Chat ---');
        const chatRes = await fetch(`${BASE_URL}/cv/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message: 'What are my top skills?' }),
        });
        const chatData = await chatRes.json();

        if (!chatData.success) {
            throw new Error(`Chat failed: ${chatData.error}`);
        }

        console.log('✅ Chat Response Received:');
        console.log(`   AI: ${chatData.response}`);

        console.log('\n🎉 TEST PASSED: Full workflow is operational!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    }
}

runTest();
