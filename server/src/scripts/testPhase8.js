/**
 * Phase 8 Intelligent Job Matching Automated Test Suite
 *
 * Verifies:
 * 1. Authentication & RBAC (candidate-only, 401 for guest, 403 for recruiter)
 * 2. Strict Job Eligibility (only status === 'published' jobs are evaluated; draft & closed jobs strictly excluded)
 * 3. Deterministic Skill Overlap & Normalization ("React.js" -> "react", "NodeJS" -> "node", "RESTful APIs" -> "rest api")
 * 4. Experience & Work Mode Scoring (matchScore bounded 0-100)
 * 5. Matched & Missing Skills extraction accuracy
 * 6. IDOR Protection & Multi-Candidate Data Isolation
 * 7. Query Filtering (minScore, workMode, search) & Pagination
 * 8. Single Job Match Detail endpoint (/api/v1/job-matches/:jobId)
 * 9. Privacy (parsedText is never exposed)
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { RecruiterProfile } from '../models/RecruiterProfile.js';
import { Resume } from '../models/Resume.js';
import { normalizeSkill, isSkillMatch, calculateSkillOverlap } from '../services/jobMatching/skillNormalizer.js';
import { JobMatchingService } from '../services/jobMatching/jobMatching.service.js';

let mongoServer;
let serverInstance;
let BASE_URL;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedAssertions++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedAssertions++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runPhase8Tests() {
  console.log('\n🧪 Starting Phase 8 Intelligent Job Matching Test Suite...\n');

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Start ephemeral server on free port
  serverInstance = app.listen(0);
  const port = serverInstance.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api/v1`;

  try {
    const ts = Date.now();

    // -------------------------------------------------------------
    // SECTION 1: Unit Tests for Skill Normalization & Overlap Engine
    // -------------------------------------------------------------
    console.log('--- Section 1: Skill Normalization & Overlap Unit Tests ---');

    assert(normalizeSkill('React.js') === 'react', 'Normalizes React.js to react');
    assert(normalizeSkill('REACTJS') === 'react', 'Normalizes REACTJS to react');
    assert(normalizeSkill('Node.js') === 'node', 'Normalizes Node.js to node');
    assert(normalizeSkill('NodeJS') === 'node', 'Normalizes NodeJS to node');
    assert(normalizeSkill('RESTful APIs') === 'rest api', 'Normalizes RESTful APIs to rest api');
    assert(normalizeSkill('Amazon Web Services') === 'aws', 'Normalizes Amazon Web Services to aws');
    assert(normalizeSkill('C++') === 'c++', 'Preserves C++ symbol');
    assert(normalizeSkill('C#') === 'c#', 'Preserves C# symbol');

    assert(isSkillMatch('React.js', 'react'), 'isSkillMatch detects React.js matches react');
    assert(isSkillMatch('NodeJS', 'Node.js'), 'isSkillMatch detects NodeJS matches Node.js');
    assert(!isSkillMatch('Python', 'Java'), 'isSkillMatch rejects non-matching skills');

    const overlapResult = calculateSkillOverlap(
      ['react.js', 'node.js', 'mongodb', 'express'],
      ['React', 'NodeJS', 'MongoDB', 'Docker', 'AWS']
    );
    assert(overlapResult.matchedSkills.length === 3, 'Correctly extracted 3 matched skills');
    assert(overlapResult.missingSkills.length === 2, 'Correctly extracted 2 missing skills');
    assert(overlapResult.missingSkills.includes('Docker'), 'Identified Docker as missing');
    assert(overlapResult.missingSkills.includes('AWS'), 'Identified AWS as missing');

    // -------------------------------------------------------------
    // SECTION 2: Principals Registration & Workspace Setup
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Principals Registration & Workspace Setup ---');

    // 1. Register Recruiter
    const recRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Vance',
        email: `recruiter.p8.${ts}@test.local`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recData = await recRes.json();
    const tokenRec = recData.data.token;
    const recruiterUser = await User.findOne({ email: `recruiter.p8.${ts}@test.local` });

    const company = await Company.create({
      name: 'CyberScale Corp',
      slug: `cyberscale-corp-${ts}`,
      industry: 'Software',
      location: 'New York, NY'
    });
    const recruiterProfile = await RecruiterProfile.create({
      user: recruiterUser._id,
      company: company._id,
      jobTitle: 'VP of Talent'
    });

    // 2. Register Candidate A (Senior MERN Developer with 4 years experience)
    const candARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: `alex.rivera.${ts}@test.local`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candAData = await candARes.json();
    const tokenCandA = candAData.data.token;
    const candidateAUser = await User.findOne({ email: `alex.rivera.${ts}@test.local` });

    const candidateAProfile = await CandidateProfile.create({
      user: candidateAUser._id,
      headline: 'Senior Full-Stack Engineer',
      location: 'New York, NY',
      skills: ['react.js', 'node.js', 'mongodb', 'express.js', 'javascript', 'restful apis'],
      experience: [
        {
          company: 'FinTech Labs',
          jobTitle: 'Full-Stack Developer',
          location: 'New York, NY',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2026-01-01'), // 4 years
          currentlyWorking: false,
          description: 'Built scalable microservices.'
        }
      ]
    });

    // 3. Register Candidate B (Junior Python Specialist with 1 year experience)
    const candBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bianca Cole',
        email: `bianca.cole.${ts}@test.local`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candBData = await candBRes.json();
    const tokenCandB = candBData.data.token;
    const candidateBUser = await User.findOne({ email: `bianca.cole.${ts}@test.local` });

    const candidateBProfile = await CandidateProfile.create({
      user: candidateBUser._id,
      headline: 'Data Scientist',
      location: 'Austin, TX',
      skills: ['python', 'pandas', 'numpy', 'sql'],
      experience: [
        {
          company: 'DataCorp',
          jobTitle: 'Junior Analyst',
          startDate: new Date('2025-01-01'),
          currentlyWorking: true // ~1 year
        }
      ]
    });

    assert(Boolean(candidateAProfile && candidateBProfile), 'Candidates and recruiter initialized successfully');

    // -------------------------------------------------------------
    // SECTION 3: Create Job Catalog (Published, Draft, and Closed)
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Job Catalog Setup ---');

    // Job 1: MERN Stack (High match for Alex, Zero match for Bianca)
    const job1Mern = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Senior MERN Developer',
      description: 'Looking for a Senior MERN Developer skilled in React, Node.js, MongoDB, Express, and Docker.',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Docker'],
      location: 'New York, NY',
      workMode: 'hybrid',
      employmentType: 'full-time',
      experienceMin: 3,
      experienceMax: 6,
      salaryMin: 130000,
      salaryMax: 170000,
      status: 'published',
      publishedAt: new Date(Date.now() - 3600000)
    });

    // Job 2: Remote Python / Machine Learning (High match for Bianca, Low for Alex)
    const job2Python = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Python Data Engineer',
      description: 'Seeking a Python engineer proficient in Python, SQL, Pandas, NumPy, and AWS cloud pipelines.',
      skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'AWS'],
      location: 'Remote, US',
      workMode: 'remote',
      employmentType: 'full-time',
      experienceMin: 1,
      experienceMax: 3,
      salaryMin: 110000,
      salaryMax: 140000,
      status: 'published',
      publishedAt: new Date(Date.now() - 1800000)
    });

    // Job 3: Draft Job (Must NEVER appear in recommendations)
    const job3Draft = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Draft React Architect',
      description: 'Draft job description for testing strict eligibility.',
      skills: ['React', 'JavaScript'],
      location: 'New York, NY',
      workMode: 'remote',
      status: 'draft'
    });

    // Job 4: Closed Job (Must NEVER appear in recommendations)
    const job4Closed = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Closed Node.js Lead',
      description: 'Closed position that has already been filled.',
      skills: ['Node.js', 'MongoDB'],
      location: 'New York, NY',
      workMode: 'onsite',
      status: 'closed'
    });

    assert(Boolean(job1Mern && job2Python && job3Draft && job4Closed), 'Published, draft, and closed jobs seeded');

    // -------------------------------------------------------------
    // SECTION 4: Authentication & RBAC Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Authentication & RBAC Enforcement ---');

    // Guest cannot access /job-matches
    const unauthRes = await fetch(`${BASE_URL}/job-matches`);
    assert(unauthRes.status === 401, 'Unauthenticated user rejected with 401 Unauthorized');

    // Recruiter cannot access /job-matches
    const recAccessRes = await fetch(`${BASE_URL}/job-matches`, {
      headers: { Authorization: `Bearer ${tokenRec}` }
    });
    assert(recAccessRes.status === 403, 'Recruiter role blocked from candidate job matches (403 Forbidden)');

    // -------------------------------------------------------------
    // SECTION 5: Job Eligibility & Draft/Closed Exclusion
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Job Eligibility & Draft/Closed Exclusion ---');

    const matchesResA = await fetch(`${BASE_URL}/job-matches`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const matchesDataA = await matchesResA.json();

    assert(matchesResA.status === 200, 'Candidate A successfully retrieved job matches (200 OK)');
    const matchesA = matchesDataA.data.matches;

    // Check that draft and closed jobs are not returned
    const draftInResults = matchesA.some((m) => m.job._id === job3Draft._id.toString());
    const closedInResults = matchesA.some((m) => m.job._id === job4Closed._id.toString());
    assert(!draftInResults, 'Strict Security: Draft job is NOT returned in recommendations');
    assert(!closedInResults, 'Strict Security: Closed job is NOT returned in recommendations');

    const allPublished = matchesA.every((m) => m.job.status === 'published');
    assert(allPublished, 'All returned recommendations have status === "published"');

    // -------------------------------------------------------------
    // SECTION 6: Deterministic Scoring & Normalization Verification
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Deterministic Scoring & Normalization ---');

    const mernMatchA = matchesA.find((m) => m.job._id === job1Mern._id.toString());
    assert(Boolean(mernMatchA), 'Candidate A matched with MERN Developer job');

    assert(mernMatchA.matchedSkills.length === 4, 'Candidate A correctly matched 4 normalized skills');
    assert(mernMatchA.matchedSkills.some((s) => s.toLowerCase().includes('react')), 'Matched React (alias normalized)');
    assert(mernMatchA.matchedSkills.some((s) => s.toLowerCase().includes('node')), 'Matched Node.js (punctuation normalized)');
    assert(mernMatchA.matchedSkills.some((s) => s.toLowerCase().includes('mongo')), 'Matched MongoDB');
    assert(mernMatchA.matchedSkills.some((s) => s.toLowerCase().includes('express')), 'Matched Express');

    assert(mernMatchA.missingSkills.length === 1, 'Correctly identified 1 missing skill');
    assert(mernMatchA.missingSkills.some((s) => s.toLowerCase().includes('docker')), 'Identified Docker as missing skill');

    assert(mernMatchA.matchScore >= 0 && mernMatchA.matchScore <= 100, `Match score bounded between 0 and 100 (${mernMatchA.matchScore}%)`);
    assert(mernMatchA.matchScore >= 80, `Candidate A achieved high match score (>=80%) for MERN role (actual=${mernMatchA.matchScore}%)`);
    assert(typeof mernMatchA.explanation === 'string' && mernMatchA.explanation.length > 10, 'Concise match explanation provided');

    // -------------------------------------------------------------
    // SECTION 7: Multi-Candidate Specialization & Isolation
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Multi-Candidate Specialization & Isolation ---');

    const matchesResB = await fetch(`${BASE_URL}/job-matches`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    const matchesDataB = await matchesResB.json();
    const matchesB = matchesDataB.data.matches;

    // For Candidate B, Python job is top recommendation
    assert(matchesB[0].job._id === job2Python._id.toString(), 'Top recommended job for Candidate B is Python Data Engineer');
    assert(matchesB[0].matchScore >= 75, `Candidate B scored high on Python role (${matchesB[0].matchScore}%)`);
    assert(matchesB[0].matchedSkills.some((s) => s.toLowerCase().includes('python')), 'Candidate B matched Python');
    assert(matchesB[0].matchedSkills.some((s) => s.toLowerCase().includes('pandas')), 'Candidate B matched Pandas');
    assert(matchesB[0].matchedSkills.some((s) => s.toLowerCase().includes('numpy')), 'Candidate B matched NumPy');
    assert(matchesB[0].matchedSkills.some((s) => s.toLowerCase().includes('sql')), 'Candidate B matched SQL');
    assert(matchesB[0].missingSkills.some((s) => s.toLowerCase().includes('aws')), 'Identified AWS as missing for Candidate B');

    // Candidate A on Python job scored lower than Candidate B
    const pythonMatchA = matchesA.find((m) => m.job._id === job2Python._id.toString());
    assert(pythonMatchA.matchScore < matchesB[0].matchScore, 'Candidate A scored lower than Candidate B on Python role');

    // -------------------------------------------------------------
    // SECTION 8: Query Filtering & Pagination
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Query Filtering & Pagination ---');

    // Filter by minScore=80
    const minScoreRes = await fetch(`${BASE_URL}/job-matches?minScore=80`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const minScoreData = await minScoreRes.json();
    const allMeetMinScore = minScoreData.data.matches.every((m) => m.matchScore >= 80);
    assert(allMeetMinScore, 'All returned matches satisfy minScore >= 80 filter');

    // Filter by workMode=remote
    const remoteRes = await fetch(`${BASE_URL}/job-matches?workMode=remote`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const remoteData = await remoteRes.json();
    const allRemote = remoteData.data.matches.every((m) => m.job.workMode === 'remote');
    assert(allRemote, 'All filtered matches have workMode === remote');

    // Pagination: limit=1
    const pagedRes = await fetch(`${BASE_URL}/job-matches?limit=1&page=1`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const pagedData = await pagedRes.json();
    assert(pagedData.data.matches.length === 1, 'Limit=1 enforced in result set');
    assert(pagedData.data.pagination.limit === 1, 'Pagination meta reflects limit: 1');
    assert(pagedData.data.pagination.page === 1, 'Pagination meta reflects page: 1');
    assert(pagedData.data.pagination.total >= 2, 'Total matches count is accurate');

    // -------------------------------------------------------------
    // SECTION 9: Single Job Match Detail Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Section 9: Single Job Match Detail Endpoint ---');

    const singleMatchRes = await fetch(`${BASE_URL}/job-matches/${job1Mern._id}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const singleMatchData = await singleMatchRes.json();
    assert(singleMatchRes.status === 200, 'Single job match details retrieved (200 OK)');
    assert(singleMatchData.data.matchScore === mernMatchA.matchScore, 'Single match score matches list feed score');
    assert(singleMatchData.data.job.title === 'Senior MERN Developer', 'Populated job title verified');
    assert(Boolean(singleMatchData.data.job.company.name), 'Populated company details verified');

    // Closed job returns 404
    const closedMatchRes = await fetch(`${BASE_URL}/job-matches/${job4Closed._id}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(closedMatchRes.status === 404, 'Match detail for closed job returns 404 Not Found');

    // Non-existent job returns 404
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await fetch(`${BASE_URL}/job-matches/${fakeId}`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(notFoundRes.status === 404, 'Non-existent jobId returns 404 Not Found');

    // -------------------------------------------------------------
    // SECTION 10: Privacy & Resume Data Protection
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Privacy & Resume Data Protection ---');

    await Resume.create({
      candidate: candidateAProfile._id,
      originalFileName: 'alex_confidential_resume.pdf',
      fileUrl: '/uploads/resumes/alex.pdf',
      fileSize: 30000,
      fileType: 'application/pdf',
      storageProvider: 'local',
      status: 'ready',
      parsedText: 'CONFIDENTIAL SALARY HISTORY: 200K. SECRET PATENTS: PENDING.'
    });

    const postResumeMatchesRes = await fetch(`${BASE_URL}/job-matches`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const serialized = await postResumeMatchesRes.text();
    assert(!serialized.includes('CONFIDENTIAL SALARY HISTORY'), 'CRITICAL PRIVACY: Resume parsedText is NOT exposed in match API response');

    console.log('\n===============================================');
    console.log(`Phase 8 Test Results: ${passedAssertions} passed, ${failedAssertions} failed`);
    console.log('===============================================\n');

    if (failedAssertions > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Unhandled exception during Phase 8 tests:', err);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('testPhase8.js')) {
  runPhase8Tests();
}
