import { User } from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ name, email, password, role }) {
    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Create user (password will be automatically hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'candidate'
    });

    const safeUser = user.toSafeObject();
    const token = generateToken({ id: user._id, role: user.role });

    return { user: safeUser, token };
  }

  /**
   * Authenticate user credentials
   */
  static async login({ email, password }) {
    // Explicitly select password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const safeUser = user.toSafeObject();
    const token = generateToken({ id: user._id, role: user.role });

    return { user: safeUser, token };
  }

  /**
   * Fetch current user profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found.', 404);
    }
    return user.toSafeObject();
  }
}

export default AuthService;
