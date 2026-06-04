
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
    try {
        const pdfPath = path.join(__dirname, 'test_cv.pdf');
        
        if (!fs.existsSync(pdfPath)) {
            console.error('❌ Test PDF not found at:', pdfPath);
            return;
        }

        console.log('📄 Preparing to upload:', pdfPath);
        
        const form = new FormData();
        form.append('cv', fs.createReadStream(pdfPath));

        console.log('🚀 Sending request to http://localhost:3001/api/cv/parse ...');
        
        const response = await axios.post('http://localhost:3001/api/cv/parse', form, {
            headers: {
                ...form.getHeaders()
            },
            validateStatus: () => true // Don't throw on 500
        });

        console.log(`\n📡 Response Status: ${response.status}`);
        console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error: any) {
        console.error('❌ Request Failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testUpload();
