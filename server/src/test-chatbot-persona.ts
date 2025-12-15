import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const USER_ID = 'default'; // Assuming default user has some CV data

async function testPersona() {
    console.log('🧪 Testing Chatbot Persona & Enhancement (2025 Standards)...\n');

    try {
        // 1. Test Chat Persona
        console.log('1. Testing Chat Persona...');
        const chatRes = await axios.post(`${API_URL}/cv/chat`, {
            userId: USER_ID,
            message: "How can I improve my CV for 2025?"
        });
        console.log('   User: "How can I improve my CV for 2025?"');
        console.log(`   Bot: "${chatRes.data.response}"\n`);

        // 2. Test Summary Generation
        console.log('2. Testing Summary Generation...');
        const summaryRes = await axios.post(`${API_URL}/cv/summary`, {
            userId: USER_ID
        });
        console.log(`   Summary: "${summaryRes.data.summary.overview}"\n`);

        // 3. Test Enhancement Suggestions
        console.log('3. Testing Enhancement Suggestions...');
        const enhanceRes = await axios.post(`${API_URL}/cv/enhance`, {
            userId: USER_ID
        });
        console.log(`   Suggestions: "${enhanceRes.data.suggestions[0]}"\n`);

    } catch (error: any) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testPersona();
