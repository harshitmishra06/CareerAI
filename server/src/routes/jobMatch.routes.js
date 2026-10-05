import express from 'express';
import { JobMatchController } from '../controllers/jobMatch.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Candidate retrieves personalized job recommendations
router.get(
  '/',
  requireAuth,
  requireRole('candidate', 'admin'),
  JobMatchController.getJobMatches
);

// Candidate retrieves match details for a specific published job
router.get(
  '/:jobId',
  requireAuth,
  requireRole('candidate', 'admin'),
  JobMatchController.getJobMatchDetails
);

export default router;
