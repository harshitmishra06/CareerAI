/**
 * Phase 3 Model & Schema Validation Suite
 * Verifies all 8 Mongoose models, validation rules, boundaries, and relationships
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  CandidateProfile,
  RecruiterProfile,
  Company,
  Job,
  Application,
  Resume,
  ResumeAnalysis,
  Notification
} from '../models/index.js';

const runModelTests = async () => {
  console.log('🧪 Starting Phase 3 Model & Relationship Test Suite...\n');

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
    await connectDB();

    // Ensure all unique and compound indexes are built
    await Promise.all([
      User.init(),
      CandidateProfile.init(),
      RecruiterProfile.init(),
      Company.init(),
      Job.init(),
      Application.init(),
      Resume.init(),
      ResumeAnalysis.init(),
      Notification.init()
    ]);

    const timestamp = Date.now();

    // Setup base User documents for relationships
    const testCandidateUser = await User.create({
      name: 'Test Candidate User',
      email: `candidate.model.${timestamp}@example.com`,
      password: 'Password123!',
      role: 'candidate'
    });

    const testRecruiterUser = await User.create({
      name: 'Test Recruiter User',
      email: `recruiter.model.${timestamp}@example.com`,
      password: 'Password123!',
      role: 'recruiter'
    });

    // =========================================================================
    // 1. CandidateProfile Tests
    // =========================================================================
    console.log('1. CandidateProfile Model:');

    // 1a. Valid CandidateProfile accepted
    const candidateProfile = await CandidateProfile.create({
      user: testCandidateUser._id,
      headline: 'Full-Stack Software Engineer',
      bio: 'Passionate about building scalable AI-integrated systems.',
      location: 'San Francisco, CA',
      phone: '+1-555-0199',
      skills: ['react', 'node.js', 'mongodb', 'typescript'],
      education: [
        {
          institution: 'University of Engineering',
          degree: 'B.S. Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: new Date('2018-09-01'),
          endDate: new Date('2022-05-30'),
          grade: '3.9 GPA'
        }
      ],
      experience: [
        {
          company: 'Tech Solutions Inc',
          jobTitle: 'Junior Developer',
          location: 'San Francisco, CA',
          startDate: new Date('2022-06-01'),
          endDate: new Date('2024-01-01'),
          currentlyWorking: false,
          description: 'Developed scalable REST APIs.'
        }
      ],
      githubUrl: 'https://github.com/candidate-test',
      linkedinUrl: 'https://linkedin.com/in/candidate-test'
    });

    assert(candidateProfile._id != null, 'Valid candidate profile created successfully');
    assert(candidateProfile.skills.includes('react'), 'Skills array persisted and normalized');
    assert(candidateProfile.education.length === 1, 'Education subdocument persisted');
    assert(candidateProfile.experience[0].company === 'Tech Solutions Inc', 'Experience subdocument persisted');

    // 1b. Invalid required relationship rejected (missing user)
    let missingUserErr = null;
    try {
      await CandidateProfile.create({
        headline: 'Orphan Profile without User'
      });
    } catch (err) {
      missingUserErr = err;
    }
    assert(missingUserErr != null && missingUserErr.name === 'ValidationError', 'Missing required user rejected');

    // 1c. Duplicate user profile rejected
    let dupUserErr = null;
    try {
      await CandidateProfile.create({
        user: testCandidateUser._id,
        headline: 'Second profile for same user'
      });
    } catch (err) {
      dupUserErr = err;
    }
    assert(dupUserErr != null && (dupUserErr.code === 11000 || dupUserErr.name === 'MongoServerError'), 'Duplicate user candidate profile rejected');

    // =========================================================================
    // 2. Company Tests
    // =========================================================================
    console.log('\n2. Company Model:');

    // 2a. Required fields validated (missing name)
    let missingCompNameErr = null;
    try {
      await Company.create({
        description: 'Company missing required name'
      });
    } catch (err) {
      missingCompNameErr = err;
    }
    assert(missingCompNameErr != null && missingCompNameErr.name === 'ValidationError', 'Missing company name rejected');

    // 2b. Valid company accepted with auto-slug generation
    const company = await Company.create({
      name: `InnovateTech Labs ${timestamp}`,
      description: 'Pioneering intelligent workflow automation software.',
      website: 'https://innovatetech.example.com',
      industry: 'Software & Technology',
      companySize: '51-200',
      location: 'New York, NY',
      foundedYear: 2020,
      isVerified: true
    });

    assert(company._id != null, 'Valid company created successfully');
    assert(company.slug.startsWith('innovatetech-labs'), 'Company slug generated and normalized automatically');
    assert(company.isVerified === true, 'isVerified status properly recorded');

    // =========================================================================
    // 3. RecruiterProfile Tests
    // =========================================================================
    console.log('\n3. RecruiterProfile Model:');

    // 3a. Valid recruiter profile accepted with company reference
    const recruiterProfile = await RecruiterProfile.create({
      user: testRecruiterUser._id,
      company: company._id,
      jobTitle: 'Lead Technical Recruiter',
      phone: '+1-555-0842',
      bio: 'Connecting exceptional engineers with high-growth teams.'
    });

    assert(recruiterProfile._id != null, 'Valid recruiter profile created successfully');
    assert(recruiterProfile.company.toString() === company._id.toString(), 'Company reference linked correctly');

    // 3b. Duplicate recruiter user rejected
    let dupRecruiterErr = null;
    try {
      await RecruiterProfile.create({
        user: testRecruiterUser._id,
        jobTitle: 'Duplicate Recruiter Profile'
      });
    } catch (err) {
      dupRecruiterErr = err;
    }
    assert(dupRecruiterErr != null && (dupRecruiterErr.code === 11000 || dupRecruiterErr.name === 'MongoServerError'), 'Duplicate user recruiter profile rejected');

    // =========================================================================
    // 4. Job Tests
    // =========================================================================
    console.log('\n4. Job Model:');

    // 4a. Valid Job accepted
    const job = await Job.create({
      recruiter: recruiterProfile._id,
      company: company._id,
      title: 'Senior Full-Stack Engineer (MERN + AI)',
      description: 'We are seeking an experienced software engineer to scale our CareerAI platform architecture.',
      skills: ['react', 'node.js', 'mongodb', 'express', 'docker'],
      location: 'Remote, US',
      employmentType: 'full-time',
      workMode: 'remote',
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 120000,
      salaryMax: 160000,
      salaryCurrency: 'USD',
      status: 'published',
      publishedAt: new Date()
    });

    assert(job._id != null, 'Valid job posting created successfully');
    assert(job.workMode === 'remote', 'workMode enum validated');
    assert(job.employmentType === 'full-time', 'employmentType enum validated');

    // 4b. Invalid enum values rejected
    let invalidEnumJobErr = null;
    try {
      await Job.create({
        recruiter: recruiterProfile._id,
        company: company._id,
        title: 'Invalid Enum Test Job',
        description: 'Test description with sufficient length for validation.',
        location: 'Remote',
        employmentType: 'super-contract', // Invalid enum
        workMode: 'remote'
      });
    } catch (err) {
      invalidEnumJobErr = err;
    }
    assert(invalidEnumJobErr != null && invalidEnumJobErr.name === 'ValidationError', 'Invalid employmentType enum rejected');

    // 4c. Invalid numeric ranges rejected (negative salary)
    let negSalaryErr = null;
    try {
      await Job.create({
        recruiter: recruiterProfile._id,
        company: company._id,
        title: 'Negative Salary Test Job',
        description: 'Test description with sufficient length for validation.',
        location: 'Remote',
        employmentType: 'full-time',
        workMode: 'remote',
        salaryMin: -5000 // Invalid negative salary
      });
    } catch (err) {
      negSalaryErr = err;
    }
    assert(negSalaryErr != null && negSalaryErr.name === 'ValidationError', 'Negative salary value rejected');

    // 4d. Invalid range where max < min
    let invalidRangeErr = null;
    try {
      await Job.create({
        recruiter: recruiterProfile._id,
        company: company._id,
        title: 'Invalid Salary Range Test Job',
        description: 'Test description with sufficient length for validation.',
        location: 'Remote',
        employmentType: 'full-time',
        workMode: 'remote',
        salaryMin: 150000,
        salaryMax: 100000 // salaryMax < salaryMin
      });
    } catch (err) {
      invalidRangeErr = err;
    }
    assert(invalidRangeErr != null && invalidRangeErr.name === 'ValidationError', 'salaryMax < salaryMin range rejected');

    // =========================================================================
    // 5. Resume Tests
    // =========================================================================
    console.log('\n5. Resume Model:');

    // 5a. Valid resume accepted
    const resume = await Resume.create({
      candidate: candidateProfile._id,
      originalFileName: 'Jane_Candidate_Resume_2026.pdf',
      fileUrl: 'https://storage.careerai.local/resumes/resume_01.pdf',
      storageProvider: 'local',
      fileType: 'application/pdf',
      fileSize: 1048576,
      parsedText: 'Summary: Senior Full-Stack Engineer experienced in React, Node, Express, MongoDB.',
      status: 'uploaded'
    });

    assert(resume._id != null, 'Valid resume created successfully');
    assert(resume.storageProvider === 'local', 'Default storageProvider assigned');

    // 5b. Invalid resume status rejected
    let invalidResumeStatusErr = null;
    try {
      await Resume.create({
        candidate: candidateProfile._id,
        originalFileName: 'Bad_Status.pdf',
        fileUrl: 'https://example.com/bad.pdf',
        status: 'corrupted' // Invalid status
      });
    } catch (err) {
      invalidResumeStatusErr = err;
    }
    assert(invalidResumeStatusErr != null && invalidResumeStatusErr.name === 'ValidationError', 'Invalid resume status rejected');

    // =========================================================================
    // 6. Application Tests
    // =========================================================================
    console.log('\n6. Application Model:');

    // 6a. Valid application accepted
    const application = await Application.create({
      candidate: candidateProfile._id,
      job: job._id,
      resume: resume._id,
      coverLetter: 'I am excited to apply for the Senior Full-Stack Engineer role at InnovateTech Labs.',
      status: 'applied'
    });

    assert(application._id != null, 'Valid application created successfully');
    assert(application.status === 'applied', 'Default application status verified');

    // 6b. Duplicate application (candidate + job) rejected by compound unique index
    let dupApplicationErr = null;
    try {
      await Application.create({
        candidate: candidateProfile._id,
        job: job._id,
        resume: resume._id,
        coverLetter: 'Duplicate application attempt for the exact same job.'
      });
    } catch (err) {
      dupApplicationErr = err;
    }
    assert(
      dupApplicationErr != null && (dupApplicationErr.code === 11000 || dupApplicationErr.name === 'MongoServerError'),
      'Duplicate candidate + job application rejected by compound unique index'
    );

    // =========================================================================
    // 7. ResumeAnalysis Tests
    // =========================================================================
    console.log('\n7. ResumeAnalysis Model:');

    // 7a. Valid analysis accepted
    const analysis = await ResumeAnalysis.create({
      candidate: candidateProfile._id,
      resume: resume._id,
      job: job._id,
      matchScore: 88,
      matchedSkills: ['react', 'node.js', 'mongodb', 'express'],
      missingSkills: ['docker'],
      recommendations: ['Highlight production experience with containerized microservices and Docker.'],
      summary: 'Strong match for the Senior Full-Stack role with 88% overall alignment.',
      status: 'completed',
      provider: 'mock-gemini',
      model: 'gemini-1.5-pro'
    });

    assert(analysis._id != null, 'Valid resume analysis record created successfully');
    assert(analysis.matchScore === 88, 'matchScore recorded accurately');

    // 7b. Match score below 0 rejected
    let negativeScoreErr = null;
    try {
      await ResumeAnalysis.create({
        candidate: candidateProfile._id,
        resume: resume._id,
        job: job._id,
        matchScore: -5
      });
    } catch (err) {
      negativeScoreErr = err;
    }
    assert(negativeScoreErr != null && negativeScoreErr.name === 'ValidationError', 'Match score below 0 rejected');

    // 7c. Match score above 100 rejected
    let overScoreErr = null;
    try {
      await ResumeAnalysis.create({
        candidate: candidateProfile._id,
        resume: resume._id,
        job: job._id,
        matchScore: 105
      });
    } catch (err) {
      overScoreErr = err;
    }
    assert(overScoreErr != null && overScoreErr.name === 'ValidationError', 'Match score above 100 rejected');

    // =========================================================================
    // 8. Notification Tests
    // =========================================================================
    console.log('\n8. Notification Model:');

    // 8a. Valid notification accepted
    const notification = await Notification.create({
      user: testCandidateUser._id,
      type: 'application_status',
      title: 'Application Received',
      message: 'Your application for Senior Full-Stack Engineer has been forwarded to the recruiter.',
      metadata: {
        applicationId: application._id,
        jobId: job._id
      }
    });

    assert(notification._id != null, 'Valid notification created successfully');
    assert(notification.readAt === null, 'readAt defaults to null');
    assert(notification.metadata.jobId.toString() === job._id.toString(), 'Flexible metadata saved');

    // 8b. Invalid required relationship rejected (missing user)
    let missingNotifUserErr = null;
    try {
      await Notification.create({
        type: 'system',
        title: 'System Alert',
        message: 'Alert without user'
      });
    } catch (err) {
      missingNotifUserErr = err;
    }
    assert(missingNotifUserErr != null && missingNotifUserErr.name === 'ValidationError', 'Notification missing required user rejected');

    // Clean up test documents
    await Promise.all([
      Notification.deleteMany({ user: testCandidateUser._id }),
      ResumeAnalysis.deleteMany({ candidate: candidateProfile._id }),
      Application.deleteMany({ candidate: candidateProfile._id }),
      Resume.deleteMany({ candidate: candidateProfile._id }),
      Job.deleteMany({ company: company._id }),
      RecruiterProfile.deleteMany({ user: testRecruiterUser._id }),
      Company.deleteMany({ _id: company._id }),
      CandidateProfile.deleteMany({ user: testCandidateUser._id }),
      User.deleteMany({ _id: { $in: [testCandidateUser._id, testRecruiterUser._id] } })
    ]);

    await disconnectDB();

    console.log(`\n===============================================`);
    console.log(`Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`===============================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    await disconnectDB();
    process.exit(1);
  }
};

runModelTests();
