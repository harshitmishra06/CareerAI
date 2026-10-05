import { JobMatchingService } from '../services/jobMatching/jobMatching.service.js';

export class JobMatchController {
  /**
   * GET /api/v1/job-matches
   * Retrieve personalized job matches for the authenticated candidate
   */
  static async getJobMatches(req, res, next) {
    try {
      const result = await JobMatchingService.getCandidateJobMatches(req.user.id, req.query);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/job-matches/:jobId
   * Retrieve compatibility match details for a specific published job
   */
  static async getJobMatchDetails(req, res, next) {
    try {
      const result = await JobMatchingService.getJobMatchDetails(req.user.id, req.params.jobId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default JobMatchController;
