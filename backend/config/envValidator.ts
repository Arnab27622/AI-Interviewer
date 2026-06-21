/**
 * @file src/config/envValidator.ts
 * @description Validates required environment variables at boot time.
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI',
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'INTERNAL_API_KEY',
];

export const validateEnv = (): void => {
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Server is shutting down. Please update your .env file.');
    process.exit(1);
  }

  console.log('[INFO] Environment variables validated successfully.');
};
