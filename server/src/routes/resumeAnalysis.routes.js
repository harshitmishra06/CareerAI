import express from 'express';
import { ResumeAnalysisController } from '../controllers/resumeAnalysis.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateCreateAnalysis } from '../validators/resumeAnalysis.validator.js';

const router = express.Router();

// Candidate creates an AI resume analysis against a job
router.post(
  '/',
  requireAuth,
  requireRole('candidate'),
  validateCreateAnalysis,
  ResumeAnalysisController.createAnalysis
);

// Candidate retrieves all their past analyses
router.get(
  '/me',
  requireAuth,
  requireRole('candidate'),
  ResumeAnalysisController.getMyAnalyses
);

// Candidate views a specific analysis by ID (protected against IDOR)
router.get(
  '/:id',
  requireAuth,
  requireRole('candidate'),
  ResumeAnalysisController.getAnalysisById
);

export default router;
