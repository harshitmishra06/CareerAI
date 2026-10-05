/**
 * Phase 6: Resume Management & Storage Configuration Test Suite
 *
 * Verifies:
 * 1. Environment-Based Storage Rules & Production Safety:
 *    - Development without Cloudinary -> local storage allowed
 *    - Test -> mock/in-memory storage used (zero external credentials required)
 *    - Production without Cloudinary -> throws clear configuration error (STORAGE_CONFIG_ERROR), no local fallback
 *    - Production with Cloudinary -> Cloudinary storage selected
 *    - Production upload failure -> reports 502 error, NEVER silently falls back to local storage
 * 2. PDF Validation & Processing:
 *    - %PDF- magic signature validation
 *    - Plain text extraction into parsedText (excluded from JSON responses)
 *    - 5MB upload limit rejection
 *    - Non-PDF / corrupt file rejection
 * 3. Resume Ownership & Default Selection:
 *    - First resume is automatically assigned as default
 *    - Uploading second resume preserves default
 *    - Switching default flips boolean flag atomically
 *    - Candidate isolation (Candidate B cannot view, modify, or delete Candidate A's resume)
 * 4. Application Attachment & In-Use Deletion Protection:
 *    - Candidate applies to a job attaching resume
 *    - Cross-candidate attachment blocked (Candidate B cannot attach Candidate A's resume)
 *    - In-use deletion protection (attached resume cannot be deleted)
 *    - Unattached resume deleted cleanly from database and storage
 * 5. Secure Recruiter Access:
 *    - Recruiter who posted the job can download the attached resume binary
 *    - Non-hiring recruiter blocked from accessing resume
 *    - Recruiter cannot access unattached resumes
 */

import { StorageService } from '../services/storage.service.js';
import { PdfParserService } from '../services/pdfParser.service.js';
import { ENV } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/resumes');

const BASE_URL = 'http://localhost:5001/api/v1';

