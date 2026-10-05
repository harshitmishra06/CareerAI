import { ENV } from '../config/env.js';
import { COOKIE_NAME } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';

/**
 * Lightweight CSRF Protection Middleware for Cookie-Authenticated State-Changing Requests
 *
 * Implements the OWASP-recommended Origin & Referer Verification defense:
 * 1. Safe HTTP methods (GET, HEAD, OPTIONS) are exempt (idempotent read operations).
 * 2. Authorization Bearer header requests are exempt (browsers cannot send custom auth headers cross-site).
 * 3. Requests without authentication cookies are exempt (unauthenticated routes like /login, /register).
 * 4. Test environment (NODE_ENV === 'test') is exempt to support automated CLI test suites.
 * 5. State-changing requests (POST, PUT, PATCH, DELETE) that rely on the ambient HttpOnly
 *    session cookie MUST supply an Origin or Referer header matching the allowed frontend origins,
 *    or a verified custom header ('x-requested-with').
 * 6. In production, requests carrying the session cookie without an Origin, Referer, or custom
 *    header are strictly rejected with 403 Forbidden.
 */
export const csrfProtection = (req, res, next) => {
  // 1. Safe HTTP methods do not mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 2. Automated test suite exemption
  if (ENV.NODE_ENV === 'test') {
    return next();
  }

  // 3. If no ambient authentication cookie is present, cookie CSRF does not apply
  // (Pure Authorization Bearer-token clients and unauthenticated endpoints pass through safely)
  if (!req.cookies || !req.cookies[COOKIE_NAME]) {
    return next();
  }

  // 5. For cookie-authenticated state-changing requests, extract Origin or Referer
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }

  // 6. Build allowed origins list matching server CORS policy
  const allowedOrigins = [
    ENV.CLIENT_URL,
    ...(ENV.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] : [])
  ].filter(Boolean);

  // 7. If origin is present, it MUST match allowed origins across all environments
  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      return next();
    }
    return next(
      new AppError(
        'Cross-Site Request Forgery (CSRF) blocked: State-changing request origin is untrusted.',
        403,
        null,
        'CSRF_BLOCKED'
      )
    );
  }

  // 8. Custom header fallback for SPA AJAX requests (HTML forms cannot set custom headers)
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return next();
  }

  // 9. If origin is missing: in production, state-changing cookie requests MUST provide origin or custom header
  if (ENV.NODE_ENV === 'production') {
    return next(
      new AppError(
        'Cross-Site Request Forgery (CSRF) blocked: State-changing request origin is missing.',
        403,
        null,
        'CSRF_BLOCKED'
      )
    );
  }

  // 10. In non-production, permit local non-browser test scripts / curl without origin
  next();
};

export default csrfProtection;
