const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;
let lastConnectionError = null;
let connectPromise = null;
let listenersAttached = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isDbReady = () => mongoose.connection.readyState === 1;

const waitForExistingConnection = (timeoutMs) =>
  new Promise((resolve, reject) => {
    if (isDbReady()) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for MongoDB connection'));
    }, timeoutMs);

    const onConnected = () => {
      cleanup();
      resolve();
    };

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      mongoose.connection.off('connected', onConnected);
      mongoose.connection.off('error', onError);
    };

    mongoose.connection.once('connected', onConnected);
    mongoose.connection.once('error', onError);
  });

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
    isConnected = false;
    lastConnectionError = error?.message || String(error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('connected', () => {
    isConnected = true;
    lastConnectionError = null;
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    isConnected = true;
    lastConnectionError = null;
  });

  process.once('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB disconnection:', error);
      process.exit(1);
    }
  });
};

const attemptConnect = async ({ quick = false } = {}) => {
  const mongoURI =
    process.env.NODE_ENV === 'test' ? process.env.MONGODB_URI_TEST : process.env.MONGODB_URI;

  if (!mongoURI) {
    logger.warn('MongoDB URI is not defined in environment variables');
    return false;
  }

  attachConnectionListeners();

  if (isDbReady()) {
    isConnected = true;
    return;
  }

  const maxAttempts = quick
    ? 1
    : parseInt(process.env.MONGO_CONNECT_RETRIES, 10) || 5;
  const serverSelectionTimeoutMS = quick
    ? parseInt(process.env.MONGO_QUICK_SELECTION_TIMEOUT_MS, 10) || 5000
    : parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 10000;

  const options = {
    maxPoolSize: 5,
    serverSelectionTimeoutMS,
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) || 20000,
    connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) || 10000,
    bufferCommands: false,
  };

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (isDbReady()) {
        isConnected = true;
        return;
      }

      if (mongoose.connection.readyState === 2) {
        await waitForExistingConnection(serverSelectionTimeoutMS);
        isConnected = true;
        return;
      }

      logger.info(`Attempting MongoDB connection (attempt ${attempt}/${maxAttempts})`);
      await mongoose.connect(mongoURI, options);
      isConnected = true;
      logger.info(
        `MongoDB connected successfully to ${mongoURI.split('@')[1] || mongoURI.split('//')[1]}`
      );
      return;
    } catch (error) {
      lastError = error;
      lastConnectionError = error?.message || String(error);
      if (attempt >= maxAttempts) break;

      const backoffMs = Math.min(15000, 500 * 2 ** (attempt - 1));
      logger.warn(
        `MongoDB connection attempt ${attempt} failed: ${error.message}. Retrying in ${backoffMs}ms`
      );
      await sleep(backoffMs);
    }
  }

  isConnected = false;
  throw lastError;
};

const connectDB = async (options = {}) => {
  if (isDbReady()) {
    isConnected = true;
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = attemptConnect(options).finally(() => {
    connectPromise = null;
  });

  return connectPromise;
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
    isConnected: isDbReady() || isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'Not connected',
    port: mongoose.connection.port || 'Not connected',
    name: mongoose.connection.name || 'Not connected',
    hasMongoURI: !!process.env.MONGODB_URI,
    lastError: lastConnectionError,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  isDbReady,
};
