import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from './config';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Using existing database connection');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || config.database?.mongoUri;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
      }

      await mongoose.connect(mongoUri);
      
      this.isConnected = true;
      logger.info('MongoDB connected successfully', {
        host: mongoose.connection.host,
        database: mongoose.connection.name
      });

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('MongoDB connection failed', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
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