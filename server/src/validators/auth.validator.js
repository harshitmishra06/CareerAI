import { AppError } from '../utils/AppError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters long' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
  }

  // Email validation
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  // Password validation
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  // Role validation - strictly prohibit public admin registration
  const normalizedRole = role ? role.toLowerCase() : 'candidate';
  if (normalizedRole === 'admin') {
    errors.push({
      field: 'role',
      message: 'Admin registration is restricted. Only candidate and recruiter roles can be registered publicly.'
    });
  } else if (!['candidate', 'recruiter'].includes(normalizedRole)) {
    errors.push({
      field: 'role',
      message: 'Invalid role. Only candidate and recruiter roles are permitted for registration.'
    });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  req.body.role = normalizedRole;
  req.body.email = email.trim().toLowerCase();
  req.body.name = name.trim();
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new AppError('Validation failed', 400, errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
};
