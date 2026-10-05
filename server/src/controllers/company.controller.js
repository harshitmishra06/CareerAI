import { CompanyService } from '../services/company.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class CompanyController {
  /**
   * POST /api/v1/companies
   * Recruiter creates company
   */
  static async create(req, res, next) {
    try {
      const company = await CompanyService.createCompany(req.user._id, req.body);
      return ApiResponse.success(res, 201, company, 'Company profile created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/companies/me
   * Recruiter retrieves own company
   */
  static async getMe(req, res, next) {
    try {
      const company = await CompanyService.getMyCompany(req.user._id);
      return ApiResponse.success(res, 200, company, 'Company profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/companies/me
   * Recruiter updates own company
   */
  static async updateMe(req, res, next) {
    try {
      const company = await CompanyService.updateMyCompany(req.user._id, req.body);
      return ApiResponse.success(res, 200, company, 'Company profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/companies/:id
   * Public retrieval of company details
   */
  static async getById(req, res, next) {
    try {
      const company = await CompanyService.getCompanyById(req.params.id);
      return ApiResponse.success(res, 200, company, 'Company retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default CompanyController;
