import { getRedisInstance } from './redis';
import { logger } from 'redis-smq-common';
import { Configuration } from '../../src/config/configuration';
import { config } from './config';
import { Message } from '../../src/lib/message/message';

export async function startUp(): Promise<void> {
  Configuration.reset();
  Configuration.getSetConfig(config);
  Message.setDefaultConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
  logger.reset();
  logger.setLogger(console);
}
