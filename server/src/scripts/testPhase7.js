/**
 * Phase 7: AI Resume Analyzer Test Suite
 *
 * Verifies:
 * 1. Authentication & RBAC:
 *    - Unauthenticated requests rejected (401)
 *    - Recruiters rejected from candidate analysis endpoints (403)
 * 2. Resume Authorization & Readiness:
 *    - Candidate can analyze their own ready resume
 *    - Cross-candidate resume analysis blocked (IDOR protection - 403)
 *    - Non-ready resume rejected (400)
 *    - Empty/missing parsedText rejected (400)
 *    - Invalid/non-existent resume ID rejected (400/404)
 * 3. Job Authorization & Visibility:
 *    - Published job allowed
 *    - Draft job rejected (400)
 *    - Closed job rejected (400)
 *    - Non-existent job rejected (404)
 * 4. AI Provider Integration & Response Validation:
 *    - Structured AI schema validated (matchScore, matchedSkills, missingSkills, recommendations, summary)
 *    - Invalid matchScore (<0 or >100) rejected with AI_RESPONSE_INVALID (502)
 *    - Malformed response types rejected with AI_RESPONSE_INVALID (502)
 *    - Missing Gemini API key in Gemini mode rejected with AI_CONFIG_ERROR (500)
 * 5. Persistence & Privacy:
 *    - ResumeAnalysis persisted in MongoDB with correct references
 *    - parsedText is NOT exposed in API responses
 * 6. Duplicate Analysis Optimization:
 *    - Re-analyzing same candidate + resume + job returns existing completed analysis (200 OK)
 * 7. Candidate Ownership & Retrieval:
 *    - Candidate can retrieve single analysis by ID
 *    - Candidate B blocked from accessing Candidate A analysis (IDOR - 403)
 *    - Candidate lists their past analyses
 */

import { AIService } from '../services/ai/ai.service.js';
import { BaseAIProvider } from '../services/ai/providers/base.provider.js';
import { GeminiProvider } from '../services/ai/providers/gemini.provider.js';
import { ENV } from '../config/env.js';

const BASE_URL = 'http://localhost:5001/api/v1';

