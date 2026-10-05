import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    // Attempt standard connection to configured MONGODB_URI
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`📦 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (ENV.NODE_ENV !== 'production') {
      console.warn(`⚠️ Local MongoDB unreachable at ${ENV.MONGODB_URI}.`);
      console.log(`🚀 Initializing isolated in-memory Mongo server for development...`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`📦 Connected to development in-memory MongoDB: ${memUri}`);
        return conn;
      } catch (memError) {
        console.error('❌ Failed to launch development in-memory MongoDB:', memError.message);
        throw memError;
      }
    } else {
      console.error('❌ MongoDB connection error in production:', error.message);
      throw error;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('📦 MongoDB connection closed gracefully.');
  } catch (error) {
    console.error('Error during MongoDB disconnect:', error.message);
  }
};
