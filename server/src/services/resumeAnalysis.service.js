import mongoose from 'mongoose';
import { ResumeAnalysis, Resume, Job, CandidateProfile } from '../models/index.js';
import { AIService } from './ai/ai.service.js';
import { NotificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';

export class ResumeAnalysisService {
  /**
   * Helper: Get candidate profile for user
   */
  static async getCandidateProfile(userId) {
    const profile = await CandidateProfile.findOne({ user: userId });
    if (!profile) {
      throw new AppError('Candidate profile not found for this user', 404);
    }
    return profile;
  }

  /**
   * Candidate creates an AI analysis comparing their resume against a target job
   */
  static async createAnalysis(userId, { resumeId, jobId, providerOverride = null }) {
    if (!resumeId || !mongoose.Types.ObjectId.isValid(resumeId)) {
      throw new AppError('Valid Resume ID is required', 400);
    }

    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Valid Job ID is required', 400);
    }

    const candidateProfile = await this.getCandidateProfile(userId);

    // 1. Fetch resume with parsedText (which is excluded by default)
    const resume = await Resume.findById(resumeId).select('+parsedText');
    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // 2. Ownership verification: Resume must belong to candidate
    if (!resume.candidate.equals(candidateProfile._id)) {
      throw new AppError('Unauthorized: You can only analyze your own resumes', 403);
    }

    // 3. Status check: Resume must be ready
    if (!['ready', 'processed'].includes(resume.status)) {
      throw new AppError(
        `Resume is not ready for analysis (current status: '${resume.status}'). Status must be ready.`,
        400
      );
    }

    // 4. Content check: Parsed text must be present
    if (!resume.parsedText || !resume.parsedText.trim()) {
      throw new AppError('The selected resume does not contain extracted text content to analyze', 400);
    }

    // 5. Fetch job
    const job = await Job.findById(jobId).populate('company', 'name location industry logoUrl');
    if (!job) {
      throw new AppError('Job posting not found', 404);
    }

    // 6. Job visibility check: Only published jobs can be analyzed
    if (job.status !== 'published') {
      throw new AppError(
        `Only published jobs can be analyzed against resumes (current job status: '${job.status}')`,
        400
      );
    }

    // 7. Duplicate analysis check: Return existing completed analysis if one already exists
    const existingAnalysis = await ResumeAnalysis.findOne({
      candidate: candidateProfile._id,
      resume: resume._id,
      job: job._id,
      status: 'completed'
    })
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status createdAt isDefault'
      })
      .populate({
        path: 'job',
        select: 'title location workMode employmentType status salaryMin salaryMax salaryCurrency company',
        populate: { path: 'company', select: 'name logoUrl location industry' }
      });

    if (existingAnalysis) {
      return { analysis: existingAnalysis, isExisting: true };
    }

    // 8. Invoke AI Service
    const jobData = {
      title: job.title,
      description: job.description,
      skills: job.skills || [],
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      companyName: job.company?.name || ''
    };

    const aiResult = await AIService.analyzeResumeAgainstJob({
      resumeText: resume.parsedText,
      jobData,
      providerOverride
    });

    // 9. Persist ResumeAnalysis document
    const analysis = await ResumeAnalysis.create({
      candidate: candidateProfile._id,
      resume: resume._id,
      job: job._id,
      matchScore: aiResult.matchScore,
      matchedSkills: aiResult.matchedSkills,
      missingSkills: aiResult.missingSkills,
      recommendations: aiResult.recommendations,
      summary: aiResult.summary,
      status: 'completed',
      provider: aiResult.provider,
      model: aiResult.model
    });

    // 10. Populate references for safe return
    await analysis.populate([
      {
        path: 'resume',
        select: 'originalFileName fileSize fileType status createdAt isDefault'
      },
      {
        path: 'job',
        select: 'title location workMode employmentType status salaryMin salaryMax salaryCurrency company',
        populate: { path: 'company', select: 'name logoUrl location industry' }
      }
    ]);

    // Dispatch notification to candidate
    try {
      await NotificationService.createNotification({
        user: userId,
        type: 'RESUME_ANALYSIS_COMPLETED',
        title: 'AI Resume Analysis Complete',
        message: `Your resume analysis for "${job.title}" is ready with a match score of ${aiResult.matchScore}%.`,
        metadata: {
          analysisId: analysis._id,
          jobId: job._id,
          matchScore: aiResult.matchScore
        }
      });
    } catch (notifErr) {
      console.error('Notification dispatch failed for resume analysis:', notifErr.message);
    }

    return { analysis, isExisting: false };
  }

  /**
   * Candidate retrieves all their past resume analyses
   */
  static async getMyAnalyses(userId) {
    const candidateProfile = await this.getCandidateProfile(userId);

    const analyses = await ResumeAnalysis.find({ candidate: candidateProfile._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status createdAt isDefault'
      })
      .populate({
        path: 'job',
        select: 'title location workMode employmentType status company',
        populate: { path: 'company', select: 'name logoUrl' }
      });

    return analyses;
  }

  /**
   * Retrieve single analysis details with strict ownership verification
   */
  static async getAnalysisById(userId, analysisId) {
    if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
      throw new AppError('Invalid analysis ID format', 400);
    }

    const candidateProfile = await this.getCandidateProfile(userId);

    const analysis = await ResumeAnalysis.findById(analysisId)
      .populate({
        path: 'resume',
        select: 'originalFileName fileSize fileType status createdAt isDefault'
      })
      .populate({
        path: 'job',
        select: 'title description skills location workMode employmentType status salaryMin salaryMax salaryCurrency company',
        populate: { path: 'company', select: 'name logoUrl location industry website' }
      });

    if (!analysis) {
      throw new AppError('Resume analysis record not found', 404);
    }

    // Ownership check (IDOR protection)
    if (!analysis.candidate.equals(candidateProfile._id)) {
      throw new AppError('Unauthorized: You can only view your own resume analyses', 403);
    }

    return analysis;
  }
}
