const pdf = require('pdf-parse');
console.log('Prototype methods:', Object.getOwnPropertyNames(pdf.PDFParse.prototype));
try {
    const parser = new pdf.PDFParse();
    console.log('Instance keys:', Object.keys(parser));
} catch(e) {
    console.log('Instantiation error:', e.message);
}
