import { getRedisInstance } from './redis';
import { logger } from 'redis-smq-common';

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  logger.reset();
  logger.setLogger(console);
}
