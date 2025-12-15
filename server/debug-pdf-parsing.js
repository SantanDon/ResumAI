const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

async function testPdfParse() {
    try {
        console.log('Testing pdf-parse with test_cv.pdf...');
        const pdfPath = path.join(__dirname, 'test_cv.pdf');
        if (!fs.existsSync(pdfPath)) {
            throw new Error('test_cv.pdf not found!');
        }
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        console.log('✅ PDF Parse Success!');
        console.log('Text content length:', data.text.length);
    } catch (error) {
        console.error('❌ PDF Parse Failed:', error);
    }
}

testPdfParse();
