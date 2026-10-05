import multer from 'multer';
import path from 'path';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// Configure in-memory storage for PDF processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (ext !== '.pdf' && mimeType !== 'application/pdf') {
    return cb(new AppError('Only PDF documents (.pdf) are allowed', 400), false);
  }

  cb(null, true);
};

const maxSizeBytes = (ENV.MAX_FILE_SIZE_MB || 5) * 1024 * 1024;

const upload = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
    files: 1
  },
  fileFilter
}).single('resume');

/**
 * Express middleware wrapper with normalized error handling
 */
export const uploadResumeMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(`File size exceeds the ${ENV.MAX_FILE_SIZE_MB || 5}MB upload limit. Please upload a smaller PDF.`, 400)
        );
      }
      return next(new AppError(`Upload error: ${err.message}`, 400));
    } else if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No resume file provided. Please attach a PDF file under the "resume" field.', 400));
    }

    next();
  });
};
