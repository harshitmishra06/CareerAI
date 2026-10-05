import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/resumes');

// In-memory buffer map for test environment
const testStorageMap = new Map();

/**
 * Storage Service Abstraction
 * Handles file storage operations across environments (test, development, production)
 * with strict production safety guards ensuring Cloudinary is mandatory in production
 * and NEVER falls back silently to local storage.
 */
export class StorageService {
  /**
   * Validate production storage configuration
   * Enforces that Cloudinary credentials are present in production.
   * Throws AppError(..., 500, 'STORAGE_CONFIG_ERROR') if missing.
   */
  static validateProductionConfig() {
    const isCloudinaryConfigured = Boolean(
      ENV.CLOUDINARY_CLOUD_NAME &&
      ENV.CLOUDINARY_API_KEY &&
      ENV.CLOUDINARY_API_SECRET
    );

    if (!isCloudinaryConfigured) {
      throw new AppError(
        'Production storage configuration error: Cloudinary is mandatory in production environment. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured. Local filesystem fallback is strictly forbidden in production.',
        500,
        null,
        'STORAGE_CONFIG_ERROR'
      );
    }
    return true;
  }

  /**
   * Determine storage provider with environment-level guardrails
   */
  static getStorageProvider(overrideEnv = null) {
    const currentEnv = overrideEnv || ENV.NODE_ENV;

    // 1. Test Environment: uses isolated in-memory storage adapter
    if (currentEnv === 'test') {
      return 'test';
    }

    // 2. Production Environment: Cloudinary is strictly mandatory
    if (currentEnv === 'production') {
      this.validateProductionConfig();
      return 'cloudinary';
    }

    // 3. Development Environment: Cloudinary preferred if configured, local fallback permitted for dev convenience
    if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
      return 'cloudinary';
    }

    return 'local';
  }

  /**
   * Configure Cloudinary instance if credentials exist
   */
  static configureCloudinary() {
    if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
        api_key: ENV.CLOUDINARY_API_KEY,
        api_secret: ENV.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
  }

  /**
   * Upload file buffer to appropriate storage provider
   */
  static async uploadFile({ buffer, originalName, mimeType = 'application/pdf', candidateId, overrideEnv = null }) {
    const provider = this.getStorageProvider(overrideEnv);
    const uniqueKey = `resumes/resume_${candidateId || 'anon'}_${crypto.randomUUID()}`;

    // --- Provider: Test Mock Storage ---
    if (provider === 'test') {
      testStorageMap.set(uniqueKey, {
        buffer,
        originalName,
        mimeType,
        size: buffer.length
      });

      return {
        fileUrl: `http://localhost:${ENV.PORT}/api/v1/resumes/mock/${uniqueKey}.pdf`,
        storagePublicId: uniqueKey,
        storageProvider: 'test',
        fileSize: buffer.length
      };
    }

    // --- Provider: Cloudinary Storage (Mandatory in production) ---
    if (provider === 'cloudinary') {
      this.configureCloudinary();

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            access_mode: 'public',
            public_id: uniqueKey,
            folder: 'careerai/resumes',
            format: 'pdf'
          },
          (error, result) => {
            if (error) {
              // Critical rule: DO NOT catch and fall back to local storage in production!
              return reject(
                new AppError(
                  `Cloudinary upload failed: ${error.message || 'Unknown storage error'}`,
                  502,
                  null,
                  'CLOUD_STORAGE_ERROR'
                )
              );
            }

            resolve({
              fileUrl: result.secure_url,
              storagePublicId: result.public_id,
              storageProvider: 'cloudinary',
              fileSize: result.bytes || buffer.length
            });
          }
        );

        uploadStream.end(buffer);
      });
    }

    // --- Provider: Local Filesystem Storage (Allowed ONLY in development) ---
    if (provider === 'local') {
      if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
        fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
      }

      const safeFilename = `resume_${candidateId || 'anon'}_${crypto.randomUUID()}.pdf`;
      const filePath = path.join(LOCAL_UPLOADS_DIR, safeFilename);

      await fs.promises.writeFile(filePath, buffer);

      return {
        fileUrl: `/uploads/resumes/${safeFilename}`,
        storagePublicId: safeFilename,
        storageProvider: 'local',
        fileSize: buffer.length
      };
    }

    throw new AppError(`Unsupported storage provider: ${provider}`, 500);
  }

  /**
   * Delete file from storage provider
   */
  static async deleteFile({ storagePublicId, storageProvider }) {
    // 1. Test Mock Storage
    if (storageProvider === 'test' || testStorageMap.has(storagePublicId)) {
      testStorageMap.delete(storagePublicId);
      return true;
    }

    // 2. Cloudinary Storage
    if (storageProvider === 'cloudinary') {
      this.configureCloudinary();
      try {
        const result = await cloudinary.uploader.destroy(storagePublicId, { resource_type: 'raw' });
        return result.result === 'ok' || result.result === 'not found';
      } catch (err) {
        throw new AppError(`Cloudinary file deletion failed: ${err.message}`, 502);
      }
    }

    // 3. Local Filesystem Storage
    if (storageProvider === 'local') {
      const sanitizedName = path.basename(storagePublicId);
      const filePath = path.join(LOCAL_UPLOADS_DIR, sanitizedName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    }

    return false;
  }

  /**
   * Retrieve file buffer for secure owner/recruiter download
   */
  static async getFileBuffer({ storagePublicId, storageProvider, fileUrl }) {
    // 1. Test Mock Storage
    if (storageProvider === 'test' || testStorageMap.has(storagePublicId)) {
      const item = testStorageMap.get(storagePublicId);
      if (item) {
        return item.buffer;
      }
    }

    // 2. Cloudinary Storage
    if (storageProvider === 'cloudinary') {
      this.configureCloudinary();
      try {
        let targetUrl = fileUrl;
        if (storagePublicId && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
          try {
            targetUrl = cloudinary.utils.private_download_url(storagePublicId, 'pdf', {
              resource_type: 'raw'
            });
          } catch {
            targetUrl = fileUrl;
          }
        }

        let response = await fetch(targetUrl);
        if (!response.ok && targetUrl !== fileUrl) {
          response = await fetch(fileUrl);
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (err) {
        throw new AppError(`Could not retrieve resume from cloud storage: ${err.message}`, 502);
      }
    }

    // 3. Local Filesystem Storage
    if (storageProvider === 'local') {
      const sanitizedName = path.basename(storagePublicId);
      const filePath = path.join(LOCAL_UPLOADS_DIR, sanitizedName);
      if (!fs.existsSync(filePath)) {
        throw new AppError('Resume file not found on local storage', 404);
      }
      return await fs.promises.readFile(filePath);
    }

    throw new AppError(`Unable to access resume with provider '${storageProvider}'`, 500);
  }

  /**
   * Clear test in-memory storage (helper for automated test suites)
   */
  static clearTestStorage() {
    testStorageMap.clear();
  }
}
