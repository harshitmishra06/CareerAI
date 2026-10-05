import express from 'express';
import { ResumeController } from '../controllers/resume.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { uploadResumeMiddleware } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Candidate uploads a resume
router.post('/upload', requireAuth, requireRole('candidate'), uploadResumeMiddleware, ResumeController.uploadResume);

// Candidate retrieves their uploaded resumes
router.get('/', requireAuth, requireRole('candidate'), ResumeController.getMyResumes);

// Candidate or authorized hiring recruiter accesses resume metadata
router.get('/:id', requireAuth, ResumeController.getResumeById);

// Candidate sets default resume
router.patch('/:id/default', requireAuth, requireRole('candidate'), ResumeController.selectDefaultResume);

// Candidate deletes an unreferenced resume
router.delete('/:id', requireAuth, requireRole('candidate'), ResumeController.deleteResume);

// Secure file binary access (Candidate owner or hiring recruiter for attached application)
router.get('/:id/file', requireAuth, ResumeController.downloadResumeFile);

export default router;
