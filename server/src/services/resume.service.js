import mongoose from 'mongoose';
import path from 'path';
import { Resume, CandidateProfile, RecruiterProfile, Application } from '../models/index.js';
import { StorageService } from './storage.service.js';
import { PdfParserService } from './pdfParser.service.js';
import { AppError } from '../utils/AppError.js';

export class ResumeService {
  /**
   * Helper: Get or lazily initialize CandidateProfile
   */
  static async getOrCreateCandidateProfile(userId) {
    let profile = await CandidateProfile.findOne({ user: userId });
    if (!profile) {
      profile = await CandidateProfile.create({ user: userId });
    }
    return profile;
  }

  /**
   * Helper: Sanitize original file name
   */
  static sanitizeFilename(originalName) {
    if (!originalName || typeof originalName !== 'string') return 'resume.pdf';
    // Remove directory traversal characters and unsafe symbols
    const basename = path.basename(originalName);
    const sanitized = basename.replace(/[^a-zA-Z0-9._-\s]/g, '').trim();
    return sanitized.slice(0, 250) || 'resume.pdf';
  }

  /**
   * Candidate uploads a new resume PDF
   */
  static async uploadResume(userId, { fileBuffer, originalName, mimeType = 'application/pdf', fileSize }) {
    const candidateProfile = await this.getOrCreateCandidateProfile(userId);
    const sanitizedName = this.sanitizeFilename(originalName);

    // 1. Extract text and verify PDF signature
    const extractionResult = await PdfParserService.extractText(fileBuffer);

    // 2. Upload file via StorageService (Cloudinary in prod, local/test in dev/test)
    const storageResult = await StorageService.uploadFile({
      buffer: fileBuffer,
      originalName: sanitizedName,
      mimeType,
      candidateId: candidateProfile._id
    });

    // 3. Determine if this should be the default resume
    const existingCount = await Resume.countDocuments({ candidate: candidateProfile._id });
    const isDefault = existingCount === 0;

    // 4. Save Resume document
    const resume = await Resume.create({
      candidate: candidateProfile._id,
      originalFileName: sanitizedName,
      fileUrl: storageResult.fileUrl,
      storageProvider: storageResult.storageProvider,
      storagePublicId: storageResult.storagePublicId,
      fileType: mimeType,
      fileSize: storageResult.fileSize || fileSize,
      parsedText: extractionResult.text,
      status: 'ready',
      isDefault
    });

    // If default, record in candidate profile
    if (isDefault) {
      candidateProfile.defaultResumeId = resume._id;
      await candidateProfile.save();
    }

    // Return document without exposing parsedText
    const responseResume = resume.toObject();
    delete responseResume.parsedText;
    return responseResume;
  }

  /**
   * Candidate retrieves all their uploaded resumes
   */
  static async getCandidateResumes(userId) {
    const candidateProfile = await this.getOrCreateCandidateProfile(userId);

    const resumes = await Resume.find({ candidate: candidateProfile._id })
      .select('-parsedText')
      .sort({ isDefault: -1, createdAt: -1 });

    return resumes;
  }

  /**
   * Get single resume metadata with strict ownership check
   */
  static async getResumeById(userId, userRole, resumeId) {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      throw new AppError('Invalid resume ID format', 400);
    }

    const resume = await Resume.findById(resumeId).select('-parsedText');
    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Check ownership by role
    if (userRole === 'candidate') {
      const candidateProfile = await CandidateProfile.findOne({ user: userId });
      if (!candidateProfile || !resume.candidate.equals(candidateProfile._id)) {
        throw new AppError('Unauthorized: You can only view your own resumes', 403);
      }
    } else if (userRole === 'recruiter') {
      // Recruiter may only access resume if attached to an application for their job
      const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
      if (!recruiterProfile) {
        throw new AppError('Recruiter profile not found', 403);
      }

      const authorizedApp = await Application.findOne({ resume: resumeId }).populate({
        path: 'job',
        match: { recruiter: recruiterProfile._id }
      });

      if (!authorizedApp || !authorizedApp.job) {
        throw new AppError(
          'Unauthorized: You can only access resumes attached to applications for your job postings',
          403
        );
      }
    }

