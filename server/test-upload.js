const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
    const filePath = path.join(__dirname, 'test_cv.pdf');
    
    // Create dummy PDF if it doesn't exist
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Test CV User) Tj\n0 -30 Td\n(test@example.com) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000204 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n309\n%%EOF');
    }

    const form = new FormData();
    form.append('cv', fs.createReadStream(filePath));

    try {
        console.log('Uploading CV...');
        // Use native fetch (Node 18+)
        const response = await fetch('http://localhost:3001/api/cv/parse', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.userId) {
            console.log('✅ Upload successful! User ID:', data.userId);
            
            // Verify we can fetch the master CV for this user
            const masterResponse = await fetch(`http://localhost:3001/api/cv/master/${data.userId}`);
            const masterData = await masterResponse.json();
            console.log('Master CV Entries:', masterData.masterCV.length);
            if (masterData.masterCV.length > 0) {
                console.log('✅ Master CV entries found!');
            } else {
                console.log('❌ No entries found in Master CV.');
            }
        } else {
            console.log('❌ Upload failed or no userId returned.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testUpload();
