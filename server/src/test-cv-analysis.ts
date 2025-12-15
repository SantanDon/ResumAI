import { CVAnalyzer } from './swarm/prompts';

async function testCVAnalysis() {
    const analyzer = new CVAnalyzer(5);

    console.log("=== Testing CV Email Extraction ===\n");
    const sampleCV = `
    John Doe
    Software Engineer
    Email: john.doe@example.com
    Phone: +1 234 567 8900
  `;

    const email = await analyzer.extractEmail(sampleCV);
    console.log("Extracted Email:", email);

    console.log("\n=== Testing Bullet Point Improvement ===\n");
    const originalBullet = "Managed a team of developers and created features.";
    console.log("Original:", originalBullet);

    const improved = await analyzer.improveBullet(originalBullet);
    console.log("Improved:", improved);
}

testCVAnalysis().catch(console.error);
