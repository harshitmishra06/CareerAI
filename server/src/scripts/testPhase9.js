/**
 * Phase 9 Dashboards, Analytics & Notifications Automated Test Suite
 *
 * Verifies:
 * 1. Notification Model & Enum validation
 * 2. Notification Service & API (list, unread-count, read single, read all)
 * 3. IDOR Protection (cannot mark other users' notifications as read)
 * 4. Workflow Notification Triggers (application submitted, status changed, AI analysis completed)
 * 5. Candidate Dashboard Authentication & Strict Data Isolation
 * 6. Candidate Dashboard Real Metrics & Populated Entities
 * 7. Employer Dashboard Authentication & Multi-Tenant Isolation
 * 8. Employer Dashboard Real Metrics (jobs, company, applications by status)
 * 9. Analytics Endpoints for Candidate & Employer
 * 10. Empty state resilience & pagination
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import {
  User,
  Company,
  Job,
  CandidateProfile,
  RecruiterProfile,
  Resume,
  Application,
  ResumeAnalysis,
  Notification
} from '../models/index.js';
import { NotificationService, NotificationTypes } from '../services/notification.service.js';

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

export async function runPhase9Tests() {
  console.log('\n🧪 Starting Phase 9 Dashboards, Analytics & Notifications Test Suite...\n');

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Start ephemeral Express server on dynamic port
  serverInstance = app.listen(0);
  const port = serverInstance.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api/v1`;

  try {
    const ts = Date.now();

    // -------------------------------------------------------------
    // SECTION 1: Notification Model & Enum Validation
    // -------------------------------------------------------------
    console.log('--- Section 1: Notification Model & Enum Validation ---');

    assert(Boolean(NotificationTypes.APPLICATION_STATUS_CHANGED), 'NotificationTypes constant defined');
    assert(Boolean(NotificationTypes.APPLICATION_RECEIVED), 'NotificationTypes APPLICATION_RECEIVED defined');

    // Test creating notification with valid uppercase type
    const testCandidateUser = await User.create({
      name: 'Notif Test User',
      email: `notiftest_${ts}@careerai.test`,
      password: 'Password123!',
      role: 'candidate'
    });

    const notifDoc = await Notification.create({
      user: testCandidateUser._id,
      type: 'APPLICATION_STATUS_CHANGED',
      title: 'Status Updated',
      message: 'Your application is now under screening.',
      metadata: { jobId: new mongoose.Types.ObjectId() }
    });

    assert(notifDoc._id != null, 'Notification created successfully with uppercase enum');
    assert(notifDoc.readAt === null, 'readAt initially defaults to null');
    assert(notifDoc.title === 'Status Updated', 'Notification title persisted correctly');

    // -------------------------------------------------------------
    // SECTION 2: Principals Registration & Workspace Setup
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Principals Registration & Setup ---');

    // Candidate A
    const regCandARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Candidate',
        email: `cand_a_${ts}@test.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candAData = await regCandARes.json();
    const tokenCandA = candAData.data.token;
    const userCandAId = candAData.data.user.id || candAData.data.user._id;

    // Candidate B
    const regCandBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Candidate',
        email: `cand_b_${ts}@test.com`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candBData = await regCandBRes.json();
    const tokenCandB = candBData.data.token;
    const userCandBId = candBData.data.user.id || candBData.data.user._id;

    // Recruiter A
    const regRecARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rachel Recruiter',
        email: `rec_a_${ts}@test.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recAData = await regRecARes.json();
    const tokenRecA = recAData.data.token;
    const userRecAId = recAData.data.user.id || recAData.data.user._id;

    // Recruiter B
    const regRecBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Roger Recruiter',
        email: `rec_b_${ts}@test.com`,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recBData = await regRecBRes.json();
    const tokenRecB = recBData.data.token;

    assert(Boolean(tokenCandA && tokenCandB && tokenRecA && tokenRecB), 'All principals registered with auth tokens');

    // -------------------------------------------------------------
    // SECTION 3: Notification API Endpoints & CRUD Operations
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Notification API Endpoints & CRUD ---');

    // 3a. Unauthenticated access rejected
    const unauthNotifRes = await fetch(`${BASE_URL}/notifications`);
    assert(unauthNotifRes.status === 401, 'Unauthenticated notification access rejected with 401 Unauthorized');

    // 3b. Seed notifications for Candidate A
    const notif1 = await NotificationService.createNotification({
      user: userCandAId,
      type: 'SYSTEM',
      title: 'Welcome to CareerAI',
      message: 'Complete your profile to get matched with top opportunities.'
    });

    const notif2 = await NotificationService.createNotification({
      user: userCandAId,
      type: 'JOB_MATCH',
      title: 'New High Job Match Found',
      message: 'You have a 90% compatibility match with Senior Frontend Engineer.'
    });

    // 3c. Candidate A retrieves notifications
    const getNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const getNotifsData = await getNotifsRes.json();
    assert(getNotifsRes.status === 200, 'Candidate A successfully retrieved notification feed (200 OK)');
    assert(getNotifsData.data.length >= 2, 'Candidate A retrieved seeded notifications');
    assert(getNotifsData.meta.unreadCount >= 2, 'Meta unreadCount accurately reflects unread items');

    // 3d. Unread count endpoint
    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const unreadCountData = await unreadCountRes.json();
    assert(unreadCountRes.status === 200, 'Unread count endpoint returns 200 OK');
    assert(unreadCountData.data.unreadCount >= 2, 'Unread count data matches actual unread count');

    // 3e. IDOR Protection: Candidate B cannot mark Candidate A's notification as read
    const idorMarkReadRes = await fetch(`${BASE_URL}/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    assert(idorMarkReadRes.status === 403, 'IDOR Attempt: Candidate B blocked from reading Candidate A notification (403 Forbidden)');

    // 3f. Candidate A marks single notification as read
    const markReadRes = await fetch(`${BASE_URL}/notifications/${notif1._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const markReadData = await markReadRes.json();
    assert(markReadRes.status === 200, 'Candidate A marks own notification as read (200 OK)');
    assert(markReadData.data.isRead === true, 'Notification response contains isRead = true');
    assert(markReadData.data.readAt !== null, 'readAt timestamp set');

    // 3g. Unread count decreased
    const unreadAfterSingle = await NotificationService.getUnreadCount(userCandAId);
    assert(unreadAfterSingle.unreadCount === 1, 'Unread count decremented to 1 after marking single as read');

    // 3h. Candidate A marks all notifications as read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200, 'Mark all as read returns 200 OK');
    assert(markAllData.data.modifiedCount >= 1, 'Mark all reports at least 1 modified notification');

    const unreadAfterAll = await NotificationService.getUnreadCount(userCandAId);
    assert(unreadAfterAll.unreadCount === 0, 'Unread count is now 0 after markAllAsRead');

    // 3i. Notification pagination & filtering
    const pageRes = await fetch(`${BASE_URL}/notifications?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const pageData = await pageRes.json();
    assert(pageData.data.length === 1, 'Pagination limit=1 enforced');
    assert(pageData.meta.limit === 1, 'Meta limit matches requested limit');

    // -------------------------------------------------------------
    // SECTION 4: Workflow Notification Triggers
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Workflow Notification Triggers ---');

    // Recruiter A creates company
    const compRes = await fetch(`${BASE_URL}/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecA}`
      },
      body: JSON.stringify({
        name: 'Initech Tech Solutions',
        industry: 'Software Engineering',
        companySize: '51-200',
        location: 'Austin, TX'
      })
    });
    const compData = await compRes.json();
    assert(compRes.status === 201, 'Recruiter A created company (201 Created)');

    // Recruiter A creates and publishes job
    const jobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecA}`
      },
      body: JSON.stringify({
        title: 'Full Stack Engineer',
        description: 'Join our high performing core engineering team to scale cloud platforms.',
        skills: ['React', 'Node.js', 'MongoDB', 'AWS'],
        location: 'Austin, TX',
        workMode: 'remote',
        employmentType: 'full-time',
        status: 'published'
      })
    });
    assert(jobRes.status === 201, 'Recruiter A published job (201 Created)');
    const jobData = await jobRes.json();
    assert(Boolean(jobData.data && jobData.data._id), 'Job response contains valid data._id');
    const targetJobId = jobData.data._id;

    // Candidate A profile & resume
    let candAProfile = await CandidateProfile.findOne({ user: userCandAId });
    if (!candAProfile) {
      candAProfile = await CandidateProfile.create({
        user: userCandAId,
        headline: 'Full Stack Engineer',
        skills: ['React', 'Node.js', 'MongoDB', 'AWS']
      });
    }
    const resumeDoc = await Resume.create({
      candidate: candAProfile._id,
      originalFileName: 'Alice_Resume_2026.pdf',
      fileUrl: '/uploads/resumes/mock_alice.pdf',
      storageProvider: 'test',
      status: 'ready',
      isDefault: true,
      fileSize: 102400,
      parsedText: 'Alice Candidate. Full Stack Engineer. Expert in React, Node.js, MongoDB.'
    });
    assert(resumeDoc._id != null, 'Candidate A uploaded valid resume');

    // Trigger 1: Candidate A applies to Recruiter A's job
    const initialRecANotifs = await NotificationService.getUnreadCount(userRecAId);
    const applyRes = await fetch(`${BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCandA}`
      },
      body: JSON.stringify({
        jobId: targetJobId,
        resumeId: resumeDoc._id.toString(),
        coverLetter: 'Excited to apply for this Full Stack role!'
      })
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201, 'Candidate A submitted application (201 Created)');

    // Verify Recruiter A received APPLICATION_RECEIVED notification
    const recANotifsAfterApp = await NotificationService.getNotifications(userRecAId, { limit: 5 });
    const appReceivedNotif = recANotifsAfterApp.notifications.find(
      (n) => n.type === 'APPLICATION_RECEIVED'
    );
    assert(Boolean(appReceivedNotif), 'Recruiter A received APPLICATION_RECEIVED notification');
    assert(appReceivedNotif.metadata.jobId.toString() === targetJobId.toString(), 'Notification metadata references job ID');

    // Trigger 2: Recruiter A updates application status to "shortlisted"
    const candANotifsBeforeStatus = await NotificationService.getUnreadCount(userCandAId);
    const statusUpdateRes = await fetch(`${BASE_URL}/applications/${applyData.data._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRecA}`
      },
      body: JSON.stringify({ status: 'shortlisted' })
    });
    assert(statusUpdateRes.status === 200, 'Recruiter A updated application status to shortlisted (200 OK)');

    // Verify Candidate A received APPLICATION_STATUS_CHANGED notification
    const candANotifsAfterStatus = await NotificationService.getNotifications(userCandAId, { limit: 5 });
    const statusChangedNotif = candANotifsAfterStatus.notifications.find(
      (n) => n.type === 'APPLICATION_STATUS_CHANGED'
    );
    assert(Boolean(statusChangedNotif), 'Candidate A received APPLICATION_STATUS_CHANGED notification');
    assert(statusChangedNotif.message.includes('shortlisted'), 'Status notification message mentions new status');

    // Trigger 3: Candidate A runs AI resume analysis (using Mock provider)
    const analysisRes = await fetch(`${BASE_URL}/resume-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCandA}`
      },
      body: JSON.stringify({
        jobId: targetJobId,
        resumeId: resumeDoc._id.toString(),
        providerOverride: 'mock'
      })
    });
    const analysisData = await analysisRes.json();
    assert(analysisRes.status === 201, 'Candidate A ran AI resume analysis (201 Created)');

    const candANotifsAfterAI = await NotificationService.getNotifications(userCandAId, { limit: 5 });
    const aiNotif = candANotifsAfterAI.notifications.find(
      (n) => n.type === 'RESUME_ANALYSIS_COMPLETED'
    );
    assert(Boolean(aiNotif), 'Candidate A received RESUME_ANALYSIS_COMPLETED notification');
    assert(aiNotif.metadata.analysisId != null, 'AI analysis notification references analysis ID');

    // -------------------------------------------------------------
    // SECTION 5: Candidate Dashboard & Strict Data Isolation
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Candidate Dashboard & Isolation ---');

    // 5a. Unauthenticated access rejected
    const unauthDashRes = await fetch(`${BASE_URL}/dashboard/candidate`);
    assert(unauthDashRes.status === 401, 'Unauthenticated candidate dashboard access rejected with 401 Unauthorized');

    // 5b. Recruiter forbidden from accessing candidate dashboard
    const recCandDashRes = await fetch(`${BASE_URL}/dashboard/candidate`, {
      headers: { Authorization: `Bearer ${tokenRecA}` }
    });
    assert(recCandDashRes.status === 403, 'Recruiter role forbidden from candidate dashboard (403 Forbidden)');

    // 5c. Candidate A retrieves their dashboard
    const candDashRes = await fetch(`${BASE_URL}/dashboard/candidate`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const candDashData = await candDashRes.json();
    assert(candDashRes.status === 200, 'Candidate A retrieved candidate dashboard (200 OK)');

    // Verify application statistics
    const appStats = candDashData.data.applications;
    assert(appStats.total === 1, 'Total applications matches real database count (1)');
    assert(appStats.shortlisted === 1, 'Shortlisted applications count is accurate (1)');
    assert(appStats.applied === 0, 'Applied status count is 0 after status transition');
    assert(appStats.recent.length === 1, 'Recent applications list contains the applied job');
    assert(appStats.recent[0].job.title === 'Full Stack Engineer', 'Populated job title in recent applications');

    // Verify resume statistics
    const resumeStats = candDashData.data.resumes;
    assert(resumeStats.total === 1, 'Total resumes count is accurate (1)');
    assert(resumeStats.ready === 1, 'Ready resumes count is accurate (1)');
    assert(resumeStats.recent.originalFileName === 'Alice_Resume_2026.pdf', 'Recent resume metadata verified');

    // Verify AI statistics
    const aiStats = candDashData.data.ai;
    assert(aiStats.total === 1, 'Total AI analyses count is accurate (1)');
    assert(aiStats.averageScore > 0, 'Average AI match score is calculated (> 0)');
    assert(aiStats.recent != null, 'Recent analysis summary is populated');

    // Verify matches statistics
    const matchStats = candDashData.data.matches;
    assert(typeof matchStats.totalRecommended === 'number', 'Total recommended matches is a number');
    assert(matchStats.highestScore >= 0, 'Highest match score is bounded');

    // 5d. Multi-tenant Isolation: Candidate B has zero activity
    const candBDashRes = await fetch(`${BASE_URL}/dashboard/candidate`, {
      headers: { Authorization: `Bearer ${tokenCandB}` }
    });
    const candBDashData = await candBDashRes.json();
    assert(candBDashRes.status === 200, 'Candidate B retrieved candidate dashboard (200 OK)');
    assert(candBDashData.data.applications.total === 0, 'Candidate B has 0 applications (strict data isolation)');
    assert(candBDashData.data.resumes.total === 0, 'Candidate B has 0 resumes');
    assert(candBDashData.data.ai.total === 0, 'Candidate B has 0 AI analyses');

    // -------------------------------------------------------------
    // SECTION 6: Employer Dashboard & Multi-Tenant Isolation
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Employer Dashboard & Isolation ---');

    // 6a. Unauthenticated access rejected
    const unauthEmpDashRes = await fetch(`${BASE_URL}/dashboard/employer`);
    assert(unauthEmpDashRes.status === 401, 'Unauthenticated employer dashboard access rejected with 401 Unauthorized');

    // 6b. Candidate forbidden from accessing employer dashboard
    const candEmpDashRes = await fetch(`${BASE_URL}/dashboard/employer`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(candEmpDashRes.status === 403, 'Candidate role forbidden from employer dashboard (403 Forbidden)');

    // 6c. Recruiter A retrieves their dashboard
    const recDashRes = await fetch(`${BASE_URL}/dashboard/employer`, {
      headers: { Authorization: `Bearer ${tokenRecA}` }
    });
    const recDashData = await recDashRes.json();
    assert(recDashRes.status === 200, 'Recruiter A retrieved employer dashboard (200 OK)');

    // Company metrics
    assert(recDashData.data.company.managedCount === 1, 'Company managed count is 1');
    assert(recDashData.data.company.details.name === 'Initech Tech Solutions', 'Company name verified');

    // Job metrics
    const empJobStats = recDashData.data.jobs;
    assert(empJobStats.total === 1, 'Total jobs posted is 1');
    assert(empJobStats.published === 1, 'Published jobs count is 1');
    assert(empJobStats.draft === 0, 'Draft jobs count is 0');
    assert(empJobStats.recent.length === 1, 'Recent jobs list contains posted job');

    // Application metrics
    const empAppStats = recDashData.data.applications;
    assert(empAppStats.total === 1, 'Total applications received is 1');
    assert(empAppStats.shortlisted === 1, 'Shortlisted application count is 1');
    assert(empAppStats.recent.length === 1, 'Recent applications list contains applicant');
    assert(empAppStats.recent[0].candidate.user.name === 'Alice Candidate', 'Applicant name populated');

    // 6d. Cross-Recruiter Isolation: Recruiter B has 0 jobs and 0 applications
    const recBDashRes = await fetch(`${BASE_URL}/dashboard/employer`, {
      headers: { Authorization: `Bearer ${tokenRecB}` }
    });
    const recBDashData = await recBDashRes.json();
    assert(recBDashRes.status === 200, 'Recruiter B retrieved employer dashboard (200 OK)');
    assert(recBDashData.data.jobs.total === 0, 'Recruiter B sees 0 jobs (tenant isolation)');
    assert(recBDashData.data.applications.total === 0, 'Recruiter B sees 0 applications');
    assert(recBDashData.data.company.managedCount === 0, 'Recruiter B has no company registered yet');

    // -------------------------------------------------------------
    // SECTION 7: Analytics Endpoints
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Analytics Endpoints ---');

    // 7a. Candidate Analytics
    const candAnalyticsRes = await fetch(`${BASE_URL}/dashboard/candidate/analytics`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    const candAnalyticsData = await candAnalyticsRes.json();
    assert(candAnalyticsRes.status === 200, 'Candidate analytics retrieved (200 OK)');
    assert(candAnalyticsData.data.totalApplications === 1, 'Candidate analytics totalApplications is 1');
    assert(Array.isArray(candAnalyticsData.data.applicationsByStatus), 'applicationsByStatus is an array');
    assert(Array.isArray(candAnalyticsData.data.applicationsOverTime), 'applicationsOverTime is an array');
    assert(candAnalyticsData.data.scoreDistribution.average > 0, 'Score distribution average is calculated');

    // 7b. Employer Analytics
    const empAnalyticsRes = await fetch(`${BASE_URL}/dashboard/employer/analytics`, {
      headers: { Authorization: `Bearer ${tokenRecA}` }
    });
    const empAnalyticsData = await empAnalyticsRes.json();
    assert(empAnalyticsRes.status === 200, 'Employer analytics retrieved (200 OK)');
    assert(empAnalyticsData.data.totalApplications === 1, 'Employer analytics totalApplications is 1');
    assert(empAnalyticsData.data.topJobsByApplications.length === 1, 'Top jobs by applications contains posted job');
    assert(empAnalyticsData.data.topJobsByApplications[0].title === 'Full Stack Engineer', 'Top job title verified');
    assert(Array.isArray(empAnalyticsData.data.jobStatusDistribution), 'jobStatusDistribution is an array');

    // 7c. Role protection on analytics endpoints
    const candBlockedFromEmpAnalytics = await fetch(`${BASE_URL}/dashboard/employer/analytics`, {
      headers: { Authorization: `Bearer ${tokenCandA}` }
    });
    assert(candBlockedFromEmpAnalytics.status === 403, 'Candidate blocked from employer analytics (403 Forbidden)');

    const recBlockedFromCandAnalytics = await fetch(`${BASE_URL}/dashboard/candidate/analytics`, {
      headers: { Authorization: `Bearer ${tokenRecA}` }
    });
    assert(recBlockedFromCandAnalytics.status === 403, 'Recruiter blocked from candidate analytics (403 Forbidden)');

    // -------------------------------------------------------------
    // SECTION 8: Privacy & Data Protection
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Privacy & Security Protections ---');

    // Verify resume parsedText is never exposed in candidate dashboard or employer dashboard
    const candDashRaw = JSON.stringify(candDashData);
    assert(!candDashRaw.includes('Expert in React, Node.js, MongoDB'), 'CRITICAL PRIVACY: Resume parsedText is NOT exposed in candidate dashboard');

    const empDashRaw = JSON.stringify(recDashData);
    assert(!empDashRaw.includes('Expert in React, Node.js, MongoDB'), 'CRITICAL PRIVACY: Resume parsedText is NOT exposed in employer dashboard');

    console.log('\n===============================================');
    console.log(`Phase 9 Test Results: ${passedAssertions} passed, ${failedAssertions} failed`);
    console.log('===============================================\n');

  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

if (process.argv[1]?.endsWith('testPhase9.js')) {
  runPhase9Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}
