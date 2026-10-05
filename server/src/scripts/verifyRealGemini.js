/**
 * End-to-End Real Google Gemini Integration Verification
 *
 * This script tests the real Google Gemini API (gemini-2.0-flash) using the actual GeminiProvider
 * without MockAIProvider.
 *
 * Security: NEVER logs, prints, or exposes GEMINI_API_KEY.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Resume } from '../models/Resume.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { RecruiterProfile } from '../models/RecruiterProfile.js';
import { ResumeAnalysis } from '../models/ResumeAnalysis.js';
import { ResumeAnalysisService } from '../services/resumeAnalysis.service.js';
import { AIService } from '../services/ai/ai.service.js';
import { GeminiProvider } from '../services/ai/providers/gemini.provider.js';

let mongoServer;

async function runRealGeminiVerification() {
  console.log('🚀 Initializing Real Google Gemini E2E Verification...');

  // 1. Pre-flight Check: Ensure Gemini API key is configured
  if (!ENV.GEMINI_API_KEY || !ENV.GEMINI_API_KEY.trim()) {
    console.error('❌ FAIL: GEMINI_API_KEY is not configured in environment!');
    process.exit(1);
  }
  console.log(`✅ Pre-flight: GEMINI_API_KEY is loaded in server environment`);
  console.log(`✅ Model targeted: ${ENV.GEMINI_MODEL || 'gemini-3.5-flash-lite'}`);

  // 2. Database Setup: Connect to in-memory MongoDB for clean, isolated verification
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('✅ Isolated in-memory MongoDB initialized');

  try {
    // 3. Create Principals: Recruiter & Candidate
    const recruiterUser = await User.create({
      name: 'Elena Vance',
      email: 'recruiter.gemini@test.local',
      password: 'Password123!',
      role: 'recruiter'
    });
    const company = await Company.create({
      name: 'Apex AI Systems',
      slug: 'apex-ai-systems-' + Date.now(),
      industry: 'Technology',
      location: 'San Francisco, CA'
    });
    const recruiterProfile = await RecruiterProfile.create({
      user: recruiterUser._id,
      company: company._id,
      jobTitle: 'Head of Engineering Talent'
    });

    const candidateUser = await User.create({
      name: 'Devin Thorne',
      email: 'candidate.gemini@test.local',
      password: 'Password123!',
      role: 'candidate'
    });
    const candidateProfile = await CandidateProfile.create({
      user: candidateUser._id,
      skills: ['react', 'node.js', 'mongodb', 'express', 'javascript', 'git', 'rest api']
    });

    // 4. Create a Published Job with realistic requirements
    const targetJob = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Senior Full-Stack Engineer',
      description: `Apex AI Systems is seeking a Senior Full-Stack Engineer to architect scalable web platforms.
Responsibilities:
- Build modern, accessible frontends using React and modern CSS.
- Design resilient REST APIs and backend microservices using Node.js and Express.
- Manage database schemas and perform query optimization in MongoDB.
- Leverage Docker for containerization and deploy microservices on AWS cloud infrastructure.
- Write production code in TypeScript with strong unit and integration test coverage.`,
      employmentType: 'full-time',
      workMode: 'remote',
      location: 'Remote, US',
      skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS'],
      experienceMin: 4,
      experienceMax: 8,
      status: 'published',
      publishedAt: new Date()
    });
    console.log(`✅ Published Target Job created: "${targetJob.title}" at "${company.name}"`);

    // 5. Create a Candidate Resume with extracted text matching some skills and lacking others
    const candidateResume = await Resume.create({
      candidate: candidateProfile._id,
      originalFileName: 'devin_thorne_fullstack_resume.pdf',
      fileUrl: '/uploads/resumes/devin_thorne.pdf',
      fileSize: 42000,
      fileType: 'application/pdf',
      storageProvider: 'local',
      status: 'ready',
      isDefault: true,
      parsedText: `Devin Thorne
San Francisco, CA | devin.thorne@email.com | github.com/devinthorne

PROFESSIONAL SUMMARY:
Experienced Full-Stack Developer with 5 years building scalable web applications. Strong expertise in JavaScript, React, Node.js, Express, and MongoDB. Proven track record designing RESTful APIs, implementing robust authentication, and optimizing database pipelines.

TECHNICAL SKILLS:
Languages & Frameworks: JavaScript (ES6+), React.js, Redux, Node.js, Express.js, HTML5, CSS3
Databases: MongoDB, Mongoose, PostgreSQL
Tools & Practices: Git, GitHub, RESTful APIs, Agile/Scrum, Jest, Supertest

WORK EXPERIENCE:
Full-Stack Developer | CloudTech Solutions (2022 - Present)
- Architected candidate-facing React web portal serving 50,000+ monthly active users.
- Designed Node.js / Express microservices with MongoDB database indexing that reduced API latency by 35%.
- Implemented secure JWT and RBAC authentication mechanisms.

Frontend Developer | Horizon Labs (2020 - 2022)
- Built interactive dashboard UI components in React with responsive design.
- Integrated third-party REST APIs and managed client-side application state using Redux.`
    });
    console.log(`✅ Valid Candidate Resume created: "${candidateResume.originalFileName}" with parsed text`);

    // 6. Explicitly enforce GeminiProvider (Ensure MockAIProvider is NOT used)
    AIService.clearCustomProvider();
    const activeProvider = AIService.getProvider('gemini');
    if (!(activeProvider instanceof GeminiProvider)) {
      throw new Error(`Active provider is not GeminiProvider: ${activeProvider.name}`);
    }
    console.log(`✅ Active Provider confirmed: ${activeProvider.name} (GeminiProvider instance)`);

    // 7. Perform ONE Real End-to-End Analysis via resumeAnalysisService
    console.log('\n⏳ Calling real Google Gemini API (gemini-2.0-flash)...');
    const startTime = Date.now();

    const result = await ResumeAnalysisService.createAnalysis(candidateUser._id, {
      resumeId: candidateResume._id,
      jobId: targetJob._id,
      providerOverride: 'gemini'
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`⚡ Gemini API response received in ${elapsedMs}ms!\n`);

    // 8. Validate Result Structure & AIService Guardrails
    const analysis = result.analysis;
    if (!analysis) {
      throw new Error('Analysis result was not returned by service');
    }

    // A. Provider & Model
    console.log('--- Verification Criteria 1: Provider & Model ---');
    if (analysis.provider !== 'gemini') {
      throw new Error(`Expected provider 'gemini', got '${analysis.provider}'`);
    }
    console.log(`  ✅ Provider: ${analysis.provider}`);
    console.log(`  ✅ Model: ${analysis.model}`);

    // B. Match Score
    console.log('\n--- Verification Criteria 2: Match Score ---');
    if (typeof analysis.matchScore !== 'number' || analysis.matchScore < 0 || analysis.matchScore > 100) {
      throw new Error(`Invalid matchScore: ${analysis.matchScore}`);
    }
    console.log(`  ✅ Match Score: ${analysis.matchScore}/100`);

    // C. Matched Skills
    console.log('\n--- Verification Criteria 3: Matched Skills ---');
    if (!Array.isArray(analysis.matchedSkills) || analysis.matchedSkills.length === 0) {
      throw new Error('Expected non-empty matchedSkills array');
    }
    console.log(`  ✅ Matched Skills (${analysis.matchedSkills.length}): ${analysis.matchedSkills.join(', ')}`);

    // D. Missing Skills
    console.log('\n--- Verification Criteria 4: Missing Skills ---');
    if (!Array.isArray(analysis.missingSkills)) {
      throw new Error('Expected missingSkills array');
    }
    console.log(`  ✅ Missing Skills (${analysis.missingSkills.length}): ${analysis.missingSkills.join(', ')}`);

    // E. Recommendations
    console.log('\n--- Verification Criteria 5: Actionable Recommendations ---');
    if (!Array.isArray(analysis.recommendations) || analysis.recommendations.length === 0) {
      throw new Error('Expected non-empty recommendations array');
    }
    analysis.recommendations.forEach((rec, idx) => {
      console.log(`  ✅ [${idx + 1}] ${rec}`);
    });

    // F. Executive Summary
    console.log('\n--- Verification Criteria 6: Executive Summary ---');
    if (!analysis.summary || typeof analysis.summary !== 'string' || analysis.summary.trim().length === 0) {
      throw new Error('Expected non-empty summary string');
    }
    console.log(`  ✅ Summary (${analysis.summary.length} chars): "${analysis.summary.slice(0, 160)}..."`);

    // G. MongoDB Persistence
    console.log('\n--- Verification Criteria 7: MongoDB Persistence ---');
    const persisted = await ResumeAnalysis.findById(analysis._id);
    if (!persisted) {
      throw new Error('Analysis record not found in MongoDB');
    }
    if (persisted.status !== 'completed') {
      throw new Error(`Expected status 'completed', got '${persisted.status}'`);
    }
    console.log(`  ✅ Document found in MongoDB with ID: ${persisted._id}`);
    console.log(`  ✅ Persisted Status: ${persisted.status}`);

    // H. API Retrieval via Service
    console.log('\n--- Verification Criteria 8: API Retrieval ---');
    const retrieved = await ResumeAnalysisService.getAnalysisById(candidateUser._id, analysis._id);
    if (!retrieved || retrieved._id.toString() !== analysis._id.toString()) {
      throw new Error('Failed to retrieve analysis through service API');
    }
    console.log(`  ✅ Successfully retrieved via getAnalysisById()`);
    console.log(`  ✅ Populated Job: "${retrieved.job?.title}"`);
    console.log(`  ✅ Populated Resume: "${retrieved.resume?.originalFileName}"`);

    // I. API Key Security & Privacy Check
    console.log('\n--- Verification Criteria 9: Security & Privacy Check ---');
    const serializedAnalysis = JSON.stringify(retrieved);
    if (serializedAnalysis.includes(ENV.GEMINI_API_KEY)) {
      throw new Error('CRITICAL SECURITY BREACH: GEMINI_API_KEY was exposed in serialized analysis!');
    }
    if (retrieved.resume && retrieved.resume.parsedText) {
      throw new Error('CRITICAL PRIVACY VIOLATION: parsedText was exposed in retrieved resume!');
    }
    console.log('  ✅ GEMINI_API_KEY is NOT present in any response data');
    console.log('  ✅ parsedText is securely excluded from API response');

    console.log('\n===============================================');
    console.log('🎉 REAL GOOGLE GEMINI INTEGRATION VERIFIED: PASS');
    console.log('===============================================\n');
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runRealGeminiVerification().catch((err) => {
  console.error('\n❌ REAL GEMINI TEST FAILED:', err.message);
  if (mongoServer) {
    mongoServer.stop();
  }
  process.exit(1);
});
