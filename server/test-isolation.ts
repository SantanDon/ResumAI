
import { CVParser } from './src/cvparser';
import path from 'path';

async function run() {
    console.log('🧪 Testing CVParser in isolation (ts-node)...');
    const parser = new CVParser();
    const pdfPath = path.join(__dirname, '../templateCV/DS_Santos_CV (1) (2) (4).pdf');
    
    try {
        console.log(`📄 Parsing: ${pdfPath}`);
        const result = await parser.parseCV(pdfPath);
        console.log('✅ Success!');
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

run();
