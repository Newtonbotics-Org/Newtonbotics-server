const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_URI_TEST 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      logger.warn('MongoDB URI is not defined in environment variables');
      return false;
    }

    const options = {
      maxPoolSize: 5, // Reduced for serverless
      serverSelectionTimeoutMS: 3000, // Faster timeout for Vercel
      socketTimeoutMS: 10000, // Reduced timeout
      connectTimeoutMS: 3000, // Connection timeout
      bufferCommands: false, // Disable buffering for serverless
      bufferMaxEntries: 0, // Disable buffering
    };

    await mongoose.connect(mongoURI, options);

    isConnected = true;
    logger.info(`MongoDB connected successfully to ${mongoURI.split('@')[1] || mongoURI.split('//')[1]}`);

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error during MongoDB disconnection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isConnected = false;
      logger.info('MongoDB disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'Not connected',
    port: mongoose.connection.port || 'Not connected',
    name: mongoose.connection.name || 'Not connected',
    hasMongoURI: !!process.env.MONGODB_URI,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
};
