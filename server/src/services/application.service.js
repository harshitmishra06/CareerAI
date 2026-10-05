import mongoose from 'mongoose';
import { Application, CandidateProfile, RecruiterProfile, Job, Resume } from '../models/index.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export class ApplicationService {
  /**
   * Helper: Get or lazily initialize CandidateProfile for authenticated candidate
   */
  static async getOrCreateCandidateProfile(userId) {
    let profile = await CandidateProfile.findOne({ user: userId });
    if (!profile) {
      profile = await CandidateProfile.create({ user: userId });
    }
    return profile;
  }

  /**
   * Candidate applies to a published job
   */
  static async applyToJob(userId, { jobId, coverLetter, resumeId }) {
    const candidateProfile = await this.getOrCreateCandidateProfile(userId);

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job posting not found', 404);
    }

    // Eligibility check 1: Status must be published
    if (job.status !== 'published') {
      throw new AppError(
        `Applications are only accepted for published jobs (current job status: '${job.status}')`,
        400
      );
    }

    // Eligibility check 2: Not expired
    if (job.expiresAt && new Date(job.expiresAt) < new Date()) {
      throw new AppError('This job posting has expired and is no longer accepting applications', 400);
    }

    // Resume handling & verification
    let attachedResumeId = null;
    if (resumeId) {
      if (!mongoose.Types.ObjectId.isValid(resumeId)) {
        throw new AppError('Invalid resume ID format', 400);
      }
      const resumeDoc = await Resume.findById(resumeId);
      if (!resumeDoc) {
        throw new AppError('Selected resume not found', 404);
      }
      if (!resumeDoc.candidate.equals(candidateProfile._id)) {
        throw new AppError('Unauthorized: You can only attach your own resume', 403);
      }
      if (!['ready', 'processed'].includes(resumeDoc.status)) {
        throw new AppError('The selected resume is not ready to be attached', 400);
      }
      attachedResumeId = resumeDoc._id;
    } else if (candidateProfile.defaultResumeId) {
      attachedResumeId = candidateProfile.defaultResumeId;
    }

    // Duplicate check
    const existing = await Application.findOne({
      candidate: candidateProfile._id,
      job: job._id
    });

    if (existing) {
      throw new AppError('You have already submitted an application for this job', 409);
    }

    try {
      const application = await Application.create({
        candidate: candidateProfile._id,
        job: job._id,
        coverLetter: coverLetter ? coverLetter.trim() : '',
        status: 'applied',
        appliedAt: new Date(),
        resume: attachedResumeId
      });

      await application.populate([
        {
          path: 'job',
          select: 'title location workMode employmentType status salaryMin salaryMax salaryCurrency company recruiter',
          populate: { path: 'company', select: 'name logoUrl location industry isVerified' }
        },
        {
          path: 'resume',
          select: 'originalFileName fileSize fileType status isDefault createdAt'
        }
      ]);

      // Dispatch notification to recruiter (safely catch to prevent blocking application flow)
      try {
        const recruiterProfile = await RecruiterProfile.findById(job.recruiter);
        if (recruiterProfile && recruiterProfile.user) {
          await NotificationService.createNotification({
            user: recruiterProfile.user,
            type: 'APPLICATION_RECEIVED',
            title: 'New Application Received',
            message: `A candidate has submitted an application for "${job.title}".`,
            metadata: {
              applicationId: application._id,
              jobId: job._id
            }
          });
        }
      } catch (notifErr) {
        console.error('Notification dispatch failed for applyToJob:', notifErr.message);
      }

      return application;
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError('You have already submitted an application for this job', 409);
      }
      throw err;
    }
  }

  /**
   * Candidate retrieves their own applications with filtering and pagination
   */
  static async getCandidateApplications(userId, { page = 1, limit = 10, status } = {}) {
    const candidateProfile = await this.getOrCreateCandidateProfile(userId);

    const query = { candidate: candidateProfile._id };
    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ appliedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'job',
        select: 'title location workMode employmentType status salaryMin salaryMax salaryCurrency company',
        populate: { path: 'company', select: 'name logoUrl location industry isVerified' }
      })
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status isDefault createdAt'
      });

    return {
      data: applications,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Get single application details with strict role & ownership checking
   */
  static async getApplicationDetails(userId, userRole, applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError('Invalid application ID format', 400);
    }

    const application = await Application.findById(applicationId)
      .populate({
        path: 'job',
        select: 'title description skills location workMode employmentType salaryMin salaryMax salaryCurrency status company recruiter',
        populate: { path: 'company', select: 'name logoUrl location website industry isVerified description' }
      })
      .populate({
        path: 'candidate',
        select: 'headline bio location phone skills education experience portfolioUrl githubUrl linkedinUrl user',
        populate: { path: 'user', select: 'name email role isActive' }
      })
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status isDefault createdAt'
      });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (userRole === 'candidate') {
      const candidateProfile = await CandidateProfile.findOne({ user: userId });
      if (!candidateProfile || !application.candidate._id.equals(candidateProfile._id)) {
        throw new AppError('Unauthorized: You can only view your own applications', 403);
      }
    } else if (userRole === 'recruiter') {
      const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
      if (!recruiterProfile || !application.job.recruiter.equals(recruiterProfile._id)) {
        throw new AppError('Unauthorized: You can only view applications for your own jobs', 403);
      }
    }

    return application;
  }

  /**
   * Candidate withdraws an active application
   */
  static async withdrawApplication(userId, applicationId) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError('Invalid application ID format', 400);
    }

    const candidateProfile = await this.getOrCreateCandidateProfile(userId);
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Strict ownership verification
    if (!application.candidate.equals(candidateProfile._id)) {
      throw new AppError('Unauthorized: You can only withdraw your own applications', 403);
    }

    // Terminal status check
    const terminalStatuses = ['selected', 'rejected', 'withdrawn'];
    if (terminalStatuses.includes(application.status)) {
      throw new AppError(
        `Cannot withdraw an application that is already in '${application.status}' status`,
        400
      );
    }

    application.status = 'withdrawn';
    await application.save();

    await application.populate({
      path: 'job',
      select: 'title location status company',
      populate: { path: 'company', select: 'name' }
    });

    return application;
  }

  /**
   * Recruiter gets applications for a specific job they own
   */
  static async getJobApplicationsForRecruiter(userId, userRole, jobId, { page = 1, limit = 10, status } = {}) {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Invalid job ID format', 400);
    }

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job) {
      throw new AppError('Job posting not found', 404);
    }

    // Recruiter ownership verification
    if (userRole !== 'admin') {
      const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
      if (!recruiterProfile || !job.recruiter.equals(recruiterProfile._id)) {
        throw new AppError('Unauthorized: You can only view applications for jobs you manage', 403);
      }
    }

    const query = { job: jobId };
    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort({ appliedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'candidate',
        select: 'headline location skills education experience phone portfolioUrl githubUrl linkedinUrl user',
        populate: { path: 'user', select: 'name email role isActive' }
      })
      .populate({
        path: 'job',
        select: 'title location workMode employmentType status'
      })
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status isDefault createdAt'
      });

    return {
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        company: job.company
      },
      data: applications,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Recruiter updates status of an application for their job
   */
  static async updateApplicationStatus(userId, userRole, applicationId, newStatus) {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new AppError('Invalid application ID format', 400);
    }

    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    // Ownership check
    if (userRole !== 'admin') {
      const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
      if (!recruiterProfile || !application.job.recruiter.equals(recruiterProfile._id)) {
        throw new AppError('Unauthorized: You can only update applications for jobs you manage', 403);
      }
    }

    // Withdrawn cannot be processed
    if (application.status === 'withdrawn') {
      throw new AppError('Cannot update status of a withdrawn application', 400);
    }

    application.status = newStatus;
    await application.save();

    await application.populate({
      path: 'candidate',
      select: 'headline location skills user',
      populate: { path: 'user', select: 'name email' }
    });

    // Dispatch notification to candidate (safely catch to prevent blocking status update)
    try {
      const candidateUser = application.candidate?.user?._id || application.candidate?.user;
      if (candidateUser) {
        await NotificationService.createNotification({
          user: candidateUser,
          type: 'APPLICATION_STATUS_CHANGED',
          title: 'Application Status Updated',
          message: `Your application for "${application.job?.title || 'Job'}" has been updated to "${newStatus}".`,
          metadata: {
            applicationId: application._id,
            jobId: application.job?._id,
            status: newStatus
          }
        });
      }
    } catch (notifErr) {
      console.error('Notification dispatch failed for updateApplicationStatus:', notifErr.message);
    }

    return application;
  }
}
