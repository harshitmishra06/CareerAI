import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

const allowedStatuses = ['applied', 'screening', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'];
const recruiterAllowedStatuses = ['applied', 'screening', 'shortlisted', 'interview', 'selected', 'rejected'];

/**
 * Validate application submission by a candidate
 */
export const validateApplyJob = (req, res, next) => {
  const { jobId, coverLetter, resumeId } = req.body;
  const errors = [];

  // Job ID validation
  if (!jobId) {
    errors.push({ field: 'jobId', message: 'Job ID is required' });
  } else if (!mongoose.Types.ObjectId.isValid(jobId)) {
    errors.push({ field: 'jobId', message: 'Invalid Job ID format' });
  }

  // Resume ID validation (optional)
  if (resumeId !== undefined && resumeId !== null && resumeId !== '') {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      errors.push({ field: 'resumeId', message: 'Invalid Resume ID format' });
    }
  }

  // Cover letter validation (optional, max 4000 chars)
  if (coverLetter !== undefined && coverLetter !== null) {
    if (typeof coverLetter !== 'string') {
      errors.push({ field: 'coverLetter', message: 'Cover letter must be a string' });
    } else if (coverLetter.trim().length > 4000) {
      errors.push({ field: 'coverLetter', message: 'Cover letter cannot exceed 4000 characters' });
    }
  }

  // Sanitize: remove any client-supplied ownership or status fields
  delete req.body.candidate;
  delete req.body.candidateId;
  delete req.body.recruiter;
  delete req.body.company;
  delete req.body.status;
  delete req.body.appliedAt;

  if (errors.length > 0) {
    return next(new AppError('Application validation failed', 400, errors));
  }

  next();
};

/**
 * Validate status update by a recruiter
 */
export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  if (!status) {
    errors.push({ field: 'status', message: 'Application status is required' });
  } else if (!recruiterAllowedStatuses.includes(status)) {
    errors.push({
      field: 'status',
      message: `Invalid status '${status}'. Recruiter may only transition to: ${recruiterAllowedStatuses.join(', ')}`
    });
  }

  if (errors.length > 0) {
    return next(new AppError('Status update validation failed', 400, errors));
  }

  next();
};

/**
 * Validate pagination and filter query params
 */
export const validateApplicationQuery = (req, res, next) => {
  const { page, limit, status } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be an integer greater than or equal to 1' });
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      errors.push({ field: 'limit', message: 'Limit must be an integer between 1 and 50' });
    }
  }

  if (status !== undefined && status !== '' && !allowedStatuses.includes(status)) {
    errors.push({
      field: 'status',
      message: `Invalid status filter '${status}'. Allowed values: ${allowedStatuses.join(', ')}`
    });
  }

  if (errors.length > 0) {
    return next(new AppError('Query validation failed', 400, errors));
  }

  next();
};
