import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const COOKIE_NAME = 'careerai_token';

/**
 * Generate a signed JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
};

/**
 * Verify a signed JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

/**
 * Determine cookie options based on deployment environment
 * SameSite=None strictly requires Secure=true (mandatory for cross-domain production deployment).
 * In development or testing, defaults to Lax and non-secure to allow local HTTP operation.
 */
export const getCookieOptions = () => {
  const isProduction = ENV.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const isCrossSite = (ENV.CLIENT_URL && ENV.CLIENT_URL.startsWith('https://')) || isProduction;
  const sameSite = ENV.COOKIE_SAME_SITE || (isCrossSite ? 'none' : 'lax');
  const secure = sameSite === 'none' ? true : isProduction;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: ENV.COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
  };
};

/**
 * Set HttpOnly Authentication Cookie
 */
export const sendAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

/**
 * Clear Authentication Cookie
 */
export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  res.clearCookie(COOKIE_NAME, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite
  });
};
