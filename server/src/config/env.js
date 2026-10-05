import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  CLIENT_URL: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/careerai',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_token_secret',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  COOKIE_EXPIRES_IN_DAYS: parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '7', 10),
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  ADMIN_NAME: process.env.ADMIN_NAME || 'CareerAI Platform Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@careerai.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@CareerAI2026!',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10)
};

/**
 * Validate critical environment configuration for production deployment
 * Fails fast if required production secrets or parameters are missing.
 * Does NOT expose sensitive secret values in exception messages.
 */
export const validateProductionConfig = () => {
  if (ENV.NODE_ENV !== 'production') return true;

  const missing = [];
  if (!ENV.JWT_SECRET || ENV.JWT_SECRET === 'dev_jwt_secret') {
    missing.push('JWT_SECRET (must not use default development secret)');
  }
  if (!ENV.MONGODB_URI) {
    missing.push('MONGODB_URI');
  }
  if (!ENV.CLIENT_URL) {
    missing.push('CLIENT_URL');
  }
  if (ENV.AI_PROVIDER === 'gemini' && (!ENV.GEMINI_API_KEY || !ENV.GEMINI_API_KEY.trim())) {
    missing.push('GEMINI_API_KEY (required when AI_PROVIDER is gemini)');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Production Environment Error] Critical variables missing or insecure:\n  - ${missing.join('\n  - ')}`
    );
  }

  return true;
};

