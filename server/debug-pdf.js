const pdf = require('pdf-parse');
console.log('Type:', typeof pdf);
console.log('Keys:', Object.keys(pdf));
console.log('Is function?', typeof pdf === 'function');
try {
    console.log('Default:', typeof pdf.default);
} catch(e) {}
