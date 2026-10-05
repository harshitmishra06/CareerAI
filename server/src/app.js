import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { csrfProtection } from './middlewares/csrf.middleware.js';
import { AppError } from './utils/AppError.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import jobRoutes from './routes/job.routes.js';
import applicationRoutes from './routes/application.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import resumeAnalysisRoutes from './routes/resumeAnalysis.routes.js';
import jobMatchRoutes from './routes/jobMatch.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const app = express();

// Trust reverse proxy (mandatory for Render, Cloudflare, AWS, Heroku SSL termination & client IP resolution)
app.set('trust proxy', 1);

// Backward-compatibility URL rewrite: automatically routes /v1/api/* requests to /api/v1/*
app.use((req, res, next) => {
  if (req.url.startsWith('/v1/api')) {
    req.url = req.url.replace(/^\/v1\/api/, '/api/v1');
  }
  next();
});

// Security HTTP headers with clickjacking, MIME-sniffing, and resource protection
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by reverse proxy / frontend origin
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows client to consume file streams
    frameguard: { action: 'deny' }, // Clickjacking protection
    noSniff: true // MIME sniffing protection
  })
);

// CORS configuration with production origin guard
const allowedOrigins = [
  ENV.CLIENT_URL,
  ...(ENV.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] : [])
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError('The CORS policy does not allow access from this origin', 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 1. Global Rate Limiter for all API routes (300 requests / 15 min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => ENV.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  }
});
app.use('/api', globalLimiter);

// 2. Sensitive Authentication Rate Limiter (brute-force defense: 50 requests / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => ENV.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    }
  }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// 3. AI Endpoint Rate Limiter (protects Gemini API quota: 30 requests / 15 min)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => ENV.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many AI evaluation requests, please try again after 15 minutes'
    }
  }
});
app.use('/api/v1/resume-analyses', aiLimiter);

// Request parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(csrfProtection);

// HTTP request logger: non-sensitive production logging without credentials or body payload
if (ENV.NODE_ENV === 'production') {
  app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms'));
} else if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/resume-analyses', resumeAnalysisRoutes);
app.use('/api/v1/job-matches', jobMatchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 Handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`, 404));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
