/**
 * Phase 10A Production Readiness & Security Hardening Test Suite
 *
 * Verifies:
 * 1. Production Environment Configuration Validation & Secret Protection
 * 2. Health Check Endpoint & Database State Reporting (no credentials leak)
 * 3. Security HTTP Headers (Helmet clickjacking, MIME sniffing protection)
 * 4. Authentication & JWT Security (malformed tokens, tampered signatures)
 * 5. Password Privacy & No-Leak (passwords never returned in auth/query responses)
 * 6. RBAC Role Restrictions & Cross-Tenant IDOR Blockades
 * 7. Sensitive Data Exclusion (resume parsedText is never exposed)
 * 8. Error Response Security (stack traces omitted in production/test)
 * 9. Production Storage Guardrails (Cloudinary mandatory in production)
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User, Notification, Resume, CandidateProfile } from '../models/index.js';
import { validateProductionConfig, ENV } from '../config/env.js';
import { StorageService } from '../services/storage.service.js';
import { NotificationService } from '../services/notification.service.js';

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

export async function runPhase10Tests() {
  console.log('\n🧪 Starting Phase 10A Production Readiness & Security Hardening Test Suite...\n');

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Start ephemeral Express server
  serverInstance = app.listen(0);
  const port = serverInstance.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api/v1`;

  try {
    const ts = Date.now();

    // -------------------------------------------------------------
    // SECTION 1: Production Environment Configuration Guard
    // -------------------------------------------------------------
    console.log('--- Section 1: Production Environment Configuration Validation ---');

    // 1a. Validate non-production passes safely
    assert(validateProductionConfig() === true, 'validateProductionConfig succeeds in test environment');

    // 1b. Fail-fast if default JWT secret used in production
    const originalEnv = ENV.NODE_ENV;
    const originalSecret = ENV.JWT_SECRET;
    try {
      ENV.NODE_ENV = 'production';
      ENV.JWT_SECRET = 'dev_jwt_secret';
      let caughtErr = null;
      try {
        validateProductionConfig();
      } catch (err) {
        caughtErr = err;
      }
      assert(Boolean(caughtErr), 'Fails fast when default dev_jwt_secret is used in production');
      assert(!caughtErr.message.includes('super_secret'), 'Error message does not print secret values');
    } finally {
      ENV.NODE_ENV = originalEnv;
      ENV.JWT_SECRET = originalSecret;
    }

    // -------------------------------------------------------------
    // SECTION 2: Production Health Check Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Health Check & Database State Reporting ---');

    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');

    const healthData = await healthRes.json();
    assert(healthData.data.status === 'healthy', 'Health status is healthy');
    assert(healthData.data.database.status === 'connected', 'Database connectivity status is reported as connected');
    assert(typeof healthData.data.uptime === 'number', 'Server uptime is reported as a number');

    const rawHealthJson = JSON.stringify(healthData);
    assert(!rawHealthJson.includes('mongodb://'), 'Health endpoint does NOT leak MongoDB URI');
    assert(!rawHealthJson.includes('password'), 'Health endpoint does NOT leak database credentials');

    // -------------------------------------------------------------
    // SECTION 3: HTTP Security Headers (Helmet)
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Security HTTP Headers ---');

    const xContentType = healthRes.headers.get('x-content-type-options');
    assert(xContentType === 'nosniff', 'X-Content-Type-Options: nosniff header enforced');

    const xFrameOptions = healthRes.headers.get('x-frame-options');
    assert(xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN', 'X-Frame-Options clickjacking protection enforced');

    // -------------------------------------------------------------
    // SECTION 4: Authentication & JWT Security
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Authentication & JWT Hardening ---');

    // 4a. Malformed token rejected
    const malformedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer this_is_a_completely_invalid_token' }
    });
    assert(malformedRes.status === 401, 'Malformed JWT token rejected with 401 Unauthorized');

    // 4b. Tampered token rejected
    const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature' }
    });
    assert(tamperedRes.status === 401, 'Tampered token signature rejected with 401 Unauthorized');

    // 4c. Register candidate & verify password is never returned
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Secured Candidate',
        email: `sec_cand_${ts}@careerai.test`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Candidate registered (201 Created)');
    assert(regData.data.user.password === undefined, 'Password is NOT present in registration response');

    const candToken = regData.data.token;
    const candUserId = regData.data.user.id || regData.data.user._id;

    // 4d. Login & verify password is not returned
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `sec_cand_${ts}@careerai.test`,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Candidate logged in (200 OK)');
    assert(loginData.data.user.password === undefined, 'Password is NOT present in login response');

    // -------------------------------------------------------------
    // SECTION 5: RBAC Role Enforcement & IDOR Protection
    // -------------------------------------------------------------
    console.log('\n--- Section 5: RBAC & IDOR Protections ---');

    // 5a. Candidate blocked from recruiter jobs creation
    const candPostJobRes = await fetch(`${BASE_URL}/jobs/recruiter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candToken}`
      },
      body: JSON.stringify({ title: 'Hacked Job' })
    });
    assert(candPostJobRes.status === 403, 'Candidate blocked from posting jobs (403 Forbidden)');

    // 5b. Candidate blocked from employer dashboard
    const candEmpDashRes = await fetch(`${BASE_URL}/dashboard/employer`, {
      headers: { Authorization: `Bearer ${candToken}` }
    });
    assert(candEmpDashRes.status === 403, 'Candidate blocked from employer dashboard (403 Forbidden)');

    // 5c. Register another candidate for IDOR check
    const regOtherRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker User',
        email: `attacker_${ts}@careerai.test`,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const otherData = await regOtherRes.json();
    const otherToken = otherData.data.token;

    // Create notification for primary candidate
    const notif = await NotificationService.createNotification({
      user: candUserId,
      type: 'SYSTEM',
      title: 'Security Alert',
      message: 'Testing IDOR protection.'
    });

    // Attacker tries to read primary candidate's notification
    const idorNotifRes = await fetch(`${BASE_URL}/notifications/${notif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    assert(idorNotifRes.status === 403, 'IDOR blocked: Attacker cannot mark another user notification as read (403 Forbidden)');

    // -------------------------------------------------------------
    // SECTION 6: Sensitive Data Exclusion & Error Handling
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Sensitive Data Exclusion & Privacy ---');

    // 6a. Upload resume with parsedText
    const candProfile = await CandidateProfile.create({
      user: candUserId,
      headline: 'Secured Engineer'
    });

    await Resume.create({
      candidate: candProfile._id,
      originalFileName: 'Confidential_CV.pdf',
      fileUrl: '/uploads/resumes/confidential.pdf',
      storageProvider: 'test',
      status: 'ready',
      isDefault: true,
      fileSize: 50000,
      parsedText: 'CONFIDENTIAL_SSN_AND_SALARY_DATA_DO_NOT_EXPOSE'
    });

    // Retrieve Candidate Dashboard
    const candDashRes = await fetch(`${BASE_URL}/dashboard/candidate`, {
      headers: { Authorization: `Bearer ${candToken}` }
    });
    const candDashData = await candDashRes.json();
    assert(candDashRes.status === 200, 'Candidate dashboard retrieved (200 OK)');

    const rawCandDash = JSON.stringify(candDashData);
    assert(!rawCandDash.includes('CONFIDENTIAL_SSN_AND_SALARY_DATA_DO_NOT_EXPOSE'), 'Resume parsedText is excluded from candidate dashboard');

    // 6b. Error handling: non-existent endpoint returns 404 with standard envelope and no stack trace in production
    const origEnvForError = ENV.NODE_ENV;
    try {
      ENV.NODE_ENV = 'production';
      const notFoundRes = await fetch(`${BASE_URL}/non-existent-endpoint-${ts}`);
      assert(notFoundRes.status === 404, 'Undefined route returns 404 Not Found');

      const notFoundData = await notFoundRes.json();
      assert(notFoundData.success === false, 'Error response success is false');
      assert(notFoundData.error.code === 'NOT_FOUND', 'Error response error.code is NOT_FOUND');
      assert(notFoundData.error.stack === undefined, 'Stack trace is NOT exposed in production environment');
    } finally {
      ENV.NODE_ENV = origEnvForError;
    }

    // -------------------------------------------------------------
    // SECTION 7: Storage & Cloudinary Production Safety Guard
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Storage & Cloudinary Production Guardrails ---');

    // StorageService.validateProductionConfig fails fast if Cloudinary is missing in production
    const origCloudName = ENV.CLOUDINARY_CLOUD_NAME;
    try {
      ENV.CLOUDINARY_CLOUD_NAME = '';
      let caughtStorageErr = null;
      try {
        StorageService.validateProductionConfig();
      } catch (err) {
        caughtStorageErr = err;
      }
      assert(Boolean(caughtStorageErr), 'StorageService fails fast when Cloudinary credentials are missing in production');
      assert(caughtStorageErr.code === 'STORAGE_CONFIG_ERROR', 'Error code is STORAGE_CONFIG_ERROR');
    } finally {
      ENV.CLOUDINARY_CLOUD_NAME = origCloudName;
    }

    console.log('\n===============================================');
    console.log(`Phase 10A Test Results: ${passedAssertions} passed, ${failedAssertions} failed`);
    console.log('===============================================\n');

  } finally {
    if (serverInstance) serverInstance.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }
}

if (process.argv[1]?.endsWith('testPhase10.js')) {
  runPhase10Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}
