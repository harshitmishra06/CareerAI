import app from './app.js';
import { ENV, validateProductionConfig } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { StorageService } from './services/storage.service.js';

const PORT = ENV.PORT;

let server;

const startServer = async () => {
  try {
    // 0. Production Environment Safety Guards: Fail-fast if critical configuration is missing
    if (ENV.NODE_ENV === 'production') {
      validateProductionConfig();
      StorageService.validateProductionConfig();
    }

    // 1. Connect to Database
    await connectDB();

    // 2. Start HTTP listener
    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 CareerAI API Server running in [${ENV.NODE_ENV}] mode`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/v1/auth`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start CareerAI server:', error);
    process.exit(1);
  }
};

startServer();

// Process signal handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('Server process terminated gracefully.');
    });
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Performing graceful shutdown...');
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('Server process terminated gracefully.');
      process.exit(0);
    });
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down server gracefully...', err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err.message || err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
