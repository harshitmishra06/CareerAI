/**
 * Comprehensive Backend Auth & RBAC Verification Suite
 * Tests all requirements from Phase 2 specification
 */
const BASE_URL = 'http://localhost:5001/api/v1/auth';

const runTest = async () => {
  console.log('🧪 Starting Phase 2 Backend Auth Verification Suite...\n');

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
    const candidateEmail = `jane.candidate.${timestamp}@example.com`;
    const recruiterEmail = `bob.recruiter.${timestamp}@example.com`;

    // Test 1: Register Candidate
    console.log('1. Candidate Registration:');
    const candRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Candidate',
        email: candidateEmail,
        password: 'Password123!',
        role: 'candidate'
      })
    });
    const candData = await candRes.json();
    const candCookie = candRes.headers.get('set-cookie');

    assert(candRes.status === 201, 'Status code is 201 Created', `(got ${candRes.status})`);
    assert(candData.success === true, 'Response success is true');
    assert(candData.data.user.role === 'candidate', 'Role assigned is candidate');
    assert(candData.data.user.email === candidateEmail, 'Email normalized correctly');
    assert(candData.data.user.password === undefined, 'Password field is NOT exposed in response');
    assert(candCookie && candCookie.includes('careerai_token'), 'HttpOnly cookie set in response');

    // Test 2: Register Recruiter
    console.log('\n2. Recruiter Registration:');
    const recRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Recruiter',
        email: recruiterEmail,
        password: 'Password123!',
        role: 'recruiter'
      })
    });
    const recData = await recRes.json();
    const recCookie = recRes.headers.get('set-cookie');

    assert(recRes.status === 201, 'Status code is 201 Created', `(got ${recRes.status})`);
    assert(recData.data.user.role === 'recruiter', 'Role assigned is recruiter');
    assert(recData.data.user.password === undefined, 'Password field is NOT exposed');

    // Test 3: Attempt Public Admin Registration (MUST FAIL)
    console.log('\n3. Prohibited Public Admin Registration:');
    const adminAttemptRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Hacker',
        email: `hacker.${timestamp}@example.com`,
        password: 'Password123!',
        role: 'admin'
      })
    });
    const adminAttemptData = await adminAttemptRes.json();

    assert(adminAttemptRes.status === 400, 'Status code is 400 Bad Request', `(got ${adminAttemptRes.status})`);
    assert(adminAttemptData.success === false, 'Registration rejected');
    assert(
      JSON.stringify(adminAttemptData).includes('Admin registration is restricted'),
      'Clear error message explaining admin registration prohibition'
    );

    // Test 4: Attempt Duplicate Email (MUST FAIL)
    console.log('\n4. Duplicate Email Registration:');
    const dupRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Jane',
        email: candidateEmail,
        password: 'AnotherPassword123!',
        role: 'candidate'
      })
    });
    const dupData = await dupRes.json();

    assert(dupRes.status === 409, 'Status code is 409 Conflict', `(got ${dupRes.status})`);
    assert(dupData.success === false, 'Duplicate registration rejected');

    // Test 5: Login with Correct Password
    console.log('\n5. Login with Correct Password:');
    const loginSuccessRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: candidateEmail,
        password: 'Password123!'
      })
    });
    const loginSuccessData = await loginSuccessRes.json();
    const loginCookie = loginSuccessRes.headers.get('set-cookie');

    assert(loginSuccessRes.status === 200, 'Status code is 200 OK', `(got ${loginSuccessRes.status})`);
    assert(loginSuccessData.success === true, 'Login successful');
    assert(loginSuccessData.data.user.email === candidateEmail, 'Safe user returned');
    assert(loginSuccessData.data.user.password === undefined, 'Password is NOT exposed on login');
    assert(loginCookie && loginCookie.includes('careerai_token'), 'HttpOnly auth cookie sent');

    // Test 6: Login with Incorrect Password (MUST FAIL)
    console.log('\n6. Login with Incorrect Password:');
    const loginFailRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: candidateEmail,
        password: 'WrongPassword999!'
      })
    });
    const loginFailData = await loginFailRes.json();

    assert(loginFailRes.status === 401, 'Status code is 401 Unauthorized', `(got ${loginFailRes.status})`);
    assert(loginFailData.success === false, 'Login rejected with 401');

    // Test 7: GET /auth/me without Authentication (MUST FAIL)
    console.log('\n7. GET /auth/me Unauthenticated:');
    const meUnauthRes = await fetch(`${BASE_URL}/me`);
    const meUnauthData = await meUnauthRes.json();

    assert(meUnauthRes.status === 401, 'Status code is 401 Unauthorized', `(got ${meUnauthRes.status})`);
    assert(meUnauthData.success === false, 'Access rejected without credentials');

    // Test 8: GET /auth/me with Cookie Authentication
    console.log('\n8. GET /auth/me with Valid Cookie:');
    const parsedCookie = loginCookie.split(';')[0];
    const meAuthRes = await fetch(`${BASE_URL}/me`, {
      headers: { Cookie: parsedCookie }
    });
    const meAuthData = await meAuthRes.json();

    assert(meAuthRes.status === 200, 'Status code is 200 OK', `(got ${meAuthRes.status})`);
    assert(meAuthData.data.user.email === candidateEmail, 'Current user retrieved from cookie');
    assert(meAuthData.data.user.password === undefined, 'Password not returned');

    // Test 9: GET /auth/me with Bearer Token Header Authentication
    console.log('\n9. GET /auth/me with Bearer Token Header:');
    const bearerToken = loginSuccessData.data.token;
    const meBearerRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${bearerToken}` }
    });
    const meBearerData = await meBearerRes.json();

    assert(meBearerRes.status === 200, 'Status code is 200 OK with Bearer token', `(got ${meBearerRes.status})`);
    assert(meBearerData.data.user.role === 'candidate', 'User identity confirmed via header');

    // Test 10: Role Authorization - Candidate attempting Recruiter Resource (MUST FAIL)
    console.log('\n10. Candidate accessing Recruiter-Only Route:');
    const candForbiddenRes = await fetch(`${BASE_URL}/test-role/recruiter`, {
      headers: { Cookie: parsedCookie }
    });
    const candForbiddenData = await candForbiddenRes.json();

    assert(candForbiddenRes.status === 403, 'Status code is 403 Forbidden', `(got ${candForbiddenRes.status})`);
    assert(
      JSON.stringify(candForbiddenData).includes('Access forbidden'),
      'Error message clarifies role permission rejection'
    );

    // Test 11: Role Authorization - Recruiter accessing Recruiter Resource (MUST SUCCEED)
    console.log('\n11. Recruiter accessing Recruiter-Only Route:');
    const parsedRecCookie = recCookie.split(';')[0];
    const recAllowedRes = await fetch(`${BASE_URL}/test-role/recruiter`, {
      headers: { Cookie: parsedRecCookie }
    });
    const recAllowedData = await recAllowedRes.json();

    assert(recAllowedRes.status === 200, 'Status code is 200 OK for recruiter', `(got ${recAllowedRes.status})`);
    assert(recAllowedData.success === true, 'Recruiter permitted to access recruiter resource');

    // Test 12: Logout Endpoint
    console.log('\n12. Logout Endpoint:');
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { Cookie: parsedCookie }
    });
    const logoutData = await logoutRes.json();
    const logoutCookie = logoutRes.headers.get('set-cookie');

    assert(logoutRes.status === 200, 'Status code is 200 OK', `(got ${logoutRes.status})`);
    assert(logoutData.success === true, 'Logout acknowledged');
    assert(
      logoutCookie && (logoutCookie.includes('careerai_token=;') || logoutCookie.includes('Max-Age=0')),
      'Cookie cleared in response header'
    );

    console.log(`\n===============================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`===============================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

runTest();
