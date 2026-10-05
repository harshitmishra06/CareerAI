import { JobService } from '../services/job.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class JobController {
  /**
   * POST /api/v1/jobs/recruiter
   * Recruiter creates a new job
   */
  static async create(req, res, next) {
    try {
      const job = await JobService.createJob(req.user._id, req.body);
      return ApiResponse.success(res, 201, job, 'Job created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/recruiter/me
   * Recruiter retrieves own jobs with pagination & status filters
   */
  static async getRecruiterJobs(req, res, next) {
    try {
      const { jobs, meta } = await JobService.getRecruiterJobs(req.user._id, req.query);
      return ApiResponse.success(res, 200, jobs, 'Recruiter jobs retrieved', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/recruiter/:id
   * Recruiter retrieves own job details
   */
  static async getRecruiterJobById(req, res, next) {
    try {
      const job = await JobService.getRecruiterJobById(req.user._id, req.params.id);
      return ApiResponse.success(res, 200, job, 'Job details retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/jobs/recruiter/:id
   * Recruiter updates own job
   */
  static async updateRecruiterJob(req, res, next) {
    try {
      const job = await JobService.updateRecruiterJob(req.user._id, req.params.id, req.body);
      return ApiResponse.success(res, 200, job, 'Job updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/jobs/recruiter/:id/status
   * Recruiter transitions job status (publish/close/draft)
   */
  static async updateJobStatus(req, res, next) {
    try {
      const job = await JobService.updateJobStatus(req.user._id, req.params.id, req.body.status);
      return ApiResponse.success(res, 200, job, `Job status updated to ${job.status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs
   * Public/Candidate browsing of published jobs with search, filters & pagination
   */
  static async getPublicJobs(req, res, next) {
    try {
      const { jobs, meta } = await JobService.getPublicJobs(req.query);
      return ApiResponse.success(res, 200, jobs, 'Published jobs retrieved', meta);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/jobs/:id
   * Public/Candidate view of a single published job
   */
  static async getPublicJobById(req, res, next) {
    try {
      const job = await JobService.getPublicJobById(req.params.id);
      return ApiResponse.success(res, 200, job, 'Job details retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export default JobController;