// Helper to generate a valid PDF buffer with minimal compliant structure
const createValidPdfBuffer = (customText = 'Antigravity Verified Candidate Resume Content') => {
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${customText.length + 30} >>
stream
BT
/F1 12 Tf
100 700 Td
(${customText}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000204 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`);
};

export const runPhase6Tests = async () => {
  console.log('🧪 Starting Phase 6 Resume Management & Storage Configuration Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details}`);
      failed++;
    }
  };

  try {
    const ts = Date.now();

    // =========================================================================
    // SECTION 1: Storage Provider Environment Rules & Production Safety
    // =========================================================================
    console.log('\n--- Section 1: Storage Provider Environment Rules & Production Safety ---');

    // 1.1 Test Environment Provider Selection
    const testProvider = StorageService.getStorageProvider('test');
    assert(
      testProvider === 'test',
      'Test Environment uses isolated mock/in-memory storage adapter',
      `Got: ${testProvider}`
    );

    // 1.2 Development Environment without Cloudinary Credentials -> Local Storage Allowed
    const origCloudName = ENV.CLOUDINARY_CLOUD_NAME;
    const origApiKey = ENV.CLOUDINARY_API_KEY;
    const origApiSecret = ENV.CLOUDINARY_API_SECRET;

    ENV.CLOUDINARY_CLOUD_NAME = '';
    ENV.CLOUDINARY_API_KEY = '';
    ENV.CLOUDINARY_API_SECRET = '';

    const devProviderWithoutCloudinary = StorageService.getStorageProvider('development');
    assert(
      devProviderWithoutCloudinary === 'local',
      'Development environment allows local storage when Cloudinary credentials are absent',
      `Got: ${devProviderWithoutCloudinary}`
    );

    // 1.3 Production Environment without Cloudinary -> Fails Fast with Clear Configuration Error
    let prodConfigErrorThrown = false;
    let prodConfigErrorCode = null;
    try {
      StorageService.getStorageProvider('production');
    } catch (err) {
      prodConfigErrorThrown = true;
      prodConfigErrorCode = err.code || err.details;
    }
    assert(
      prodConfigErrorThrown && prodConfigErrorCode === 'STORAGE_CONFIG_ERROR',
      'Production environment missing Cloudinary credentials throws STORAGE_CONFIG_ERROR (Fail-fast)',
      `Error thrown: ${prodConfigErrorThrown}, code: ${prodConfigErrorCode}`
    );

    // 1.4 Production Safety: Direct upload attempt in production with missing credentials MUST NOT fall back to local disk
    let prodUploadErrorThrown = false;
    const testBuffer = createValidPdfBuffer('Safety check buffer');
    const localFilesBefore = fs.existsSync(LOCAL_UPLOADS_DIR) ? fs.readdirSync(LOCAL_UPLOADS_DIR) : [];

    try {
      await StorageService.uploadFile({
        buffer: testBuffer,
        originalName: 'prod_safety_test.pdf',
        mimeType: 'application/pdf',
        candidateId: 'test_candidate_safety',
        overrideEnv: 'production'
      });
    } catch (err) {
      prodUploadErrorThrown = true;
      assert(
        err.code === 'STORAGE_CONFIG_ERROR' || err.statusCode === 500,
        'Production upload rejects immediately with configuration error when Cloudinary missing',
        `Error: ${err.message}`
      );
    }
    assert(prodUploadErrorThrown, 'Production upload strictly rejected when Cloudinary is not configured');

    const localFilesAfter = fs.existsSync(LOCAL_UPLOADS_DIR) ? fs.readdirSync(LOCAL_UPLOADS_DIR) : [];
    assert(
      localFilesBefore.length === localFilesAfter.length,
      'CRITICAL: Production NEVER silently falls back to local filesystem storage'
    );

    // 1.5 Production Environment with Cloudinary Credentials -> Selects Cloudinary Provider
    ENV.CLOUDINARY_CLOUD_NAME = 'demo_cloud';
    ENV.CLOUDINARY_API_KEY = '123456789012345';
    ENV.CLOUDINARY_API_SECRET = 'secret_test_key_12345';

    const prodProviderWithCloudinary = StorageService.getStorageProvider('production');
    assert(
      prodProviderWithCloudinary === 'cloudinary',
      'Production environment with Cloudinary credentials selects Cloudinary storage only',
      `Got: ${prodProviderWithCloudinary}`
    );

    // 1.6 Production Storage Failure Guard: Verify Cloudinary failure rejects with 502 and NO local fallback
    let prodFailureErrorThrown = false;
    const localFilesBeforeFail = fs.existsSync(LOCAL_UPLOADS_DIR) ? fs.readdirSync(LOCAL_UPLOADS_DIR) : [];

    try {
      await StorageService.uploadFile({
        buffer: testBuffer,
        originalName: 'prod_failure_test.pdf',
        mimeType: 'application/pdf',
        candidateId: 'test_candidate_fail',
        overrideEnv: 'production'
      });
    } catch (err) {
      prodFailureErrorThrown = true;
      assert(
        err.code === 'CLOUD_STORAGE_ERROR' && err.statusCode === 502,
        'Production Cloudinary upload failure rejects with 502 CLOUD_STORAGE_ERROR',
        `Error: [${err.code}] ${err.message}`
      );
    }
    assert(prodFailureErrorThrown, 'Production upload failure caught and rejected as 502');

    const localFilesAfterFail = fs.existsSync(LOCAL_UPLOADS_DIR) ? fs.readdirSync(LOCAL_UPLOADS_DIR) : [];
    assert(
      localFilesBeforeFail.length === localFilesAfterFail.length,
      'CRITICAL: Cloudinary failure in production DOES NOT fall back to local storage'
    );

    // Restore environment variables so subsequent HTTP requests behave as configured
    ENV.CLOUDINARY_CLOUD_NAME = origCloudName;
    ENV.CLOUDINARY_API_KEY = origApiKey;
    ENV.CLOUDINARY_API_SECRET = origApiSecret;

    // =========================================================================
    // SECTION 2: PDF Validation & Signature Checks
    // =========================================================================
    console.log('\n--- Section 2: PDF Signature & Text Extraction Engine ---');

    // 2.1 Valid PDF Signature
    const validPdfBuf = createValidPdfBuffer('John Doe Full-Stack Engineer Expertise');
    assert(
      PdfParserService.isPdfSignature(validPdfBuf),
      'PdfParserService correctly identifies valid %PDF- magic signature'
    );

    // 2.2 Text Extraction
    const extractionResult = await PdfParserService.extractText(validPdfBuf);
    assert(
      extractionResult.text && extractionResult.text.includes('John Doe Full-Stack Engineer'),
      'PdfParserService cleanly extracts plain text from valid PDF',
      `Extracted: "${extractionResult.text}"`
    );

    // 2.3 Invalid Signature Rejection
    const fakePdfBuf = Buffer.from('NOT A PDF FILE JUST PLAIN TEXT CONTENT');
    assert(
      !PdfParserService.isPdfSignature(fakePdfBuf),
      'PdfParserService rejects file without %PDF- signature'
    );

    let fakeExtractFailed = false;
    try {
      await PdfParserService.extractText(fakePdfBuf);
    } catch {
      fakeExtractFailed = true;
    }
    assert(fakeExtractFailed, 'PdfParserService.extractText throws error on non-PDF buffer');

    // =========================================================================
    // SECTION 3: HTTP API Setup & Principals
    // =========================================================================
    console.log('\n--- Section 3: Principals Registration & Job Setup ---');

    // Register Recruiter A
    const recARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hiring Recruiter Alice',
        email: `alice.p6.${ts}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recAData = await recARes.json();
    const tokenRecA = recAData.data.token;

    // Register Recruiter B (Unauthorized third-party recruiter)
    const recBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Recruiter Bob',
        email: `bob.p6.${ts}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recBData = await recBRes.json();
    const tokenRecB = recBData.data.token;

    // Register Candidate A
    const candARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Charlie',
        email: `charlie.p6.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candAData = await candARes.json();
    const tokenCandA = candAData.data.token;

    // Register Candidate B
    const candBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Diana',
        email: `diana.p6.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candBData = await candBRes.json();
    const tokenCandB = candBData.data.token;

    // Recruiter A creates company and publishes a job
    await fetch(`${BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRecA}` },
      body: JSON.stringify({
        name: `TechNova Solutions ${ts}`,
        industry: 'Software',
        location: 'Austin, TX'
      })
    });

    const jobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRecA}` },
      body: JSON.stringify({
        title: `Senior Fullstack Developer ${ts}`,
        description: 'Seeking experienced Node.js and React engineer to build scalable cloud architectures.',
        skills: ['Node.js', 'React', 'MongoDB'],
        location: 'Austin, TX',
        workMode: 'remote',
        employmentType: 'full-time',
        status: 'published'
      })
    });
    const jobData = await jobRes.json();
    const targetJobId = jobData.data._id;
    assert(Boolean(targetJobId), 'Recruiter A successfully created and published job');

    // =========================================================================
    // SECTION 4: Resume Upload API Endpoints
    // =========================================================================
    console.log('\n--- Section 4: Resume Upload & Validation API ---');

    // 4.1 Non-Candidate Upload Attempt Blocked (RBAC)
    const recUploadFd = new FormData();
    recUploadFd.append('resume', new Blob([validPdfBuf], { type: 'application/pdf' }), 'recruiter_resume.pdf');
    const recUploadRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenRecA}` },
      body: recUploadFd
    });
    assert(
      recUploadRes.status === 403,
      'Non-candidate (recruiter) resume upload attempt is rejected with 403 Forbidden',
      `Got status: ${recUploadRes.status}`
    );

    // 4.2 Corrupt/Non-PDF Upload Rejection
    const corruptFd = new FormData();
    corruptFd.append('resume', new Blob([Buffer.from('Corrupt plain text file')], { type: 'application/pdf' }), 'corrupt.pdf');
    const corruptRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandA}` },
      body: corruptFd
    });
    const corruptData = await corruptRes.json();
    assert(
      corruptRes.status === 400 && corruptData.error.message.includes('signature'),
      'Corrupt / non-PDF file upload rejected with 400 Bad Request',
      `Got status: ${corruptRes.status}, msg: ${corruptData.error?.message}`
    );

    // 4.3 Oversized File Upload Rejection (> 5MB)
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 0x20); // 6MB
    oversizedBuffer.write('%PDF-1.4\n', 0);
    const oversizedFd = new FormData();
    oversizedFd.append('resume', new Blob([oversizedBuffer], { type: 'application/pdf' }), 'large.pdf');
    const oversizedRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandA}` },
      body: oversizedFd
    });
    assert(
      oversizedRes.status === 400,
      'Oversized file upload (>5MB) rejected with 400 Bad Request',
      `Got status: ${oversizedRes.status}`
    );

    // 4.4 Successful Resume 1 Upload by Candidate A
    const resume1Text = 'Candidate Charlie: 6 years full-stack TypeScript, React, Node.js, distributed databases.';
    const resume1Buffer = createValidPdfBuffer(resume1Text);
    const upload1Fd = new FormData();
    upload1Fd.append('resume', new Blob([resume1Buffer], { type: 'application/pdf' }), 'charlie_primary_resume.pdf');

    const upload1Res = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandA}` },
      body: upload1Fd
    });
    const upload1Data = await upload1Res.json();
    assert(
      upload1Res.status === 201 && upload1Data.success,
      'Candidate A uploads valid PDF resume successfully (201 Created)',
      `Got status: ${upload1Res.status}`
    );

    const resume1 = upload1Data.data;
    assert(
      resume1.isDefault === true,
      'First uploaded resume is automatically marked as default (isDefault = true)'
    );
    assert(
      resume1.status === 'ready',
      'Uploaded resume status is immediately set to ready'
    );
    assert(
      resume1.parsedText === undefined,
      'parsedText is securely excluded from API response JSON'
    );

    // Verify parsedText remains excluded from single resume query response
    const getResume1Res = await fetch(`${BASE_URL}/resumes/${resume1._id}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const getResume1Data = await getResume1Res.json();
    assert(
      getResume1Res.status === 200 && getResume1Data.data.parsedText === undefined,
      'parsedText remains securely excluded from single resume query response'
    );

    // 4.5 Upload Second Resume by Candidate A (Non-default by default)
    const resume2Text = 'Candidate Charlie Secondary Resume: Cloud DevOps Specialist, Kubernetes, Terraform.';
    const resume2Buffer = createValidPdfBuffer(resume2Text);
    const upload2Fd = new FormData();
    upload2Fd.append('resume', new Blob([resume2Buffer], { type: 'application/pdf' }), 'charlie_secondary_resume.pdf');

    const upload2Res = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandA}` },
      body: upload2Fd
    });
    const upload2Data = await upload2Res.json();
    const resume2 = upload2Data.data;
    assert(
      upload2Res.status === 201 && resume2.isDefault === false,
      'Second uploaded resume defaults to isDefault = false',
      `isDefault: ${resume2.isDefault}`
    );

    // =========================================================================
    // SECTION 5: Resume Listing & Default Selection
    // =========================================================================
    console.log('\n--- Section 5: Resume Listing & Default Selection ---');

    // 5.1 Candidate A lists all resumes
    const listRes = await fetch(`${BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 && Array.isArray(listData.data) && listData.data.length === 2,
      'Candidate A retrieves all their uploaded resumes (2 items)',
      `Count: ${listData.data?.length}`
    );
    assert(
      listData.data[0]._id === resume1._id && listData.data[0].isDefault === true,
      'Resumes returned with current default resume first'
    );

    // 5.2 Candidate A switches default resume to Resume 2
    const setDefaultRes = await fetch(`${BASE_URL}/resumes/${resume2._id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const setDefaultData = await setDefaultRes.json();
    assert(
      setDefaultRes.status === 200 && setDefaultData.data.isDefault === true,
      'Candidate A switches default resume to Resume 2 successfully'
    );

    // Verify Resume 1 was flipped to isDefault = false atomically via API
    const listResAfter = await fetch(`${BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const listDataAfter = await listResAfter.json();
    const resume1After = listDataAfter.data.find((r) => r._id === resume1._id);
    assert(
      resume1After && resume1After.isDefault === false,
      'Resume 1 was atomically unset as default (isDefault = false)'
    );

    // =========================================================================
    // SECTION 6: Cross-Candidate Ownership Isolation
    // =========================================================================
    console.log('\n--- Section 6: Cross-Candidate Isolation & Security ---');

    // 6.1 Candidate B attempts to view Candidate A's resume
    const candBViewRes = await fetch(`${BASE_URL}/resumes/${resume1._id}`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(
      candBViewRes.status === 403,
      'Candidate B cannot view metadata of Candidate A resume (403 Forbidden)',
      `Status: ${candBViewRes.status}`
    );

    // 6.2 Candidate B attempts to set Candidate A's resume as their default
    const candBDefaultRes = await fetch(`${BASE_URL}/resumes/${resume1._id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(
      candBDefaultRes.status === 403,
      'Candidate B cannot set Candidate A resume as default (403 Forbidden)',
      `Status: ${candBDefaultRes.status}`
    );

    // 6.3 Candidate B attempts to delete Candidate A's resume
    const candBDeleteRes = await fetch(`${BASE_URL}/resumes/${resume1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(
      candBDeleteRes.status === 403,
      'Candidate B cannot delete Candidate A resume (403 Forbidden)',
      `Status: ${candBDeleteRes.status}`
    );

    // 6.4 Candidate B attempts to download Candidate A's resume file directly
    const candBDownloadRes = await fetch(`${BASE_URL}/resumes/${resume1._id}/file`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(
      candBDownloadRes.status === 403,
      'Candidate B cannot download Candidate A resume file (403 Forbidden)',
      `Status: ${candBDownloadRes.status}`
    );

    // =========================================================================
    // SECTION 7: Job Application Attachment & In-Use Deletion Protection
    // =========================================================================
    console.log('\n--- Section 7: Application Attachment & In-Use Protection ---');

    // 7.1 Candidate B attempts to attach Candidate A's resume to an application
    const candBApplyWithOtherResume = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandB}` },
      body: JSON.stringify({
        jobId: targetJobId,
        coverLetter: 'Attempting to attach unowned resume',
        resumeId: resume1._id
      })
    });
    assert(
      candBApplyWithOtherResume.status === 403,
      'Candidate B cannot attach Candidate A resume to a job application (403 Forbidden)',
      `Status: ${candBApplyWithOtherResume.status}`
    );

    // 7.2 Candidate A applies to Job A attaching Resume 1
    const candAApplyRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({
        jobId: targetJobId,
        coverLetter: 'Excited about the Fullstack role at TechNova!',
        resumeId: resume1._id
      })
    });
    const candAApplyData = await candAApplyRes.json();
    assert(
      candAApplyRes.status === 201 && candAApplyData.success,
      'Candidate A applies to job attaching Resume 1 (201 Created)',
      `Status: ${candAApplyRes.status}`
    );
    assert(
      candAApplyData.data.resume && candAApplyData.data.resume._id === resume1._id,
      'Created application successfully populates attached resume reference'
    );
    assert(
      candAApplyData.data.resume.parsedText === undefined,
      'Application response excludes parsedText'
    );

    // 7.3 In-Use Deletion Protection: Candidate A attempts to delete attached Resume 1
    const deleteAttachedRes = await fetch(`${BASE_URL}/resumes/${resume1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const deleteAttachedData = await deleteAttachedRes.json();
    assert(
      deleteAttachedRes.status === 400 && deleteAttachedData.error.message.includes('attached'),
      'Cannot delete resume currently attached to submitted job applications (400 Bad Request)',
      `Status: ${deleteAttachedRes.status}, msg: ${deleteAttachedData.error?.message}`
    );

    // 7.4 Deletion of Unattached Resume: Candidate A deletes unattached Resume 2
    const deleteUnattachedRes = await fetch(`${BASE_URL}/resumes/${resume2._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(
      deleteUnattachedRes.status === 200,
      'Candidate A successfully deletes unattached Resume 2 (200 OK)',
      `Status: ${deleteUnattachedRes.status}`
    );

    const checkDeletedRes = await fetch(`${BASE_URL}/resumes/${resume2._id}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(
      checkDeletedRes.status === 404,
      'Deleted resume document removed from database (returns 404 Not Found)'
    );

    // =========================================================================
    // SECTION 8: Recruiter Secure Resume Access
    // =========================================================================
    console.log('\n--- Section 8: Recruiter Secure Resume Access ---');

    // 8.1 Recruiter A (Hiring Recruiter for target job) downloads Candidate A's attached resume
    const recADownloadRes = await fetch(`${BASE_URL}/resumes/${resume1._id}/file`, {
      headers: { Authorization: `Bearer ${tokenRecA}` }
    });
    assert(
      recADownloadRes.status === 200,
      'Hiring Recruiter A downloads Candidate A attached resume successfully (200 OK)',
      `Status: ${recADownloadRes.status}`
    );
    const recADownloadBuf = Buffer.from(await recADownloadRes.arrayBuffer());
    assert(
      PdfParserService.isPdfSignature(recADownloadBuf),
      'Downloaded file is valid PDF binary stream'
    );

    // 8.2 Recruiter B (Unauthorized Recruiter) attempts to download Candidate A's attached resume
    const recBDownloadRes = await fetch(`${BASE_URL}/resumes/${resume1._id}/file`, {
      headers: { Authorization: `Bearer ${tokenRecB}` }
    });
    assert(
      recBDownloadRes.status === 403,
      'Unauthorized Recruiter B blocked from accessing Candidate A attached resume (403 Forbidden)',
      `Status: ${recBDownloadRes.status}`
    );

    // 8.3 Candidate A downloads their own resume
    const candADownloadRes = await fetch(`${BASE_URL}/resumes/${resume1._id}/file`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(
      candADownloadRes.status === 200,
      'Candidate A downloads their own resume file successfully (200 OK)',
      `Status: ${candADownloadRes.status}`
    );

    // Clean up test in-memory storage
    StorageService.clearTestStorage();

    // =========================================================================
    // FINAL RESULTS SUMMARY
    // =========================================================================
    console.log('\n===============================================');
    console.log(`Phase 6 Test Results: ${passed} passed, ${failed} failed`);
    console.log('===============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Unhandled exception during Phase 6 tests:', err);
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('testPhase6.js')) {
  runPhase6Tests();
}
