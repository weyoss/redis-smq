/*
 * packages/redis-smq-common/tests/helpers/redis-server.ts
 */

import { RedisServer } from '../../src/redis-server/index.js';
import { redisConfig } from './config.js';

let redisServer: RedisServer | null = null;

export async function initializeRedis() {
  if (!redisServer) {
    redisServer = new RedisServer();
    const redisPort = await redisServer.start();
    redisConfig.options = {
      ...redisConfig,
      port: redisPort,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisServer) await redisServer.shutdown();
}
