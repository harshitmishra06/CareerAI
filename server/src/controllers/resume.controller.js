import { ResumeService } from '../services/resume.service.js';

export class ResumeController {
  /**
   * Candidate uploads a new resume PDF
   * POST /api/v1/resumes/upload
   */
  static async uploadResume(req, res, next) {
    try {
      const resume = await ResumeService.uploadResume(req.user._id, {
        fileBuffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      });

      res.status(201).json({
        success: true,
        message: 'Resume uploaded and processed successfully',
        data: resume
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate retrieves all their uploaded resumes
   * GET /api/v1/resumes
   */
  static async getMyResumes(req, res, next) {
    try {
      const resumes = await ResumeService.getCandidateResumes(req.user._id);

      res.status(200).json({
        success: true,
        data: resumes
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single resume metadata (Candidate owner or authorized hiring recruiter)
   * GET /api/v1/resumes/:id
   */
  static async getResumeById(req, res, next) {
    try {
      const resume = await ResumeService.getResumeById(req.user._id, req.user.role, req.params.id);

      res.status(200).json({
        success: true,
        data: resume
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate sets a resume as default
   * PATCH /api/v1/resumes/:id/default
   */
  static async selectDefaultResume(req, res, next) {
    try {
      const resume = await ResumeService.selectDefaultResume(req.user._id, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Default resume updated successfully',
        data: resume
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate deletes an unreferenced resume
   * DELETE /api/v1/resumes/:id
   */
  static async deleteResume(req, res, next) {
    try {
      const result = await ResumeService.deleteResume(req.user._id, req.params.id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Secure access / download of resume binary file
   * GET /api/v1/resumes/:id/file
   */
  static async downloadResumeFile(req, res, next) {
    try {
      const result = await ResumeService.getResumeFileAccess(req.user._id, req.user.role, req.params.id);

      res.setHeader('Content-Type', result.fileType || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(result.originalFileName || 'resume.pdf')}"`
      );
      res.setHeader('Content-Length', result.buffer.length);

      res.send(result.buffer);
    } catch (err) {
      next(err);
    }
  }
}
