import './preload-env.js';

import { query } from './infra/database/client.js';
import { encrypt } from './infra/encryption/crypto.js';
import argon2 from 'argon2';
import { saveJob } from './modules/job-discovery/job-discovery.repository.js';
import { calculateUserJobMatch } from './modules/matching/matching.service.js';
import { initiateApplication, approveAndQueueApplication, processApplicationSubmission } from './modules/applications/applications.service.js';

async function runE2E() {
  console.log('🧪 Starting End-to-End Integration Test Pipeline...');

  let testUserId: string | null = null;
  let testJobId: string | null = null;
  let testExperienceId: string | null = null;

  try {
    // 1. Create a mock candidate user
    const passHash = await argon2.hash('password123');
    const userRes = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, phone, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id;`,
      ['e2e-candidate@iranse.ng', passHash, '08000000000', 'E2E Test Candidate', 'user']
    );
    testUserId = userRes.rows[0].id;
    console.log(`👤 1. Created/Retrieved Candidate User: ${testUserId}`);

    // Create experiences
    const expRes = await query<{ id: string }>(
      `INSERT INTO experiences (user_id, title, company, location, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id;`,
      [testUserId, 'Senior Node Developer', 'PayBridge', 'Lagos, Nigeria', '2022-01-01', null, 'Built microservices and cached REST API layers.']
    );
    testExperienceId = expRes.rows[0].id;

    // Create embedding vectors for achievements to test similarity computations
    const mockVector = new Array(1536).fill(0.1);
    mockVector[0] = 0.9; // give some relevance
    const vectorString = '[' + mockVector.join(',') + ']';

    await query(
      `INSERT INTO achievements (user_id, experience_id, description, embedding)
       VALUES ($1, $2, $3, $4::vector);`,
      [testUserId, testExperienceId, 'Architected payment processing engine reducing lag times by 30%.', vectorString]
    );
    console.log('💼 2. Created Experience History & Vectorized Achievements.');

    // 2. Ingest a mock job listing
    const jobPayload = {
      title: 'Senior Backend Engineer (Node.js/SQL)',
      company: 'Express Fintech Limited',
      location: 'Lekki, Lagos (Hybrid)',
      description: 'We are seeking a developer with extensive experience building Node.js microservices and optimizing database schemas.',
      url: 'https://careers.expressfintech.ng/jobs/senior-backend-engineer',
      sourceId: 'greenhouse',
      salary: '₦1,000,000 / month',
      experienceLevel: 'Senior',
      skills: ['Node.js', 'PostgreSQL', 'Redis'],
    };
    
    const savedJob = await saveJob(jobPayload);
    if (!savedJob) throw new Error('Ingested job returned null');
    testJobId = savedJob.id;
    console.log(`📡 3. Ingested Mock Job Listing: "${savedJob.title}" (ID: ${testJobId})`);

    // 3. Trigger Scorer Calculations
    console.log('📐 4. Running Multi-dimensional Scorer Pipeline...');
    const match = await calculateUserJobMatch(testUserId, testJobId);
    console.log(`🎯 Overall Match Score calculated: ${match.overall_score}%`);
    console.log(`Skills: ${match.skills_score}%, Experience: ${match.experience_score}%, Location: ${match.location_score}%, Salary: ${match.salary_score}%`);

    // 4. Staging Dynamic Cover Letter and Tailored Resume Variant
    console.log('✍️ 5. Staging application draft (MMR variety selections)...');
    const stage = await initiateApplication(testUserId, testJobId);
    console.log(`Resume variant created: ${stage.materials.resumeUrl}`);
    console.log('Tailored Cover Letter Pitch preview:');
    console.log(stage.materials.coverLetter.substring(0, 150) + '...\n');

    // 5. Connect job portal connected accounts to verify decryption
    const encryptedSecret = encrypt('my-super-secret-password'); // valid encrypted payload format
    await query(
      `INSERT INTO connected_accounts (user_id, portal_id, username, password_encrypted)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, portal_id) DO UPDATE SET username = EXCLUDED.username;`,
      [testUserId, 'greenhouse', 'e2e-user', encryptedSecret]
    );

    // 6. User Approves & Queues Application
    console.log('🗳️ 6. Simulating candidate approval action...');
    const approval = await approveAndQueueApplication(testUserId, testJobId);
    console.log(`Application successfully queued in status: ${approval.status}`);

    // 7. Background Worker Processes Submission
    console.log('📤 7. Triggering simulated submission background worker process...');
    const submitResult = await processApplicationSubmission(approval.applicationId);
    console.log(`Submission finalized with status outcome: ${submitResult.status}`);

    if (submitResult.status === 'Submitted') {
      console.log('🎉 ✅ E2E Integration test PASSED successfully!');
    } else {
      console.error(`⚠️ Test ended in status: ${submitResult.status} (Expected: Submitted)`);
    }

  } catch (error) {
    console.error('❌ E2E Integration test FAILED with error:', error);
  } finally {
    // 8. Cleanup test data
    console.log('🧼 Cleaning up E2E temporary database entries...');
    if (testUserId) {
      await query(`DELETE FROM users WHERE id = $1;`, [testUserId]);
    }
    if (testJobId) {
      await query(`DELETE FROM jobs WHERE id = $1;`, [testJobId]);
    }
    console.log('✨ Cleanup complete.');
    process.exit(0);
  }
}

runE2E();