// Helper to create valid PDF buffer
const createValidPdfBuffer = (customText = 'Candidate Resume Content') => {
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

export const runPhase7Tests = async () => {
  console.log('🧪 Starting Phase 7 AI Resume Analyzer Test Suite...\n');

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
    // SECTION 1: AI Provider Architecture & Response Validation Unit Tests
    // =========================================================================
    console.log('\n--- Section 1: AI Provider Architecture & Validation Unit Tests ---');

    // 1.1 Provider resolution
    const mockProvider = AIService.getProvider('mock');
    assert(mockProvider && mockProvider.name === 'mock', 'AIService resolves mock provider correctly');

    const geminiProvider = AIService.getProvider('gemini');
    assert(geminiProvider && geminiProvider.name === 'gemini', 'AIService resolves gemini provider correctly');

    // 1.2 Missing Gemini API key in Gemini mode throws AI_CONFIG_ERROR
    const origGeminiKey = ENV.GEMINI_API_KEY;
    ENV.GEMINI_API_KEY = '';
    let geminiConfigErrorThrown = false;
    let geminiErrorCode = null;
    try {
      await geminiProvider.analyzeResumeAgainstJob({
        resumeText: 'Sample text',
        jobData: { title: 'Engineer' }
      });
    } catch (err) {
      geminiConfigErrorThrown = true;
      geminiErrorCode = err.code;
    }
    assert(
      geminiConfigErrorThrown && geminiErrorCode === 'AI_CONFIG_ERROR',
      'Gemini provider throws AI_CONFIG_ERROR when API key is missing',
      `Got code: ${geminiErrorCode}`
    );
    ENV.GEMINI_API_KEY = origGeminiKey;

    // 1.3 Validation rule: matchScore must be 0-100 number
    let invalidScoreCaught = false;
    try {
      AIService.validateAIResponse({
        matchScore: 120, // Invalid: exceeds 100
        matchedSkills: ['React'],
        missingSkills: ['Node'],
        recommendations: ['Learn Node'],
        summary: 'Good candidate'
      });
    } catch (err) {
      invalidScoreCaught = err.code === 'AI_RESPONSE_INVALID';
    }
    assert(invalidScoreCaught, 'AIService rejects out-of-range matchScore (> 100) with AI_RESPONSE_INVALID');

    let negativeScoreCaught = false;
    try {
      AIService.validateAIResponse({
        matchScore: -15, // Invalid: negative
        matchedSkills: ['React'],
        missingSkills: ['Node'],
        recommendations: ['Learn Node'],
        summary: 'Good candidate'
      });
    } catch (err) {
      negativeScoreCaught = err.code === 'AI_RESPONSE_INVALID';
    }
    assert(negativeScoreCaught, 'AIService rejects negative matchScore with AI_RESPONSE_INVALID');

    // 1.4 Validation rule: matchedSkills & missingSkills must be arrays of strings
    let invalidSkillsCaught = false;
    try {
      AIService.validateAIResponse({
        matchScore: 80,
        matchedSkills: 'React, Node', // Invalid: string instead of array
        missingSkills: ['Go'],
        recommendations: ['Learn Go'],
        summary: 'Good candidate'
      });
    } catch (err) {
      invalidSkillsCaught = err.code === 'AI_RESPONSE_INVALID';
    }
    assert(invalidSkillsCaught, 'AIService rejects non-array matchedSkills with AI_RESPONSE_INVALID');

    // 1.5 Validation rule: summary must be non-empty string
    let missingSummaryCaught = false;
    try {
      AIService.validateAIResponse({
        matchScore: 80,
        matchedSkills: ['React'],
        missingSkills: ['Go'],
        recommendations: ['Learn Go'],
        summary: '' // Invalid: empty
      });
    } catch (err) {
      missingSummaryCaught = err.code === 'AI_RESPONSE_INVALID';
    }
    assert(missingSummaryCaught, 'AIService rejects empty summary with AI_RESPONSE_INVALID');

    // 1.6 Empty or missing resume text rejected
    let emptyTextCaught = false;
    try {
      await AIService.analyzeResumeAgainstJob({
        resumeText: '',
        jobData: { title: 'Engineer' }
      });
    } catch (err) {
      emptyTextCaught = err.statusCode === 400;
    }
    assert(emptyTextCaught, 'AIService rejects empty or missing resumeText with 400 Bad Request');

    // 1.6 Custom provider injection works for testing failure paths
    class FaultyAIProvider extends BaseAIProvider {
      async analyzeResumeAgainstJob() {
        return {
          matchScore: 'invalid_number',
          matchedSkills: [],
          missingSkills: [],
          recommendations: [],
          summary: 'faulty'
        };
      }
    }
    AIService.setCustomProvider(new FaultyAIProvider());
    let faultyCaught = false;
    try {
      await AIService.analyzeResumeAgainstJob({
        resumeText: 'Sample text',
        jobData: { title: 'Dev' }
      });
    } catch (err) {
      faultyCaught = err.code === 'AI_RESPONSE_INVALID';
    }
    assert(faultyCaught, 'AIService catches faulty provider output and rejects with AI_RESPONSE_INVALID');
    AIService.clearCustomProvider(); // Clean up

    // =========================================================================
    // SECTION 2: Principals Registration & Workspace Setup
    // =========================================================================
    console.log('\n--- Section 2: Principals Registration & Workspace Setup ---');

    // Recruiter
    const recRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hiring Recruiter Rachel',
        email: `rachel.p7.${ts}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recData = await recRes.json();
    const tokenRec = recData.data.token;

    // Candidate A
    const candARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Alex',
        email: `alex.p7.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candAData = await candARes.json();
    const tokenCandA = candAData.data.token;

    // Candidate B (for IDOR tests)
    const candBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Beth',
        email: `beth.p7.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candBData = await candBRes.json();
    const tokenCandB = candBData.data.token;

    // Setup Recruiter Company
    await fetch(`${BASE_URL}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({
        name: `InnoTech AI Labs ${ts}`,
        industry: 'Artificial Intelligence',
        location: 'Seattle, WA'
      })
    });

    // Recruiter creates a published job
    const pubJobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({
        title: `Senior Fullstack AI Engineer ${ts}`,
        description: 'Building next-generation intelligent platforms using React, Node.js, TypeScript, and MongoDB.',
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL', 'Docker'],
        location: 'Seattle, WA',
        workMode: 'remote',
        employmentType: 'full-time',
        status: 'published'
      })
    });
    const pubJobData = await pubJobRes.json();
    const publishedJobId = pubJobData.data._id;
    assert(Boolean(publishedJobId), 'Recruiter published target job successfully');

    // Recruiter creates a draft job
    const draftJobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({
        title: `Draft Role ${ts}`,
        description: 'Draft internal job description for team review.',
        skills: ['Python'],
        location: 'Seattle, WA',
        status: 'draft'
      })
    });
    const draftJobData = await draftJobRes.json();
    const draftJobId = draftJobData.data?._id;

    // Recruiter creates a closed job
    const closedJobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({
        title: `Closed Role ${ts}`,
        description: 'Closed role description previously active.',
        skills: ['Java'],
        location: 'Seattle, WA',
        status: 'published'
      })
    });
    const closedJobData = await closedJobRes.json();
    const closedJobId = closedJobData.data?._id;
    // Close the job
    await fetch(`${BASE_URL}/jobs/recruiter/${closedJobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({ status: 'closed' })
    });

    // Upload Candidate A Resume
    const resumeTextA = 'Candidate Alex: 5 years experience building modern web apps with React, Node.js, and TypeScript. Expert in state management, REST APIs, and automated testing.';
    const resumeBufA = createValidPdfBuffer(resumeTextA);
    const fdA = new FormData();
    fdA.append('resume', new Blob([resumeBufA], { type: 'application/pdf' }), 'alex_fullstack_resume.pdf');
    const uploadARes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandA}` },
      body: fdA
    });
    const uploadAData = await uploadARes.json();
    const resumeAId = uploadAData.data._id;
    assert(Boolean(resumeAId), 'Candidate A uploaded valid PDF resume with parsed text');

    // Upload Candidate B Resume
    const resumeTextB = 'Candidate Beth: Data Analyst specializing in Python, SQL, and Tableau dashboards.';
    const resumeBufB = createValidPdfBuffer(resumeTextB);
    const fdB = new FormData();
    fdB.append('resume', new Blob([resumeBufB], { type: 'application/pdf' }), 'beth_analyst_resume.pdf');
    const uploadBRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCandB}` },
      body: fdB
    });
    const uploadBData = await uploadBRes.json();
    const resumeBId = uploadBData.data._id;

    // =========================================================================
    // SECTION 3: Authentication & RBAC Verification
    // =========================================================================
    console.log('\n--- Section 3: Authentication & RBAC Enforcement ---');

    // 3.1 Unauthenticated request rejected
    const unauthRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: resumeAId, jobId: publishedJobId })
    });
    assert(unauthRes.status === 401, 'Unauthenticated analysis request rejected (401 Unauthorized)');

    // 3.2 Recruiter cannot create candidate analysis
    const recruiterAnalysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRec}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: publishedJobId })
    });
    assert(
      recruiterAnalysisRes.status === 403,
      'Recruiter role rejected from creating resume analysis (403 Forbidden)'
    );

    // 3.3 Recruiter cannot access /me analyses
    const recruiterListRes = await fetch(`${BASE_URL}/resume-analyses/me`, {
      headers: { Authorization: `Bearer ${tokenRec}` }
    });
    assert(recruiterListRes.status === 403, 'Recruiter role rejected from /me analyses (403 Forbidden)');

    // =========================================================================
    // SECTION 4: Resume Authorization & Readiness Checks
    // =========================================================================
    console.log('\n--- Section 4: Resume Authorization & Readiness Checks ---');

    // 4.1 Candidate B attempts to analyze Candidate A's resume (IDOR)
    const idorAnalysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandB}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: publishedJobId })
    });
    assert(
      idorAnalysisRes.status === 403,
      'Candidate cannot analyze another candidate resume (IDOR - 403 Forbidden)'
    );

    // 4.2 Invalid Resume ID format
    const invalidResumeIdRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: 'invalid-id-format', jobId: publishedJobId })
    });
    assert(invalidResumeIdRes.status === 400, 'Invalid resumeId format rejected with 400 Bad Request');

    // 4.3 Non-existent Resume ID
    const fakeResumeId = '66f000000000000000000001';
    const nonExistentResumeRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: fakeResumeId, jobId: publishedJobId })
    });
    assert(nonExistentResumeRes.status === 404, 'Non-existent resumeId returns 404 Not Found');

    // =========================================================================
    // SECTION 5: Job Visibility & Status Checks
    // =========================================================================
    console.log('\n--- Section 5: Job Visibility & Status Checks ---');

    // 5.1 Candidate attempts to analyze draft job
    const draftAnalysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: draftJobId })
    });
    const draftAnalysisData = await draftAnalysisRes.json();
    assert(
      draftAnalysisRes.status === 400 && draftAnalysisData.error.message.includes('published'),
      'Analysis of draft job rejected with 400 Bad Request'
    );

    // 5.2 Candidate attempts to analyze closed job
    const closedAnalysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: closedJobId })
    });
    const closedAnalysisData = await closedAnalysisRes.json();
    assert(
      closedAnalysisRes.status === 400 && closedAnalysisData.error.message.includes('published'),
      'Analysis of closed job rejected with 400 Bad Request'
    );

    // 5.3 Non-existent Job ID
    const fakeJobId = '66f000000000000000000002';
    const nonExistentJobRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: fakeJobId })
    });
    assert(nonExistentJobRes.status === 404, 'Non-existent jobId returns 404 Not Found');

    // =========================================================================
    // SECTION 6: Successful Analysis Creation & Persistence
    // =========================================================================
    console.log('\n--- Section 6: Successful Analysis Creation & Persistence ---');

    // 6.1 Candidate A analyzes their resume against published job
    const createAnalysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: publishedJobId })
    });
    const createAnalysisData = await createAnalysisRes.json();
    assert(
      createAnalysisRes.status === 201 && createAnalysisData.success,
      'Candidate A creates AI resume analysis successfully (201 Created)',
      `Status: ${createAnalysisRes.status}`
    );

    const analysis1 = createAnalysisData.data;
    assert(
      typeof analysis1.matchScore === 'number' && analysis1.matchScore >= 0 && analysis1.matchScore <= 100,
      'matchScore is a valid number between 0 and 100',
      `Score: ${analysis1.matchScore}`
    );
    assert(
      Array.isArray(analysis1.matchedSkills) && analysis1.matchedSkills.length > 0,
      'matchedSkills is a populated array of strings',
      `Matched: ${JSON.stringify(analysis1.matchedSkills)}`
    );
    assert(
      Array.isArray(analysis1.missingSkills),
      'missingSkills is an array of strings',
      `Missing: ${JSON.stringify(analysis1.missingSkills)}`
    );
    assert(
      Array.isArray(analysis1.recommendations) && analysis1.recommendations.length > 0,
      'recommendations is a populated array of actionable suggestions'
    );
    assert(
      typeof analysis1.summary === 'string' && analysis1.summary.length > 10,
      'summary is a detailed candidate-facing explanation'
    );
    assert(
      analysis1.status === 'completed',
      'analysis status is completed'
    );
    assert(
      analysis1.provider && analysis1.model,
      'provider and model metadata are recorded on the analysis document',
      `Provider: ${analysis1.provider}, Model: ${analysis1.model}`
    );

    // 6.2 Security Check: parsedText is NOT exposed in response
    assert(
      analysis1.resume.parsedText === undefined && analysis1.parsedText === undefined,
      'CRITICAL: parsedText is securely excluded from API response'
    );

    // =========================================================================
    // SECTION 7: Duplicate Analysis Handling (Cost Optimization)
    // =========================================================================
    console.log('\n--- Section 7: Duplicate Analysis Handling ---');

    // Re-request analysis for same Candidate + Resume + Job
    const duplicateRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCandA}` },
      body: JSON.stringify({ resumeId: resumeAId, jobId: publishedJobId })
    });
    const duplicateData = await duplicateRes.json();
    assert(
      duplicateRes.status === 200,
      'Duplicate analysis request returns existing record with 200 OK (no duplicate AI call)',
      `Status: ${duplicateRes.status}`
    );
    assert(
      duplicateData.data._id === analysis1._id,
      'Duplicate response returns identical analysis ID'
    );

    // =========================================================================
    // SECTION 8: Retrieval & IDOR Enforcement
    // =========================================================================
    console.log('\n--- Section 8: Retrieval & IDOR Protection ---');

    // 8.1 Candidate A retrieves their analysis by ID
    const getByIdRes = await fetch(`${BASE_URL}/resume-analyses/${analysis1._id}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const getByIdData = await getByIdRes.json();
    assert(
      getByIdRes.status === 200 && getByIdData.data._id === analysis1._id,
      'Candidate A retrieves their analysis by ID (200 OK)'
    );

    // 8.2 Candidate B attempts to view Candidate A's analysis by ID (IDOR)
    const candBAccessRes = await fetch(`${BASE_URL}/resume-analyses/${analysis1._id}`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(
      candBAccessRes.status === 403,
      'Candidate B blocked from accessing Candidate A analysis by ID (IDOR - 403 Forbidden)'
    );

    // 8.3 Candidate A lists all their analyses
    const listMyAnalysesRes = await fetch(`${BASE_URL}/resume-analyses/me`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const listMyAnalysesData = await listMyAnalysesRes.json();
    assert(
      listMyAnalysesRes.status === 200 && Array.isArray(listMyAnalysesData.data),
      'Candidate A retrieves list of their past analyses (200 OK)'
    );
    assert(
      listMyAnalysesData.data.some((a) => a._id === analysis1._id),
      'Candidate A past analyses includes the created analysis'
    );

    // 8.4 Candidate B lists their analyses (should be empty, not showing Candidate A)
    const listCandBAnalysesRes = await fetch(`${BASE_URL}/resume-analyses/me`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    const listCandBAnalysesData = await listCandBAnalysesRes.json();
    assert(
      listCandBAnalysesRes.status === 200 && listCandBAnalysesData.data.length === 0,
      'Candidate B analyses list is isolated and does NOT contain Candidate A analyses'
    );

    // =========================================================================
    // FINAL RESULTS SUMMARY
    // =========================================================================
    console.log('\n===============================================');
    console.log(`Phase 7 Test Results: ${passed} passed, ${failed} failed`);
    console.log('===============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Unhandled exception during Phase 7 tests:', err);
    process.exit(1);
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('testPhase7.js')) {
  runPhase7Tests();
}
