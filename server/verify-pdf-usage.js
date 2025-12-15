const pdf = require('pdf-parse');
const fs = require('fs');

async function test() {
    try {
        const buffer = fs.readFileSync('test_cv.pdf');
        console.log('Instantiating...');
        const parser = new pdf.PDFParse({ verbosity: 0 });
        console.log('Loading...');
        // Try loadPDF first as it seems more specific
        const u8 = new Uint8Array(buffer);
        try {
            console.log('Trying load(u8)...');
            await parser.load(u8);
            console.log('Success load(u8)');
        } catch(e) { console.log('Fail load(u8):', e.message); }

        try {
            console.log('Trying load({ data: u8 })...');
            await parser.load({ data: u8 });
            console.log('Success load({ data: u8 })');
        } catch(e) { console.log('Fail load({ data: u8 }):', e.message); }

        try {
            console.log('Trying load({ data: u8, url: "" })...');
            await parser.load({ data: u8, url: '' });
            console.log('Success load({ data: u8, url: "" })');
        } catch(e) { console.log('Fail load({ data: u8, url: "" }):', e.message); }
        
        const text = await parser.getText();
        console.log('Text:', text.text || text);
    } catch(e) {
        console.log('Error:', e.message);
        console.log('Stack:', e.stack);
    }
}
test();