    return resume;
  }

  /**
   * Candidate selects a resume as their default/active resume
   */
  static async selectDefaultResume(userId, resumeId) {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      throw new AppError('Invalid resume ID format', 400);
    }

    const candidateProfile = await this.getOrCreateCandidateProfile(userId);
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    if (!resume.candidate.equals(candidateProfile._id)) {
      throw new AppError('Unauthorized: You can only select your own resume as default', 403);
    }

    // Atomically reset all candidate resumes to isDefault = false
    await Resume.updateMany({ candidate: candidateProfile._id }, { $set: { isDefault: false } });

    // Set target resume as default
    resume.isDefault = true;
    await resume.save();

    candidateProfile.defaultResumeId = resume._id;
    await candidateProfile.save();

    const responseResume = resume.toObject();
    delete responseResume.parsedText;
    return responseResume;
  }

  /**
   * Candidate deletes an unreferenced resume
   */
  static async deleteResume(userId, resumeId) {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      throw new AppError('Invalid resume ID format', 400);
    }

    const candidateProfile = await this.getOrCreateCandidateProfile(userId);
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    if (!resume.candidate.equals(candidateProfile._id)) {
      throw new AppError('Unauthorized: You can only delete your own resumes', 403);
    }

    // Safeguard: Do NOT delete if attached to existing applications
    const inUse = await Application.findOne({ resume: resumeId });
    if (inUse) {
      throw new AppError(
        'Cannot delete this resume because it is currently attached to one or more submitted job applications',
        400
      );
    }

    // Delete from storage provider
    await StorageService.deleteFile({
      storagePublicId: resume.storagePublicId,
      storageProvider: resume.storageProvider
    });

    // Delete database document
    await Resume.findByIdAndDelete(resumeId);

    // If deleted resume was default, assign default to another resume if present
    if (resume.isDefault) {
      const nextResume = await Resume.findOne({ candidate: candidateProfile._id });
      if (nextResume) {
        nextResume.isDefault = true;
        await nextResume.save();
        candidateProfile.defaultResumeId = nextResume._id;
      } else {
        candidateProfile.defaultResumeId = null;
      }
      await candidateProfile.save();
    }

    return { message: 'Resume deleted successfully' };
  }

  /**
   * Secure access / download of resume PDF buffer for authorized user
   */
  static async getResumeFileAccess(userId, userRole, resumeId) {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      throw new AppError('Invalid resume ID format', 400);
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Access authorization check
    if (userRole === 'candidate') {
      const candidateProfile = await CandidateProfile.findOne({ user: userId });
      if (!candidateProfile || !resume.candidate.equals(candidateProfile._id)) {
        throw new AppError('Unauthorized: You can only download your own resumes', 403);
      }
    } else if (userRole === 'recruiter') {
      const recruiterProfile = await RecruiterProfile.findOne({ user: userId });
      if (!recruiterProfile) {
        throw new AppError('Recruiter profile not found', 403);
      }

      const authorizedApp = await Application.findOne({ resume: resumeId }).populate({
        path: 'job',
        match: { recruiter: recruiterProfile._id }
      });

      if (!authorizedApp || !authorizedApp.job) {
        throw new AppError(
          'Unauthorized: You can only access resumes attached to applications for jobs you manage',
          403
        );
      }
    }

    const buffer = await StorageService.getFileBuffer({
      storagePublicId: resume.storagePublicId,
      storageProvider: resume.storageProvider,
      fileUrl: resume.fileUrl
    });

    return {
      buffer,
      originalFileName: resume.originalFileName,
      fileType: resume.fileType || 'application/pdf'
    };
  }
}
