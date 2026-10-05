import { Job, RecruiterProfile, Company } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export class JobService {
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
   * Recruiter creates a job posting
   */
  static async createJob(userId, jobData) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    // Enforce that recruiter has a company before creating jobs
    if (!recruiterProfile.company) {
      throw new AppError(
        'You must set up a company profile before posting jobs. Please create your company profile first.',
        400
      );
    }

    // Verify company document exists
    const company = await Company.findById(recruiterProfile.company);
    if (!company) {
      throw new AppError('Associated company profile could not be found. Please update your company profile.', 404);
    }

    // Explicitly bind recruiter and company from authenticated session (ignore client overrides)
    const { recruiter, company: ignoredCompany, ...safeJobData } = jobData;

    const publishedAt = safeJobData.status === 'published' ? new Date() : null;

    const job = await Job.create({
      ...safeJobData,
      recruiter: recruiterProfile._id,
      company: company._id,
      publishedAt
    });

    return job.populate('company', 'name logoUrl slug location industry isVerified');
  }

  /**
   * Retrieve all jobs posted by the authenticated recruiter
   */
  static async getRecruiterJobs(userId, { page = 1, limit = 10, status } = {}) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    const query = { recruiter: recruiterProfile._id };
    if (status && ['draft', 'published', 'closed', 'expired'].includes(status)) {
      query.status = status;
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .populate('company', 'name logoUrl slug location industry isVerified')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      jobs,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    };
  }

  /**
   * Recruiter retrieves own job by ID (including draft/closed jobs)
   */
  static async getRecruiterJobById(userId, jobId) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    const job = await Job.findById(jobId).populate('company', 'name logoUrl slug location industry isVerified');
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    // Strictly verify ownership
    if (!job.recruiter.equals(recruiterProfile._id)) {
      throw new AppError('You are not authorized to view or manage this job posting.', 403);
    }

    return job;
  }

  /**
   * Recruiter updates own job posting
   */
  static async updateRecruiterJob(userId, jobId, updateData) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    // Strictly verify ownership
    if (!job.recruiter.equals(recruiterProfile._id)) {
      throw new AppError('You are not authorized to modify this job posting.', 403);
    }

    // Strip attempts to change recruiter ownership or company
    const { recruiter, company, ...safeUpdates } = updateData;

    // Handle publishing date when transitioning to published
    if (safeUpdates.status === 'published' && job.status !== 'published') {
      safeUpdates.publishedAt = new Date();
    }

    Object.assign(job, safeUpdates);
    await job.save();

    return job.populate('company', 'name logoUrl slug location industry isVerified');
  }

  /**
   * Recruiter transitions job status (publish/close/draft)
   */
  static async updateJobStatus(userId, jobId, newStatus) {
    const recruiterProfile = await this.getOrCreateRecruiterProfile(userId);

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job posting not found.', 404);
    }

    if (!job.recruiter.equals(recruiterProfile._id)) {
      throw new AppError('You are not authorized to change the status of this job.', 403);
    }

    if (newStatus === 'published' && job.status !== 'published') {
      job.publishedAt = new Date();
    }

    job.status = newStatus;
    await job.save();

    return job.populate('company', 'name logoUrl slug location industry isVerified');
  }

  /**
   * Candidate / Public job feed
   * STRICT SECURITY RULE: Only returns jobs with status: 'published'
   */
  static async getPublicJobs({
    search,
    location,
    workMode,
    employmentType,
    skill,
    experience,
    page = 1,
    limit = 10
  } = {}) {
    // Strictly isolate query to published jobs only
    const query = { status: 'published' };

    // Search query on title, description, or skills
    if (search && typeof search === 'string' && search.trim()) {
      const trimmedSearch = search.trim();
      query.$or = [
        { title: { $regex: trimmedSearch, $options: 'i' } },
        { description: { $regex: trimmedSearch, $options: 'i' } },
        { skills: { $in: [new RegExp(trimmedSearch, 'i')] } }
      ];
    }

    if (location && typeof location === 'string' && location.trim()) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (workMode && ['onsite', 'hybrid', 'remote'].includes(workMode)) {
      query.workMode = workMode;
    }

    if (
      employmentType &&
      ['full-time', 'part-time', 'contract', 'internship', 'freelance'].includes(employmentType)
    ) {
      query.employmentType = employmentType;
    }

    if (skill && typeof skill === 'string' && skill.trim()) {
      query.skills = skill.trim().toLowerCase();
    }

    if (experience !== undefined && experience !== null && experience !== '') {
      const expNum = Number(experience);
      if (!isNaN(expNum)) {
        query.experienceMin = { $lte: expNum };
      }
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .populate('company', 'name logoUrl slug location industry isVerified')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;

    return {
      jobs,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    };
  }

  /**
   * Candidate / Public single job details
   * STRICT SECURITY RULE: Only returns job if status is 'published'
   */
  static async getPublicJobById(jobId) {
    const job = await Job.findOne({ _id: jobId, status: 'published' }).populate(
      'company',
      'name logoUrl slug description website industry companySize location foundedYear isVerified'
    );

    if (!job) {
      throw new AppError('Job posting not found or is no longer accepting views.', 404);
    }

    return job;
  }
}

export default JobService;
