import { ResumeAnalysisService } from '../services/resumeAnalysis.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class ResumeAnalysisController {
  /**
   * Candidate creates an AI resume analysis
   * POST /api/v1/resume-analyses
   */
  static async createAnalysis(req, res, next) {
    try {
      const { analysis, isExisting } = await ResumeAnalysisService.createAnalysis(req.user._id, req.body);

      const statusCode = isExisting ? 200 : 201;
      const message = isExisting
        ? 'Retrieved existing completed resume analysis'
        : 'Resume analysis completed successfully';

      return ApiResponse.success(res, statusCode, analysis, message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate views their past resume analyses
   * GET /api/v1/resume-analyses/me
   */
  static async getMyAnalyses(req, res, next) {
    try {
      const analyses = await ResumeAnalysisService.getMyAnalyses(req.user._id);
      return ApiResponse.success(res, 200, analyses, 'Resume analyses retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate retrieves single resume analysis details
   * GET /api/v1/resume-analyses/:id
   */
  static async getAnalysisById(req, res, next) {
    try {
      const analysis = await ResumeAnalysisService.getAnalysisById(req.user._id, req.params.id);
      return ApiResponse.success(res, 200, analysis, 'Resume analysis details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }
}
