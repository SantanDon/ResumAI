import { CVParser } from './cvparser';
import path from 'path';

async function main() {
    const parser = new CVParser();

    const cvPath = path.join(__dirname, '../test_cv.pdf');

    const result = await parser.parseCV(cvPath);

    console.log("\n" + "=".repeat(60));
    console.log("📊 PARSING RESULTS");
    console.log("=".repeat(60) + "\n");

    console.log(`Total Lines: ${result.lines.length}`);
    console.log(`Emails Found: ${result.classifications.email.length}`);
    console.log(`Phones Found: ${result.classifications.phone.length}`);
    console.log(`Dates Found: ${result.classifications.date.length}\n`);

    if (result.classifications.email.length > 0) {
        console.log("📧 Emails:");
        result.classifications.email.forEach(email => console.log(`  - ${email}`));
    }

    if (result.classifications.phone.length > 0) {
        console.log("\n📞 Phones:");
        result.classifications.phone.forEach(phone => console.log(`  - ${phone}`));
    }

    if (result.classifications.date.length > 0) {
        console.log("\n📅 Dates:");
        result.classifications.date.forEach(date => console.log(`  - ${date}`));
    }
}

main().catch(console.error);
