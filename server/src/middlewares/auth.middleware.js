import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware: Require Authentication
 * Extracts token from HttpOnly cookie or Authorization: Bearer <token>
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    // 2. Check Authorization Bearer header (supports API/mobile/curl clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // 3. Verify token signature
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(new AppError('Authentication token has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }

    // 4. Verify user exists and is active
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return next(new AppError('The account associated with this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // 5. Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Require Role Authorization (RBAC)
 * Verifies if authenticated user role is authorized
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before role verification.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Required role(s): [${allowedRoles.join(', ')}]. Your role: [${req.user.role}].`,
          403
        )
      );
    }

    next();
  };
};

export default { requireAuth, requireRole };
