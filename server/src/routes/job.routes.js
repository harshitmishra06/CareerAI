import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateCreateJob, validateUpdateJob, validateJobStatus } from '../validators/job.validator.js';

import { ApplicationController } from '../controllers/application.controller.js';
import { validateApplicationQuery } from '../validators/application.validator.js';

const router = Router();

// Recruiter-specific job management routes
router.post('/recruiter', requireAuth, requireRole('recruiter'), validateCreateJob, JobController.create);
router.get('/recruiter/me', requireAuth, requireRole('recruiter'), JobController.getRecruiterJobs);
router.get('/recruiter/:id', requireAuth, requireRole('recruiter'), JobController.getRecruiterJobById);
router.patch('/recruiter/:id', requireAuth, requireRole('recruiter'), validateUpdateJob, JobController.updateRecruiterJob);
router.patch('/recruiter/:id/status', requireAuth, requireRole('recruiter'), validateJobStatus, JobController.updateJobStatus);
router.get('/recruiter/:jobId/applications', requireAuth, requireRole('recruiter', 'admin'), validateApplicationQuery, ApplicationController.getJobApplications);

// Recruiter applications for a job (REST convention: GET /api/v1/jobs/:jobId/applications)
router.get('/:jobId/applications', requireAuth, requireRole('recruiter', 'admin'), validateApplicationQuery, ApplicationController.getJobApplications);

// Public / Candidate job feed & details
router.get('/', JobController.getPublicJobs);
router.get('/:id', JobController.getPublicJobById);

export default router;
