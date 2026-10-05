import { AppError } from '../utils/AppError.js';

const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
const allowedCompanySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export const validateCreateCompany = (req, res, next) => {
  const { name, description, website, logoUrl, industry, companySize, location, foundedYear } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Company name is required and must be at least 2 characters long' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Company name cannot exceed 100 characters' });
  }

  if (description && typeof description === 'string' && description.trim().length > 3000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 3000 characters' });
  }

  if (website && typeof website === 'string' && website.trim() && !urlRegex.test(website.trim())) {
    errors.push({ field: 'website', message: 'Website must be a valid URL' });
  }

  if (industry && typeof industry === 'string' && industry.trim().length > 100) {
    errors.push({ field: 'industry', message: 'Industry cannot exceed 100 characters' });
  }

  if (companySize && !allowedCompanySizes.includes(companySize)) {
    errors.push({
      field: 'companySize',
      message: `Company size must be one of: ${allowedCompanySizes.join(', ')}`
    });
  }

  if (location && typeof location === 'string' && location.trim().length > 150) {
    errors.push({ field: 'location', message: 'Location cannot exceed 150 characters' });
  }

  if (foundedYear !== undefined && foundedYear !== null && foundedYear !== '') {
    const year = Number(foundedYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1800 || year > currentYear + 1) {
      errors.push({ field: 'foundedYear', message: `Founded year must be a valid year between 1800 and ${currentYear + 1}` });
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Company validation failed', 400, errors));
  }

  // Sanitize and trim
  req.body.name = name.trim();
  if (description) req.body.description = description.trim();
  if (website) req.body.website = website.trim();
  if (logoUrl) req.body.logoUrl = logoUrl.trim();
  if (industry) req.body.industry = industry.trim();
  if (location) req.body.location = location.trim();
  if (foundedYear) req.body.foundedYear = Number(foundedYear);

  next();
};

export const validateUpdateCompany = (req, res, next) => {
  const { name, description, website, logoUrl, industry, companySize, location, foundedYear } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Company name must be at least 2 characters long' });
    } else if (name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Company name cannot exceed 100 characters' });
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description === 'string' && description.trim().length > 3000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 3000 characters' });
    }
  }

  if (website !== undefined && website !== null && website.trim() !== '') {
    if (typeof website === 'string' && !urlRegex.test(website.trim())) {
      errors.push({ field: 'website', message: 'Website must be a valid URL' });
    }
  }

  if (industry !== undefined && industry !== null) {
    if (typeof industry === 'string' && industry.trim().length > 100) {
      errors.push({ field: 'industry', message: 'Industry cannot exceed 100 characters' });
    }
  }

  if (companySize !== undefined && companySize !== null && companySize !== '') {
    if (!allowedCompanySizes.includes(companySize)) {
      errors.push({
        field: 'companySize',
        message: `Company size must be one of: ${allowedCompanySizes.join(', ')}`
      });
    }
  }

  if (location !== undefined && location !== null) {
    if (typeof location === 'string' && location.trim().length > 150) {
      errors.push({ field: 'location', message: 'Location cannot exceed 150 characters' });
    }
  }

  if (foundedYear !== undefined && foundedYear !== null && foundedYear !== '') {
    const year = Number(foundedYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1800 || year > currentYear + 1) {
      errors.push({ field: 'foundedYear', message: `Founded year must be a valid year between 1800 and ${currentYear + 1}` });
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Company validation failed', 400, errors));
  }

  // Trim provided fields
  if (name) req.body.name = name.trim();
  if (description) req.body.description = description.trim();
  if (website) req.body.website = website.trim();
  if (logoUrl) req.body.logoUrl = logoUrl.trim();
  if (industry) req.body.industry = industry.trim();
  if (location) req.body.location = location.trim();
  if (foundedYear) req.body.foundedYear = Number(foundedYear);

  next();
};
