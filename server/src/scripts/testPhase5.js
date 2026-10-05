/**
 * Phase 5: Application Management Test Suite
 * Verifies candidate job application submission, duplicate prevention,
 * job eligibility checks (draft/closed/expired), candidate my applications & details,
 * withdrawal constraints, recruiter applicant review, cross-recruiter isolation,
 * recruiter status management, and filtering/pagination.
 */
const BASE_AUTH_URL = 'http://localhost:5001/api/v1/auth';
const BASE_COMPANY_URL = 'http://localhost:5001/api/v1/companies';
const BASE_JOB_URL = 'http://localhost:5001/api/v1/jobs';
const BASE_APP_URL = 'http://localhost:5001/api/v1/applications';

const runPhase5Tests = async () => {
  console.log('🧪 Starting Phase 5 Application Management Test Suite...\n');

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
    // 0. Setup: Register 2 Recruiters & 2 Candidates
    // =========================================================================
    console.log('0. Test Setup (Principals, Companies, and Jobs):');

    // Recruiter A
    const recARes = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recruiter Alice',
        email: `alice.${ts}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recAData = await recARes.json();
    const tokenA = recAData.data.token;

    // Recruiter B
    const recBRes = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recruiter Bob',
        email: `bob.${ts}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recBData = await recBRes.json();
    const tokenB = recBData.data.token;

    // Candidate 1 (Charlie)
    const cand1Res = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Charlie Candidate',
        email: `charlie.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const cand1Data = await cand1Res.json();
    const tokenCand1 = cand1Data.data.token;

    // Candidate 2 (Diana)
    const cand2Res = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Diana Candidate',
        email: `diana.${ts}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const cand2Data = await cand2Res.json();
    const tokenCand2 = cand2Data.data.token;

    // Setup Companies
    await fetch(BASE_COMPANY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: `Apex Cloud Systems ${ts}`, industry: 'Cloud Computing', location: 'San Francisco, CA' })
    });

    await fetch(BASE_COMPANY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: `Quantum AI Labs ${ts}`, industry: 'Artificial Intelligence', location: 'Austin, TX' })
    });

    // Recruiter A creates:
    // 1. Published Job A1
    const jobA1Res = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: `Principal Cloud Architect ${ts}`,
        description: 'Design and manage global scalable infrastructure and Kubernetes clusters.',
        skills: ['kubernetes', 'aws', 'terraform', 'golang'],
        location: 'Remote',
        employmentType: 'full-time',
        workMode: 'remote',
        salaryMin: 160000,
        salaryMax: 200000,
        status: 'published'
      })
    });
    const jobA1Data = await jobA1Res.json();
    const jobA1Id = jobA1Data.data._id;

    // 2. Draft Job A2
    const jobA2Res = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: `Internal Staff SRE ${ts}`,
        description: 'Draft requisition for upcoming internal site reliability engineering.',
        skills: ['sre', 'prometheus', 'linux'],
        location: 'San Francisco, CA',
        employmentType: 'full-time',
        workMode: 'onsite',
        status: 'draft'
      })
    });
    const jobA2Data = await jobA2Res.json();
    const jobA2Id = jobA2Data.data._id;

    // 3. Closed Job A3 (Create then close)
    const jobA3Res = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: `Junior DevOps Engineer ${ts}`,
        description: 'Entry-level DevOps engineer position that is immediately filled and closed.',
        skills: ['docker', 'git', 'bash'],
        location: 'San Francisco, CA',
        status: 'published'
      })
    });
    const jobA3Data = await jobA3Res.json();
    const jobA3Id = jobA3Data.data._id;
    await fetch(`${BASE_JOB_URL}/recruiter/${jobA3Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'closed' })
    });

    // Recruiter B creates:
    // Published Job B1
    const jobB1Res = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: `Deep Learning Researcher ${ts}`,
        description: 'Research foundational model architectures, transformer attention, and distillation.',
        skills: ['pytorch', 'python', 'cuda', 'llm'],
        location: 'Austin, TX',
        employmentType: 'full-time',
        workMode: 'hybrid',
        salaryMin: 180000,
        salaryMax: 240000,
        status: 'published'
      })
    });
    const jobB1Data = await jobB1Res.json();
    const jobB1Id = jobB1Data.data._id;

    assert(jobA1Id && jobA2Id && jobA3Id && jobB1Id, 'Principals, companies, and jobs initialized');

    // =========================================================================
    // 1. Candidate Application Submission & Job Eligibility
    // =========================================================================
    console.log('\n1. Candidate Application Submission & Job Eligibility:');

    // 1a. Recruiter cannot apply as candidate
    const recApplyRes = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ jobId: jobA1Id, coverLetter: 'Recruiter attempting to apply' })
    });
    assert(recApplyRes.status === 403, 'Recruiter cannot submit job application (403 Forbidden)');

    // 1b. Candidate cannot apply to Draft job
    const applyDraftRes = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand1}` },
      body: JSON.stringify({ jobId: jobA2Id, coverLetter: 'Applying to draft job' })
    });
    assert(applyDraftRes.status === 400, 'Candidate cannot apply to draft job (400 Bad Request)');

    // 1c. Candidate cannot apply to Closed job
    const applyClosedRes = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand1}` },
      body: JSON.stringify({ jobId: jobA3Id, coverLetter: 'Applying to closed job' })
    });
    assert(applyClosedRes.status === 400, 'Candidate cannot apply to closed job (400 Bad Request)');

    // 1d. Candidate 1 applies successfully to Published Job A1
    const applyA1Res = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand1}` },
      body: JSON.stringify({
        jobId: jobA1Id,
        coverLetter: 'I have 6 years of hands-on experience designing multi-region Kubernetes architectures.'
      })
    });
    const applyA1Data = await applyA1Res.json();
    const app1Id = applyA1Data.data?._id;

    assert(applyA1Res.status === 201, 'Candidate 1 applied to published job (201 Created)');
    assert(applyA1Data.data.status === 'applied', 'Initial application status is "applied"');
    assert(applyA1Data.data.appliedAt != null, 'appliedAt timestamp generated automatically');
    assert(applyA1Data.data.coverLetter.includes('Kubernetes architectures'), 'Cover letter persisted');

    // 1e. Candidate 1 cannot apply twice to the same job (Duplicate check)
    const dupApplyRes = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand1}` },
      body: JSON.stringify({ jobId: jobA1Id, coverLetter: 'Second application attempt' })
    });
    assert(dupApplyRes.status === 409, 'Duplicate application rejected (409 Conflict)');

    // 1f. Candidate 2 applies to Job A1
    const applyCand2Res = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand2}` },
      body: JSON.stringify({
        jobId: jobA1Id,
        coverLetter: 'Passionate cloud engineer with Terraform expertise.'
      })
    });
    const applyCand2Data = await applyCand2Res.json();
    const app2Id = applyCand2Data.data?._id;
    assert(applyCand2Res.status === 201, 'Candidate 2 applied to Job A1 (201 Created)');

    // 1g. Candidate 2 also applies to Job B1
    const applyCand2BRes = await fetch(BASE_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand2}` },
      body: JSON.stringify({
        jobId: jobB1Id,
        coverLetter: 'Background in deep learning transformers and PyTorch.'
      })
    });
    const applyCand2BData = await applyCand2BRes.json();
    const appB1Id = applyCand2BData.data?._id;
    assert(applyCand2BRes.status === 201, 'Candidate 2 applied to Job B1 (201 Created)');

    // =========================================================================
    // 2. Candidate Application Views & Isolation
    // =========================================================================
    console.log('\n2. Candidate Application Views & Isolation:');

    // 2a. Candidate 1 retrieves own applications
    const myAppsRes = await fetch(`${BASE_APP_URL}/me`, {
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    const myAppsData = await myAppsRes.json();
    assert(myAppsRes.status === 200, 'Candidate 1 retrieved own applications (200 OK)');
    assert(myAppsData.data.length === 1, 'Candidate 1 sees exactly 1 application');
    assert(myAppsData.data[0].job?.title.includes('Cloud Architect'), 'Populated job details verified');

    // 2b. Candidate 1 retrieves single application detail
    const appDetailRes = await fetch(`${BASE_APP_URL}/${app1Id}`, {
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    const appDetailData = await appDetailRes.json();
    assert(appDetailRes.status === 200, 'Candidate 1 retrieved application details (200 OK)');
    assert(appDetailData.data._id === app1Id, 'Application ID matches');

    // 2c. Candidate 2 CANNOT access Candidate 1 application (Isolation)
    const crossCandRes = await fetch(`${BASE_APP_URL}/${app1Id}`, {
      headers: { Authorization: `Bearer ${tokenCand2}` }
    });
    assert(crossCandRes.status === 403, 'Candidate 2 cannot access Candidate 1 application (403 Forbidden)');

    // =========================================================================
    // 3. Candidate Application Withdrawal
    // =========================================================================
    console.log('\n3. Candidate Application Withdrawal:');

    // 3a. Candidate 1 cannot withdraw Candidate 2 application
    const unauthWithdrawRes = await fetch(`${BASE_APP_URL}/${appB1Id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    assert(unauthWithdrawRes.status === 403, 'Candidate 1 cannot withdraw Candidate 2 application (403 Forbidden)');

    // 3b. Candidate 2 withdraws own application for Job B1
    const withdrawRes = await fetch(`${BASE_APP_URL}/${appB1Id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCand2}` }
    });
    const withdrawData = await withdrawRes.json();
    assert(withdrawRes.status === 200, 'Candidate 2 withdrew application for Job B1 (200 OK)');
    assert(withdrawData.data.status === 'withdrawn', 'Application status updated to "withdrawn"');

    // 3c. Candidate 2 cannot withdraw already withdrawn application
    const reWithdrawRes = await fetch(`${BASE_APP_URL}/${appB1Id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCand2}` }
    });
    assert(reWithdrawRes.status === 400, 'Cannot withdraw already withdrawn application (400 Bad Request)');

    // 3d. Candidate cannot directly update status via recruiter status endpoint
    const candStatusRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenCand1}` },
      body: JSON.stringify({ status: 'selected' })
    });
    assert(candStatusRes.status === 403, 'Candidate cannot directly set status (403 Forbidden)');

    // =========================================================================
    // 4. Recruiter Applicant Review & Isolation
    // =========================================================================
    console.log('\n4. Recruiter Applicant Review & Isolation:');

    // 4a. Recruiter A views applications for Job A1
    const recAppsRes = await fetch(`${BASE_JOB_URL}/${jobA1Id}/applications`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recAppsData = await recAppsRes.json();
    assert(recAppsRes.status === 200, 'Recruiter A retrieved applications for Job A1 (200 OK)');
    assert(recAppsData.data.length === 2, 'Recruiter A sees 2 applicants for Job A1');
    assert(recAppsData.data[0].candidate?.user?.name != null, 'Candidate name populated');
    assert(recAppsData.data[0].candidate?.user?.password == null, 'Sensitive password field NOT exposed');

    // 4b. Recruiter B CANNOT view applications for Recruiter A Job A1
    const crossRecAppsRes = await fetch(`${BASE_JOB_URL}/${jobA1Id}/applications`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossRecAppsRes.status === 403, 'Recruiter B cannot view applications for Recruiter A job (403 Forbidden)');

    // 4c. Recruiter A views single application details for Candidate 1
    const recDetailRes = await fetch(`${BASE_APP_URL}/${app1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recDetailData = await recDetailRes.json();
    assert(recDetailRes.status === 200, 'Recruiter A viewed single application details (200 OK)');
    assert(recDetailData.data.coverLetter.includes('Kubernetes'), 'Cover letter visible to hiring recruiter');

    // 4d. Recruiter B CANNOT view application details for Recruiter A job
    const crossRecDetailRes = await fetch(`${BASE_APP_URL}/${app1Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossRecDetailRes.status === 403, 'Recruiter B cannot view application details for Job A1 (403 Forbidden)');

    // =========================================================================
    // 5. Recruiter Status Transitions & Constraints
    // =========================================================================
    console.log('\n5. Recruiter Status Transitions & Constraints:');

    // 5a. Recruiter B cannot change status of application on Job A1
    const unauthStatusRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: 'screening' })
    });
    assert(unauthStatusRes.status === 403, 'Recruiter B cannot change status on Recruiter A job (403 Forbidden)');

    // 5b. Recruiter A advances Candidate 1 status: applied -> screening
    const statusScreenRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'screening' })
    });
    const screenData = await statusScreenRes.json();
    assert(statusScreenRes.status === 200, 'Status updated to screening (200 OK)');
    assert(screenData.data.status === 'screening', 'Screening status verified');

    // 5c. Recruiter A advances Candidate 1: screening -> shortlisted
    const statusShortRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'shortlisted' })
    });
    assert(statusShortRes.status === 200, 'Status updated to shortlisted (200 OK)');

    // 5d. Recruiter A advances Candidate 1: shortlisted -> interview
    const statusInterviewRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'interview' })
    });
    assert(statusInterviewRes.status === 200, 'Status updated to interview (200 OK)');

    // 5e. Recruiter A advances Candidate 1: interview -> selected
    const statusSelectRes = await fetch(`${BASE_APP_URL}/${app1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'selected' })
    });
    const selectData = await statusSelectRes.json();
    assert(statusSelectRes.status === 200, 'Status updated to selected (200 OK)');
    assert(selectData.data.status === 'selected', 'Selected status verified');

    // 5f. Candidate 1 cannot withdraw once in terminal "selected" state
    const withdrawSelectedRes = await fetch(`${BASE_APP_URL}/${app1Id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    assert(withdrawSelectedRes.status === 400, 'Candidate cannot withdraw selected application (400 Bad Request)');

    // 5g. Recruiter B cannot update status of withdrawn application on Job B1
    const updateWithdrawnRes = await fetch(`${BASE_APP_URL}/${appB1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: 'screening' })
    });
    assert(updateWithdrawnRes.status === 400, 'Recruiter cannot update withdrawn application (400 Bad Request)');

    // =========================================================================
    // 6. Filtering & Pagination
    // =========================================================================
    console.log('\n6. Filtering & Pagination:');

    // 6a. Filter by status on candidate applications
    const candFilterSelRes = await fetch(`${BASE_APP_URL}/me?status=selected`, {
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    const candFilterSelData = await candFilterSelRes.json();
    assert(candFilterSelData.data.length === 1, 'Filter by status=selected returned 1 matching application');

    const candFilterAppRes = await fetch(`${BASE_APP_URL}/me?status=applied`, {
      headers: { Authorization: `Bearer ${tokenCand1}` }
    });
    const candFilterAppData = await candFilterAppRes.json();
    assert(candFilterAppData.data.length === 0, 'Filter by status=applied returned 0 matching applications');

    // 6b. Filter by status on recruiter job applications
    const recFilterAppRes = await fetch(`${BASE_JOB_URL}/${jobA1Id}/applications?status=applied`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recFilterAppData = await recFilterAppRes.json();
    assert(recFilterAppData.data.length === 1, 'Recruiter filter by status=applied returned 1 applicant (Candidate 2)');
    assert(recFilterAppData.data[0]._id === app2Id, 'Candidate 2 matched');

    // 6c. Recruiter pagination
    const recPageRes = await fetch(`${BASE_JOB_URL}/${jobA1Id}/applications?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recPageData = await recPageRes.json();
    assert(recPageData.data.length === 1, 'Pagination limit=1 enforced');
    assert(recPageData.meta.total === 2, 'Total count is 2');
    assert(recPageData.meta.totalPages === 2, 'Total pages calculated as 2');

    console.log('\n===============================================');
    console.log(`Phase 5 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected test error:', error);
    process.exit(1);
  }
};

runPhase5Tests();
