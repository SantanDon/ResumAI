const pdfParse = require('pdf-parse');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('Keys of pdfParse:', Object.keys(pdfParse));
if (pdfParse.PDFParse) {
    console.log('PDFParse is present.');
    console.log('Type of PDFParse:', typeof pdfParse.PDFParse);
}
