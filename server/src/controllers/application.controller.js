import { ApplicationService } from '../services/application.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class ApplicationController {
  /**
   * Candidate submits job application
   */
  static async apply(req, res, next) {
    try {
      const application = await ApplicationService.applyToJob(req.user._id, req.body);
      return ApiResponse.success(res, 201, application, 'Application submitted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate views their own applications
   */
  static async getMyApplications(req, res, next) {
    try {
      const result = await ApplicationService.getCandidateApplications(req.user._id, req.query);
      return ApiResponse.success(res, 200, result.data, 'Applications retrieved successfully', result.meta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * View single application details (Candidate or Recruiter for own job)
   */
  static async getApplicationById(req, res, next) {
    try {
      const application = await ApplicationService.getApplicationDetails(
        req.user._id,
        req.user.role,
        req.params.id
      );
      return ApiResponse.success(res, 200, application, 'Application details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Candidate withdraws their application
   */
  static async withdraw(req, res, next) {
    try {
      const application = await ApplicationService.withdrawApplication(req.user._id, req.params.id);
      return ApiResponse.success(res, 200, application, 'Application withdrawn successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Recruiter views applications for their job
   */
  static async getJobApplications(req, res, next) {
    try {
      const result = await ApplicationService.getJobApplicationsForRecruiter(
        req.user._id,
        req.user.role,
        req.params.jobId,
        req.query
      );
      return ApiResponse.success(res, 200, result.data, 'Job applications retrieved successfully', result.meta);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Recruiter updates application status
   */
  static async updateStatus(req, res, next) {
    try {
      const application = await ApplicationService.updateApplicationStatus(
        req.user._id,
        req.user.role,
        req.params.id,
        req.body.status
      );
      return ApiResponse.success(res, 200, application, 'Application status updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
