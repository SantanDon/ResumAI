import fs from 'fs';
import path from 'path';
import ollama from 'ollama';
// @ts-ignore
import pdfParse from 'pdf-parse';

async function checkOllama() {
    console.log('🔍 1. Checking Ollama connection...');
    try {
        // Simple list command to check connection and models
        const list = await ollama.list();
        console.log('✅ Ollama is running.');
        
        const modelName = 'llama3.2:1b';
        const modelExists = list.models.some((m: any) => m.name.includes(modelName));
        
        if (modelExists) {
            console.log(`✅ Model '${modelName}' is available.`);
        } else {
            console.error(`❌ Model '${modelName}' not found! Please run: ollama pull ${modelName}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Could not connect to Ollama. Is it running? (run "ollama serve")');
        console.error('Error details:', error);
        return false;
    }
}

async function checkPDFParsing() {
    console.log('\n🔍 2. Checking PDF Parsing (pdf-parse)...');
    
    // Find a test PDF
    const testDir = path.join(__dirname, '../templateCV');
    let pdfPath = '';
    
    if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir).filter(f => f.endsWith('.pdf'));
        if (files.length > 0) {
            pdfPath = path.join(testDir, files[0]);
            console.log(`📄 Found test PDF: ${files[0]}`);
        }
    }

    if (!pdfPath) {
        console.warn('⚠️ No test PDF found in templateCV. Creating a dummy one is not supported in this script yet.');
        console.warn('⚠️ Skipping PDF test.');
        return;
    }

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log(`   File size: ${dataBuffer.length} bytes`);
        
        const data = await pdfParse(dataBuffer);
        console.log('✅ PDF parsed successfully.');
        console.log(`   Text length: ${data.text.length} chars`);
        console.log(`   Pages: ${data.numpages}`);
        console.log(`   Info: ${JSON.stringify(data.info)}`);
    } catch (error) {
        console.error('❌ PDF Parse Failed!');
        console.error(error);
    }
}

async function main() {
    console.log('==========================================');
    console.log('   RESUMAI BACKEND DIAGNOSTIC TOOL');
    console.log('==========================================');
    
    const ollamaOk = await checkOllama();
    await checkPDFParsing();
    
    console.log('\n==========================================');
    if (ollamaOk) {
        console.log('✅ System seems healthy (Ollama connected).');
    } else {
        console.log('❌ Critical issues found. See above.');
    }
}

main().catch(console.error);
