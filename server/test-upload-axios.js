const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');

async function testUpload() {
    const filePath = path.join(__dirname, 'test_cv.pdf');
    
    // Use existing test_cv.pdf if available, otherwise fail
    if (!fs.existsSync(filePath)) {
        console.error('Please ensure test_cv.pdf exists in server directory');
        return;
    }

    // Verify locally
    try {
        const localParse = require('pdf-parse');
        const localData = await localParse(fs.readFileSync(filePath));
        console.log('✅ Local parse successful:', localData.text.trim().substring(0, 50) + '...');
    } catch(e) {
        console.log('❌ Local parse failed:', e.message);
        return;
    }

    const form = new FormData();
    form.append('cv', fs.createReadStream(filePath));

    try {
        console.log('Uploading CV...');
        const response = await axios.post('http://localhost:3001/api/cv/parse', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        const data = response.data;
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.userId) {
            console.log('✅ Upload successful! User ID:', data.userId);
            
            const masterResponse = await axios.get(`http://localhost:3001/api/cv/master/${data.userId}`);
            const masterData = masterResponse.data;
            console.log('Master CV Entries:', masterData.masterCV.length);
            if (masterData.masterCV.length > 0) {
                console.log('✅ Master CV entries found!');
                console.log('Entries:', JSON.stringify(masterData.masterCV, null, 2));
            } else {
                console.log('❌ No entries found in Master CV.');
            }
        } else {
            console.log('❌ Upload failed or no userId returned.');
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testUpload();
