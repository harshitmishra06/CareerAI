import { AppError } from '../utils/AppError.js';

const allowedEmploymentTypes = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const allowedWorkModes = ['onsite', 'hybrid', 'remote'];
const allowedStatuses = ['draft', 'published', 'closed', 'expired'];

export const validateCreateJob = (req, res, next) => {
  const {
    title,
    description,
    skills,
    location,
    employmentType = 'full-time',
    workMode = 'onsite',
    experienceMin = 0,
    experienceMax,
    salaryMin,
    salaryMax,
    salaryCurrency = 'USD',
    status = 'draft'
  } = req.body;

  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Job title is required and must be at least 3 characters long' });
  } else if (title.trim().length > 150) {
    errors.push({ field: 'title', message: 'Job title cannot exceed 150 characters' });
  }

  // Description validation
  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    errors.push({ field: 'description', message: 'Job description is required and must be at least 20 characters long' });
  }

  // Location validation
  if (!location || typeof location !== 'string' || location.trim().length < 2) {
    errors.push({ field: 'location', message: 'Location is required' });
  } else if (location.trim().length > 150) {
    errors.push({ field: 'location', message: 'Location cannot exceed 150 characters' });
  }

  // Enums
  if (!allowedEmploymentTypes.includes(employmentType)) {
    errors.push({ field: 'employmentType', message: `Employment type must be one of: ${allowedEmploymentTypes.join(', ')}` });
  }

  if (!allowedWorkModes.includes(workMode)) {
    errors.push({ field: 'workMode', message: `Work mode must be one of: ${allowedWorkModes.join(', ')}` });
  }

  if (status && !['draft', 'published', 'closed'].includes(status)) {
    errors.push({ field: 'status', message: "Initial status must be 'draft' or 'published'" });
  }

  // Experience ranges
  const minExp = Number(experienceMin);
  if (isNaN(minExp) || minExp < 0) {
    errors.push({ field: 'experienceMin', message: 'Minimum experience must be a non-negative number' });
  }

  let maxExp = undefined;
  if (experienceMax !== undefined && experienceMax !== null && experienceMax !== '') {
    maxExp = Number(experienceMax);
    if (isNaN(maxExp) || maxExp < 0) {
      errors.push({ field: 'experienceMax', message: 'Maximum experience must be a non-negative number' });
    } else if (maxExp < minExp) {
      errors.push({ field: 'experienceMax', message: 'Maximum experience must be greater than or equal to minimum experience' });
    }
  }

  // Salary ranges
  let minSal = undefined;
  if (salaryMin !== undefined && salaryMin !== null && salaryMin !== '') {
    minSal = Number(salaryMin);
    if (isNaN(minSal) || minSal < 0) {
      errors.push({ field: 'salaryMin', message: 'Minimum salary cannot be negative' });
    }
  }

  let maxSal = undefined;
  if (salaryMax !== undefined && salaryMax !== null && salaryMax !== '') {
    maxSal = Number(salaryMax);
    if (isNaN(maxSal) || maxSal < 0) {
      errors.push({ field: 'salaryMax', message: 'Maximum salary cannot be negative' });
    } else if (minSal !== undefined && maxSal < minSal) {
      errors.push({ field: 'salaryMax', message: 'Maximum salary must be greater than or equal to minimum salary' });
    }
  }

  // Normalize skills
  let normalizedSkills = [];
  if (Array.isArray(skills)) {
    normalizedSkills = skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  } else if (typeof skills === 'string') {
    normalizedSkills = skills
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  if (errors.length > 0) {
    return next(new AppError('Job validation failed', 400, errors));
  }

  // Sanitized payload assignment
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.location = location.trim();
  req.body.skills = normalizedSkills;
  req.body.employmentType = employmentType;
  req.body.workMode = workMode;
  req.body.experienceMin = minExp;
  if (maxExp !== undefined) req.body.experienceMax = maxExp;
  if (minSal !== undefined) req.body.salaryMin = minSal;
  if (maxSal !== undefined) req.body.salaryMax = maxSal;
  req.body.salaryCurrency = (salaryCurrency || 'USD').toUpperCase().trim();
  req.body.status = status;

  next();
};

export const validateUpdateJob = (req, res, next) => {
  const {
    title,
    description,
    skills,
    location,
    employmentType,
    workMode,
    experienceMin,
    experienceMax,
    salaryMin,
    salaryMax,
    salaryCurrency,
    status
  } = req.body;

  const errors = [];

  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Job title must be at least 3 characters long' });
    } else if (title.trim().length > 150) {
      errors.push({ field: 'title', message: 'Job title cannot exceed 150 characters' });
    }
  }

  if (description !== undefined) {
    if (!description || typeof description !== 'string' || description.trim().length < 20) {
      errors.push({ field: 'description', message: 'Job description must be at least 20 characters long' });
    }
  }

  if (location !== undefined) {
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      errors.push({ field: 'location', message: 'Location cannot be empty' });
    }
  }

  if (employmentType !== undefined && !allowedEmploymentTypes.includes(employmentType)) {
    errors.push({ field: 'employmentType', message: `Employment type must be one of: ${allowedEmploymentTypes.join(', ')}` });
  }

  if (workMode !== undefined && !allowedWorkModes.includes(workMode)) {
    errors.push({ field: 'workMode', message: `Work mode must be one of: ${allowedWorkModes.join(', ')}` });
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${allowedStatuses.join(', ')}` });
  }

  if (experienceMin !== undefined && (isNaN(Number(experienceMin)) || Number(experienceMin) < 0)) {
    errors.push({ field: 'experienceMin', message: 'Minimum experience must be a non-negative number' });
  }

  if (experienceMax !== undefined && (isNaN(Number(experienceMax)) || Number(experienceMax) < 0)) {
    errors.push({ field: 'experienceMax', message: 'Maximum experience must be a non-negative number' });
  }

  if (salaryMin !== undefined && (isNaN(Number(salaryMin)) || Number(salaryMin) < 0)) {
    errors.push({ field: 'salaryMin', message: 'Minimum salary cannot be negative' });
  }

  if (salaryMax !== undefined && (isNaN(Number(salaryMax)) || Number(salaryMax) < 0)) {
    errors.push({ field: 'salaryMax', message: 'Maximum salary cannot be negative' });
  }

  if (errors.length > 0) {
    return next(new AppError('Job update validation failed', 400, errors));
  }

  if (title) req.body.title = title.trim();
  if (description) req.body.description = description.trim();
  if (location) req.body.location = location.trim();
  if (salaryCurrency) req.body.salaryCurrency = salaryCurrency.toUpperCase().trim();
  if (skills) {
    req.body.skills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
      : String(skills)
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
  }

  next();
};

export const validateJobStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !['draft', 'published', 'closed'].includes(status)) {
    return next(new AppError("Status must be one of: 'draft', 'published', 'closed'", 400));
  }
  next();
};
