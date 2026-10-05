import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { DashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

// Authentication required for all dashboard operations
router.use(requireAuth);

// Candidate Dashboard & Analytics
router.get(
  '/candidate',
  requireRole('candidate', 'admin'),
  DashboardController.getCandidateDashboard
);

router.get(
  '/candidate/analytics',
  requireRole('candidate', 'admin'),
  DashboardController.getCandidateAnalytics
);

// Employer / Recruiter Dashboard & Analytics
router.get(
  '/employer',
  requireRole('recruiter', 'admin'),
  DashboardController.getEmployerDashboard
);

router.get(
  '/employer/analytics',
  requireRole('recruiter', 'admin'),
  DashboardController.getEmployerAnalytics
);

export default router;
