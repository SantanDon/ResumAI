/**
 * Test Message Formatter Service
 * Tests markdown to HTML conversion
 */

import { messageFormatterService } from './src/services/messageFormatter';

interface TestCase {
    name: string;
    input: string;
    shouldNotContain: string[];
    shouldContain: string[];
}

const testCases: TestCase[] = [
    {
        name: 'Bold text conversion',
        input: 'This is **bold** text',
        shouldNotContain: ['**'],
        shouldContain: ['<strong>', 'bold', '</strong>']
    },
    {
        name: 'Italic text conversion',
        input: 'This is *italic* text',
        shouldNotContain: ['*italic*'],
        shouldContain: ['<em>', 'italic', '</em>']
    },
    {
        name: 'Header conversion',
        input: '# Main Header\n## Sub Header\n### Sub Sub Header',
        shouldNotContain: ['#'],
        shouldContain: ['<h1', '<h2', '<h3', 'Main Header', 'Sub Header']
    },
    {
        name: 'List conversion',
        input: '• Item 1\n• Item 2\n• Item 3',
        shouldNotContain: ['•'],
        shouldContain: ['<ul', '<li>', 'Item 1', 'Item 2', 'Item 3']
    },
    {
        name: 'Emoji preservation',
        input: 'Great job! 🎉 You did it! 🚀',
        shouldNotContain: [],
        shouldContain: ['🎉', '🚀', 'Great job', 'You did it']
    },
    {
        name: 'Separator removal',
        input: 'Section 1\n---\nSection 2',
        shouldNotContain: ['---'],
        shouldContain: ['Section 1', 'Section 2']
    },
    {
        name: 'Complex message',
        input: `# CV Enhancement Tips

Here are some **powerful** tips to improve your CV:

• Use *action verbs* at the start of bullets
• Quantify your **achievements** with numbers
• Keep it to 1-2 pages

---

Good luck! 🍀`,
        shouldNotContain: ['**', '*action', '•', '---'],
        shouldContain: ['<h1', '<strong>', '<em>', '<ul', '<li>', '🍀']
    }
];

function runTests() {
    console.log('='.repeat(60));
    console.log('🧪 Message Formatter Service Tests');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        console.log(`\n${index + 1}. ${testCase.name}`);
        console.log('-'.repeat(40));
        
        const result = messageFormatterService.formatMessage(testCase.input);
        
        let testPassed = true;
        
        // Check that unwanted strings are not present
        for (const unwanted of testCase.shouldNotContain) {
            if (result.includes(unwanted)) {
                console.log(`   ❌ Found unwanted text: "${unwanted}"`);
                testPassed = false;
            }
        }
        
        // Check that required strings are present
        for (const required of testCase.shouldContain) {
            if (!result.includes(required)) {
                console.log(`   ❌ Missing required text: "${required}"`);
                testPassed = false;
            }
        }
        
        if (testPassed) {
            console.log(`   ✅ PASS`);
            passed++;
        } else {
            console.log(`   ❌ FAIL`);
            console.log(`   Output: ${result.slice(0, 100)}...`);
            failed++;
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${testCases.length}`);
    console.log('='.repeat(60));
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
