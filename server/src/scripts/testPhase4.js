/**
 * Phase 4: Company & Job Management Test Suite
 * Verifies Recruiter Company CRUD, Recruiter Job CRUD, RBAC restrictions,
 * public job browsing, search, filter, pagination, and multi-tenant isolation.
 */
const BASE_AUTH_URL = 'http://localhost:5001/api/v1/auth';
const BASE_COMPANY_URL = 'http://localhost:5001/api/v1/companies';
const BASE_JOB_URL = 'http://localhost:5001/api/v1/jobs';

const runPhase4Tests = async () => {
  console.log('🧪 Starting Phase 4 Company & Job Management Test Suite...\n');

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
    const timestamp = Date.now();

    // 1. Create Recruiter A, Recruiter B, and Candidate
    const recARes = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recruiter Alice',
        email: `alice.${timestamp}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recAData = await recARes.json();
    const cookieA = recARes.headers.get('set-cookie')?.split(';')[0];
    const tokenA = recAData.data.token;

    const recBRes = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Recruiter Bob',
        email: `bob.${timestamp}@recruiter.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recBData = await recBRes.json();
    const cookieB = recBRes.headers.get('set-cookie')?.split(';')[0];
    const tokenB = recBData.data.token;

    const candRes = await fetch(`${BASE_AUTH_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Candidate Charlie',
        email: `charlie.${timestamp}@candidate.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candData = await candRes.json();
    const cookieCand = candRes.headers.get('set-cookie')?.split(';')[0];
    const tokenCand = candData.data.token;

    // =========================================================================
    // 1. Company Tests
    // =========================================================================
    console.log('1. Recruiter Company Management:');

    // 1a. Candidate attempting to create company (MUST FAIL 403)
    const candCompRes = await fetch(BASE_COMPANY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieCand },
      body: JSON.stringify({
        name: 'Unauthorized Candidate Co',
        industry: 'Software'
      })
    });
    assert(candCompRes.status === 403, 'Candidate cannot create company (403 Forbidden)');

    // 1b. Recruiter A creates company
    const createCompRes = await fetch(BASE_COMPANY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        name: `Acme Innovations ${timestamp}`,
        description: 'Next-generation AI and cloud engineering firm.',
        website: 'https://acme.example.com',
        industry: 'Information Technology',
        companySize: '51-200',
        location: 'San Francisco, CA',
        foundedYear: 2019
      })
    });
    const createCompData = await createCompRes.json();
    assert(createCompRes.status === 201, 'Recruiter A created company (201 Created)', `(got ${createCompRes.status})`);
    assert(createCompData.data.slug.startsWith('acme-innovations'), 'Company slug generated');
    assert(createCompData.data.isVerified === false, 'isVerified defaults to false');
    const companyAId = createCompData.data._id;

    // 1c. Recruiter A retrieves own company (/me)
    const getCompRes = await fetch(`${BASE_COMPANY_URL}/me`, {
      headers: { Cookie: cookieA }
    });
    const getCompData = await getCompRes.json();
    assert(getCompRes.status === 200, 'Recruiter A retrieved own company via /companies/me');
    assert(getCompData.data._id === companyAId, 'Retrieved company matches created ID');

    // 1d. Recruiter A updates own company (/me)
    const updateCompRes = await fetch(`${BASE_COMPANY_URL}/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        description: 'Updated description: Global leader in enterprise AI.',
        companySize: '201-500'
      })
    });
    const updateCompData = await updateCompRes.json();
    assert(updateCompRes.status === 200, 'Recruiter A updated own company');
    assert(updateCompData.data.companySize === '201-500', 'Updated companySize persisted');

    // 1e. Recruiter B attempts to get company before creating one (404)
    const recBNoCompRes = await fetch(`${BASE_COMPANY_URL}/me`, {
      headers: { Cookie: cookieB }
    });
    assert(recBNoCompRes.status === 404, 'Recruiter B has no company yet (404 Not Found)');

    // 1f. Recruiter B creates their own company
    const recBCompRes = await fetch(BASE_COMPANY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({
        name: `Beta Dynamics ${timestamp}`,
        industry: 'FinTech',
        companySize: '11-50',
        location: 'New York, NY'
      })
    });
    const recBCompData = await recBCompRes.json();
    assert(recBCompRes.status === 201, 'Recruiter B created own company');
    const companyBId = recBCompData.data._id;

    // =========================================================================
    // 2. Job Creation & Recruiter Authorization
    // =========================================================================
    console.log('\n2. Job Creation & Recruiter Ownership:');

    // 2a. Candidate attempting to create job (MUST FAIL 403)
    const candJobRes = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieCand },
      body: JSON.stringify({
        title: 'Unauthorized Candidate Job',
        description: 'Should not be allowed to post jobs as candidate.'
      })
    });
    assert(candJobRes.status === 403, 'Candidate cannot create job (403 Forbidden)');

    // 2b. Recruiter A creates a draft job
    const createJobDraftRes = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: `Draft AI Research Engineer ${timestamp}`,
        description: 'Work on cutting-edge deep learning models and scalable LLM inference pipelines.',
        skills: ['python', 'pytorch', 'transformers', 'docker'],
        location: 'San Francisco, CA',
        employmentType: 'full-time',
        workMode: 'hybrid',
        experienceMin: 3,
        experienceMax: 6,
        salaryMin: 140000,
        salaryMax: 180000,
        status: 'draft'
      })
    });
    const draftJobData = await createJobDraftRes.json();
    assert(createJobDraftRes.status === 201, 'Recruiter A created draft job (201 Created)', `(got ${createJobDraftRes.status})`);
    assert(draftJobData.data.status === 'draft', 'Job status is draft');
    assert(draftJobData.data.company._id === companyAId, 'Job automatically associated with Recruiter A company');
    const draftJobId = draftJobData.data._id;

    // 2c. Recruiter A creates a published job
    const createJobPubRes = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: `Full-Stack MERN Platform Engineer ${timestamp}`,
        description: 'Build production React frontends and Node.js REST services with modern architecture.',
        skills: ['react', 'node.js', 'mongodb', 'express', 'typescript'],
        location: 'Remote',
        employmentType: 'full-time',
        workMode: 'remote',
        experienceMin: 2,
        experienceMax: 5,
        salaryMin: 110000,
        salaryMax: 140000,
        status: 'published'
      })
    });
    const pubJobData = await createJobPubRes.json();
    assert(createJobPubRes.status === 201, 'Recruiter A created published job');
    assert(pubJobData.data.status === 'published', 'Job status is published');
    assert(pubJobData.data.publishedAt != null, 'publishedAt timestamp automatically set');
    const pubJobAId = pubJobData.data._id;

    // 2d. Recruiter B creates a published job
    const createJobBRes = await fetch(`${BASE_JOB_URL}/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({
        title: `Backend Go & Cloud Engineer ${timestamp}`,
        description: 'Scale high-throughput microservices using Go, Kubernetes, and PostgreSQL systems.',
        skills: ['go', 'kubernetes', 'postgresql', 'gcp'],
        location: 'New York, NY',
        employmentType: 'contract',
        workMode: 'onsite',
        experienceMin: 4,
        experienceMax: 8,
        salaryMin: 130000,
        salaryMax: 170000,
        status: 'published'
      })
    });
    const pubJobBData = await createJobBRes.json();
    assert(createJobBRes.status === 201, 'Recruiter B created published job');
    const pubJobBId = pubJobBData.data._id;

    // =========================================================================
    // 3. Multi-Tenant Authorization Protections
    // =========================================================================
    console.log('\n3. Multi-Tenant Cross-Recruiter Isolation:');

    // 3a. Recruiter B attempts to view Recruiter A's draft job (MUST FAIL 403)
    const recBCantViewDraft = await fetch(`${BASE_JOB_URL}/recruiter/${draftJobId}`, {
      headers: { Cookie: cookieB }
    });
    assert(recBCantViewDraft.status === 403, 'Recruiter B cannot access Recruiter A job details (403 Forbidden)');

    // 3b. Recruiter B attempts to modify Recruiter A's job (MUST FAIL 403)
    const recBCantEditA = await fetch(`${BASE_JOB_URL}/recruiter/${pubJobAId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ title: 'Hacked Title by Recruiter B' })
    });
    assert(recBCantEditA.status === 403, 'Recruiter B cannot modify Recruiter A job (403 Forbidden)');

    // 3c. Recruiter B attempts to change status of Recruiter A's job (MUST FAIL 403)
    const recBCantStatusA = await fetch(`${BASE_JOB_URL}/recruiter/${pubJobAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ status: 'closed' })
    });
    assert(recBCantStatusA.status === 403, 'Recruiter B cannot change status of Recruiter A job (403 Forbidden)');

    // =========================================================================
    // 4. Recruiter Job Lifecycle Operations
    // =========================================================================
    console.log('\n4. Recruiter Job Lifecycle (Update, Publish, Close):');

    // 4a. Recruiter A updates own draft job
    const updateJobRes = await fetch(`${BASE_JOB_URL}/recruiter/${draftJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({
        title: `Updated AI Research Engineer ${timestamp}`,
        salaryMin: 150000
      })
    });
    const updateJobData = await updateJobRes.json();
    assert(updateJobRes.status === 200, 'Recruiter A updated own job');
    assert(updateJobData.data.salaryMin === 150000, 'Updated salary persisted');

    // 4b. Recruiter A publishes draft job via status endpoint
    const publishStatusRes = await fetch(`${BASE_JOB_URL}/recruiter/${draftJobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ status: 'published' })
    });
    const publishStatusData = await publishStatusRes.json();
    assert(publishStatusRes.status === 200, 'Recruiter A published draft job via status endpoint');
    assert(publishStatusData.data.status === 'published', 'Job status is now published');
    assert(publishStatusData.data.publishedAt != null, 'publishedAt timestamp generated');

    // 4c. Recruiter A closes published job
    const closeStatusRes = await fetch(`${BASE_JOB_URL}/recruiter/${draftJobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ status: 'closed' })
    });
    const closeStatusData = await closeStatusRes.json();
    assert(closeStatusRes.status === 200, 'Recruiter A closed job');
    assert(closeStatusData.data.status === 'closed', 'Job status is now closed');

    // 4d. Recruiter A lists own jobs with pagination
    const recAJobsRes = await fetch(`${BASE_JOB_URL}/recruiter/me?limit=5`, {
      headers: { Cookie: cookieA }
    });
    const recAJobsData = await recAJobsRes.json();
    assert(recAJobsRes.status === 200, 'Recruiter A retrieved own jobs list');
    assert(Array.isArray(recAJobsData.data) && recAJobsData.data.length >= 2, 'Recruiter A jobs list contains created jobs');
    assert(recAJobsData.meta.total >= 2, 'Pagination meta total count accurate');

    // =========================================================================
    // 5. Public & Candidate Job Browsing, Search & Filtering
    // =========================================================================
    console.log('\n5. Candidate Public Job Browsing, Search & Filters:');

    // 5a. Public job feed returns ONLY published jobs
    const publicJobsRes = await fetch(BASE_JOB_URL);
    const publicJobsData = await publicJobsRes.json();
    assert(publicJobsRes.status === 200, 'Public job feed retrieved');
    const allPublished = publicJobsData.data.every((j) => j.status === 'published');
    assert(allPublished, 'STRICT SECURITY: Public feed contains ONLY published jobs (no drafts or closed)');

    // 5b. Closed job cannot be retrieved via public detail endpoint (MUST FAIL 404)
    const closedDetailRes = await fetch(`${BASE_JOB_URL}/${draftJobId}`);
    assert(closedDetailRes.status === 404, 'Closed job returns 404 Not Found on public endpoint');

    // 5c. Published job CAN be retrieved via public detail endpoint (200 OK)
    const pubDetailRes = await fetch(`${BASE_JOB_URL}/${pubJobAId}`);
    const pubDetailData = await pubDetailRes.json();
    assert(pubDetailRes.status === 200, 'Published job detail retrieved via public endpoint');
    assert(pubDetailData.data.company.name.startsWith('Acme Innovations'), 'Company information populated');

    // 5d. Search by keyword
    const searchRes = await fetch(`${BASE_JOB_URL}?search=MERN`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Search query executed successfully');
    const searchMatches = searchData.data.some((j) => j.title.includes('MERN'));
    assert(searchMatches, 'Keyword search accurately retrieved MERN job');

    // 5e. Filter by workMode=remote
    const filterModeRes = await fetch(`${BASE_JOB_URL}?workMode=remote`);
    const filterModeData = await filterModeRes.json();
    assert(filterModeRes.status === 200, 'Filter by workMode=remote executed');
    const allRemote = filterModeData.data.every((j) => j.workMode === 'remote');
    assert(allRemote, 'All filtered jobs match workMode=remote');

    // 5f. Filter by location
    const filterLocRes = await fetch(`${BASE_JOB_URL}?location=New%20York`);
    const filterLocData = await filterLocRes.json();
    assert(filterLocRes.status === 200, 'Filter by location executed');
    const locMatch = filterLocData.data.some((j) => j.location.includes('New York'));
    assert(locMatch, 'Location filter successfully matched job location');

    // 5g. Filter by skill
    const filterSkillRes = await fetch(`${BASE_JOB_URL}?skill=kubernetes`);
    const filterSkillData = await filterSkillRes.json();
    assert(filterSkillRes.status === 200, 'Filter by skill=kubernetes executed');
    const skillMatch = filterSkillData.data.some((j) => j.skills.includes('kubernetes'));
    assert(skillMatch, 'Skill filter accurately filtered by skill');

    // 5h. Pagination limit validation
    const pageRes = await fetch(`${BASE_JOB_URL}?limit=1&page=1`);
    const pageData = await pageRes.json();
    assert(pageRes.status === 200, 'Pagination query executed');
    assert(pageData.data.length === 1, 'Pagination limit=1 enforced');
    assert(pageData.meta.limit === 1, 'Meta limit verified');

    console.log(`\n===============================================`);
    console.log(`Phase 4 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`===============================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Phase 4 test error:', err);
    process.exit(1);
  }
};

runPhase4Tests();
