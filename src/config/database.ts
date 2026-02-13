import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from './config';

class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    // Check Mongoose's actual connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
    if (mongoose.connection.readyState === 1) {
      logger.info('Using existing database connection');
      return;
    }

    if (mongoose.connection.readyState === 2) {
      logger.info('Database connection in progress, waiting...');
      // Wait for the existing connection attempt to complete
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || config.database?.mongoUri;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
      }

      logger.info('Connecting to MongoDB...');

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000,
      });
      
      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        database: mongoose.connection.name
      });

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

    } catch (error) {
      logger.error('MongoDB connection failed', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('MongoDB disconnection failed', { error });
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }
}

export const database = Database.getInstance();