import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/candidate
   * Candidate Dashboard statistics & overview
   */
  static async getCandidateDashboard(req, res, next) {
    try {
      const result = await DashboardService.getCandidateDashboard(req.user._id || req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/employer
   * Employer Dashboard statistics & overview
   */
  static async getEmployerDashboard(req, res, next) {
    try {
      const result = await DashboardService.getEmployerDashboard(req.user._id || req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/candidate/analytics
   * Detailed candidate application & AI analytics
   */
  static async getCandidateAnalytics(req, res, next) {
    try {
      const result = await DashboardService.getCandidateAnalytics(req.user._id || req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/employer/analytics
   * Detailed employer pipeline & job analytics
   */
  static async getEmployerAnalytics(req, res, next) {
    try {
      const result = await DashboardService.getEmployerAnalytics(req.user._id || req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export default DashboardController;
