const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS) || 20000,
      connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
      bufferCommands: false, // Disable buffering for serverless
    };

    const maxAttempts = parseInt(process.env.MONGO_CONNECT_RETRIES) || 5;
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        logger.info(`Attempting MongoDB connection (attempt ${attempt}/${maxAttempts})`);
        await mongoose.connect(mongoURI, options);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const backoffMs = Math.min(15000, 500 * 2 ** (attempt - 1));
        logger.warn(`MongoDB connection attempt ${attempt} failed: ${error.message}. Retrying in ${backoffMs}ms`);
        await sleep(backoffMs);
      }
    }

    if (lastError) {
      throw lastError;
    }

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
