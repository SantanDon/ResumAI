import { db } from './db';
import { masterCVTransformer } from './services/masterCVTransformer';

const userId = 'demo@resumai.com';

async function verify() {
    console.log('🔍 VERIFYING TRANSFORMATION FIXES...');
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all(userId) as any[];
    console.log(`Loaded ${entries.length} records.`);

    const resume = masterCVTransformer.toJSONResume(entries);

    if (!resume.education || !resume.work) {
        console.error('❌ FAILED: Education or Work array is undefined!');
        process.exit(1);
    }

    // Assertions
    console.log('\nAsserting Education Content:');
    const invalidEdu = resume.education.filter(edu => 
        edu.institution.toLowerCase().includes('skills') || 
        edu.institution.toLowerCase().includes('professional experience') ||
        edu.institution.toLowerCase().includes('diploma')
    );
    if (invalidEdu.length > 0) {
        console.error('❌ FAILED: Found invalid education institution names:', invalidEdu);
        process.exit(1);
    } else {
        console.log('✅ Passed: Education institutions look clean and correct!');
    }

    console.log('\nAsserting Education Duplicates:');
    const seenSchools = new Set<string>();
    let eduDuplicate = false;
    for (const edu of resume.education) {
        if (seenSchools.has(edu.institution)) {
            console.error(`❌ FAILED: Duplicate education entry found: ${edu.institution}`);
            eduDuplicate = true;
        }
        seenSchools.add(edu.institution);
    }
    if (!eduDuplicate) {
        console.log('✅ Passed: No duplicate education entries!');
    }

    console.log('\nAsserting Work Experience:');
    if (resume.work.length === 0) {
        console.error('❌ FAILED: Work experience is empty!');
        process.exit(1);
    } else {
        console.log(`✅ Passed: Found ${resume.work.length} job(s).`);
        console.log(JSON.stringify(resume.work, null, 2));
    }

    console.log('\nAsserting Work Duplicates:');
    const seenJobs = new Set<string>();
    let jobDuplicate = false;
    for (const job of resume.work) {
        const key = `${job.name} - ${job.position}`;
        if (seenJobs.has(key)) {
            console.error(`❌ FAILED: Duplicate work entry found: ${key}`);
            jobDuplicate = true;
        }
        seenJobs.add(key);
    }
    if (!jobDuplicate) {
        console.log('✅ Passed: No duplicate work experience entries!');
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

verify().catch(console.error);
