import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isDbConnected = mongoose.connection.readyState === 1;

  const healthData = {
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    platform: 'CareerAI API Engine',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStateMap[mongoose.connection.readyState] || 'unknown'
    }
  };

  const statusCode = isDbConnected ? 200 : 503;
  return ApiResponse.success(res, statusCode, healthData, 'CareerAI Backend is operational');
});

export default router;
