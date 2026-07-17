/**
 * Seed data for env vault (moved out of admin Docs client bundle).
 * Secret values that were previously hardcoded in docs are included so they
 * can be managed securely after OTP unlock. Prefer rotating any exposed secrets.
 */
const ENV_VAULT_SEED = [
  // Frontend
  {
    scope: 'frontend',
    key: 'NEXT_PUBLIC_API_URL',
    value: 'https://newton-botics-server-phi.vercel.app/api',
    isSecret: false,
  },
  {
    scope: 'frontend',
    key: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    value: 'dp6dncpvi',
    isSecret: false,
  },
  {
    scope: 'frontend',
    key: 'NEXT_PUBLIC_CLOUDINARY_API_KEY',
    value: '893416931771931',
    isSecret: false,
  },
  {
    scope: 'frontend',
    key: 'CLOUDINARY_API_SECRET',
    value: 'cDdkroRUgCdrWhymggo_yVHPL8g',
    isSecret: true,
  },
  {
    scope: 'frontend',
    key: 'MIGRATION_SECRET',
    value: 'choose-a-strong-secret',
    isSecret: true,
  },
  {
    scope: 'frontend',
    key: 'NEXT_PUBLIC_MIGRATION_SECRET',
    value: 'choose-a-strong-secret',
    isSecret: true,
  },

  // Backend
  { scope: 'backend', key: 'NODE_ENV', value: 'development', isSecret: false },
  { scope: 'backend', key: 'PORT', value: '3005', isSecret: false },
  { scope: 'backend', key: 'HOST', value: 'localhost', isSecret: false },
  { scope: 'backend', key: 'JWT_SECRET', value: 'change-this-strong-secret', isSecret: true },
  { scope: 'backend', key: 'JWT_EXPIRES_IN', value: '24h', isSecret: false },
  { scope: 'backend', key: 'JWT_REFRESH_EXPIRES_IN', value: '7d', isSecret: false },
  { scope: 'backend', key: 'REDIS_ENABLED', value: 'false', isSecret: false },
  {
    scope: 'backend',
    key: 'CORS_ORIGIN',
    value:
      'http://localhost:3000,http://localhost:3003,http://localhost:3005,http://localhost:3002,http://localhost:3001',
    isSecret: false,
  },
  { scope: 'backend', key: 'LOG_LEVEL', value: 'info', isSecret: false },
  { scope: 'backend', key: 'BCRYPT_ROUNDS', value: '12', isSecret: false },
  { scope: 'backend', key: 'RATE_LIMIT_WINDOW_MS', value: '900000', isSecret: false },
  { scope: 'backend', key: 'RATE_LIMIT_MAX_REQUESTS', value: '100', isSecret: false },
  { scope: 'backend', key: 'AUTH_RATE_LIMIT_WINDOW_MS', value: '900000', isSecret: false },
  { scope: 'backend', key: 'AUTH_RATE_LIMIT_MAX_REQUESTS', value: '5', isSecret: false },
  { scope: 'backend', key: 'AUTH_RATE_LIMIT_RETRY_AFTER', value: '15', isSecret: false },
  { scope: 'backend', key: 'DISABLE_AUTH_RATE_LIMIT', value: 'false', isSecret: false },
  { scope: 'backend', key: 'SMTP_HOST', value: 'smtp.gmail.com', isSecret: false },
  { scope: 'backend', key: 'SMTP_PORT', value: '587', isSecret: false },
  { scope: 'backend', key: 'SMTP_SECURE', value: 'false', isSecret: false },
  {
    scope: 'backend',
    key: 'SMTP_USER',
    value: 'robotics.club@rishihood.edu.in',
    isSecret: false,
  },
  { scope: 'backend', key: 'SMTP_PASS', value: 'kfup fmue dzjf fxln', isSecret: true },
  {
    scope: 'backend',
    key: 'EMAIL_FROM',
    value: 'robotics.club@rishihood.edu.in',
    isSecret: false,
  },
  { scope: 'backend', key: 'APP_BASE_URL', value: 'http://localhost:3000', isSecret: false },
  {
    scope: 'backend',
    key: 'ADMIN_NOTIFY_EMAIL',
    value: 'admin@newtonbotics.com',
    isSecret: false,
  },
  {
    scope: 'backend',
    key: 'MONGODB_URI',
    value:
      'mongodb+srv://robotics:PasswordRoboticsLab@newtonroboticslab.u5sgpmb.mongodb.net/?retryWrites=true&w=majority&appName=NewtonRoboticsLab',
    isSecret: true,
  },

  // Admin panel
  {
    scope: 'admin',
    key: 'NEXT_PUBLIC_BACKEND_URL',
    value: 'https://newton-botics-servers-chi.vercel.app',
    isSecret: false,
  },
  {
    scope: 'admin',
    key: 'BACKEND_URL',
    value: 'https://newton-botics-servers-chi.vercel.app',
    isSecret: false,
  },
  {
    scope: 'admin',
    key: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    value: 'dp6dncpvi',
    isSecret: false,
  },
  {
    scope: 'admin',
    key: 'NEXT_PUBLIC_CLOUDINARY_API_KEY',
    value: '893416931771931',
    isSecret: false,
  },
  {
    scope: 'admin',
    key: 'CLOUDINARY_API_SECRET',
    value: 'cDdkroRUgCdrWhymggo_yVHPL8g',
    isSecret: true,
  },
  {
    scope: 'admin',
    key: 'MIGRATION_SECRET',
    value: 'choose-a-strong-secret',
    isSecret: true,
  },
  {
    scope: 'admin',
    key: 'NEXT_PUBLIC_MIGRATION_SECRET',
    value: 'choose-a-strong-secret',
    isSecret: true,
  },
];

module.exports = { ENV_VAULT_SEED };
