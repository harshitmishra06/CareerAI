import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { sendAuthCookie, clearAuthCookie } from '../utils/token.js';

export class AuthController {
  /**
   * Handle user registration
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const { user, token } = await AuthService.register(req.body);

      // Attach secure HttpOnly cookie
      sendAuthCookie(res, token);

      return ApiResponse.success(res, 201, { user, token }, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user login
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);

      // Attach secure HttpOnly cookie
      sendAuthCookie(res, token);

      return ApiResponse.success(res, 200, { user, token }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle retrieving currently authenticated user profile
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user._id);
      return ApiResponse.success(res, 200, { user }, 'Current user profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle user logout
   * POST /api/v1/auth/logout
   */
  static async logout(req, res) {
    clearAuthCookie(res);
    return ApiResponse.success(res, 200, null, 'Logged out successfully');
  }
}

export default AuthController;
