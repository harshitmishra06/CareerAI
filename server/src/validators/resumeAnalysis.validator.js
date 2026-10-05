import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export const validateCreateAnalysis = (req, res, next) => {
  const { resumeId, jobId } = req.body;
  const errors = [];

  if (!resumeId) {
    errors.push({ field: 'resumeId', message: 'Resume ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    errors.push({ field: 'resumeId', message: 'Invalid Resume ID format' });
  }

  if (!jobId) {
    errors.push({ field: 'jobId', message: 'Job ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(jobId)) {
    errors.push({ field: 'jobId', message: 'Invalid Job ID format' });
  }

  // Sanitize any client-injected fields
  delete req.body.candidate;
  delete req.body.candidateId;
  delete req.body.matchScore;
  delete req.body.matchedSkills;
  delete req.body.missingSkills;
  delete req.body.recommendations;
  delete req.body.summary;
  delete req.body.status;
  delete req.body.provider;
  delete req.body.model;

  if (errors.length > 0) {
    return next(new AppError('Resume analysis request validation failed', 400, errors));
  }

  next();
};
