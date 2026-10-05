import mongoose from 'mongoose';
import { Company, RecruiterProfile } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export class CompanyService {
  /**
   * Helper to ensure unique slug generation
   */
  static async generateUniqueSlug(name) {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug || 'company';
    let counter = 1;

    while (await Company.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Helper: Get or lazily initialize RecruiterProfile for authenticated recruiter
   */
  static async getOrCreateRecruiterProfile(userId) {
    let profile = await RecruiterProfile.findOne({ user: userId });
    if (!profile) {
      profile = await RecruiterProfile.create({ user: userId });
    }
    return profile;
  }

  /**
   * Recruiter creates a new company
   */
  static async createCompany(userId, companyData) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    // If recruiter already has an associated company, prevent duplicate company creation
    if (recruiterProfile.company) {
      const existingCompany = await Company.findById(recruiterProfile.company);
      if (existingCompany) {
        throw new AppError('You already have an associated company profile. Please update your existing company.', 400);
      }
    }

    // Generate unique slug
    const slug = await this.generateUniqueSlug(companyData.name);

    // Filter out restricted fields (e.g. isVerified cannot be set by recruiter)
    const { isVerified, ...allowedData } = companyData;

    const company = await Company.create({
      ...allowedData,
      slug,
      isVerified: false
    });

    // Associate company with recruiter's profile
    recruiterProfile.company = company._id;
    await recruiterProfile.save();

    return company;
  }

  /**
   * Get the company associated with the authenticated recruiter
   */
  static async getMyCompany(userId) {
    const recruiterProfile = await RecruiterProfile.findOne({ user: userId }).populate('company');

    if (!recruiterProfile || !recruiterProfile.company) {
      throw new AppError('No company profile associated with this account. Please create your company profile first.', 404);
    }

    return recruiterProfile.company;
  }

  /**
   * Update the company associated with the authenticated recruiter
   */
  static async updateMyCompany(userId, updateData) {
    const recruiterProfile = await RecruiterProfile.findOne({ user: userId });

    if (!recruiterProfile || !recruiterProfile.company) {
      throw new AppError('No company profile associated with this account. Please create your company profile first.', 404);
    }

    // Disallow modifying isVerified or slug directly through recruiter update
    const { isVerified, slug, ...allowedUpdates } = updateData;

    const updatedCompany = await Company.findByIdAndUpdate(
      recruiterProfile.company,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      throw new AppError('Company profile not found.', 404);
    }

    return updatedCompany;
  }

  /**
   * Public retrieval of company by ID or Slug
   */
  static async getCompanyById(idOrSlug) {
    let company;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      company = await Company.findById(idOrSlug);
    } else {
      company = await Company.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!company) {
      throw new AppError('Company not found.', 404);
    }

    return company;
  }
}

export default CompanyService;
