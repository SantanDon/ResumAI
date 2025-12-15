const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function test() {
    try {
        // Create a dummy PDF buffer (this won't work as a real PDF but will test the import)
        // Or better, just check the type of 'pdf'
        console.log('Type of pdf export:', typeof pdf);
        console.log('Is it a function?', typeof pdf === 'function');
        
        try {
            const parser = new pdf.PDFParse();
            console.log('new pdf.PDFParse() worked');
        } catch (e) {
            console.log('new pdf.PDFParse() failed:', e.message);
        }
    } catch (e) {
        console.error(e);
    }
}

test();
