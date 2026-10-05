import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  validateApplyJob,
  validateUpdateStatus,
  validateApplicationQuery
} from '../validators/application.validator.js';

const router = Router();

// Candidate: Apply to job
router.post('/', requireAuth, requireRole('candidate'), validateApplyJob, ApplicationController.apply);

// Candidate: Get own submitted applications (must precede /:id)
router.get('/me', requireAuth, requireRole('candidate'), validateApplicationQuery, ApplicationController.getMyApplications);

// Candidate: Withdraw own application
router.patch('/:id/withdraw', requireAuth, requireRole('candidate'), ApplicationController.withdraw);

// Recruiter: Update application status
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('recruiter', 'admin'),
  validateUpdateStatus,
  ApplicationController.updateStatus
);

// Shared: View application details (Candidate sees own, Recruiter sees applicant for own job)
router.get('/:id', requireAuth, ApplicationController.getApplicationById);

export default router;
