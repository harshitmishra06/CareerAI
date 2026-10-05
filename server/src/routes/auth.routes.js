import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Public auth endpoints
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);

// Protected auth endpoints
router.get('/me', requireAuth, AuthController.getMe);

// Verification test endpoints for Role-Based Access Control (RBAC)
router.get('/test-role/recruiter', requireAuth, requireRole('recruiter', 'admin'), (req, res) => {
  return ApiResponse.success(
    res,
    200,
    { user: req.user.toSafeObject() },
    'Access granted: Recruiter/Admin privilege confirmed'
  );
});

router.get('/test-role/admin', requireAuth, requireRole('admin'), (req, res) => {
  return ApiResponse.success(
    res,
    200,
    { user: req.user.toSafeObject() },
    'Access granted: Administrator privilege confirmed'
  );
});

export default router;
