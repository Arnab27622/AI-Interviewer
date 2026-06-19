import Redis from 'ioredis';
if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') && !process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required in production/staging environments.");
}

// Create a Redis instance. By default, it will connect to localhost:6379.
// If REDIS_URL is provided, it connects to the specified URL.
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

const handleShutdown = async () => {
  console.log('Shutting down Redis client...');
  await redisClient.quit();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

export default redisClient;
