#!/usr/bin/env node

/*
 * Starts a Redis server and the RedisSMQ REST API on random ports,
 * writes the resolved URL to .env.local so Vite picks it up.
 *
 * Standalone use:
 *   node scripts/run-api-server.js
 *
 * Normal use: spawned by scripts/dev.js (see package.json "dev").
 */

import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient, net, RedisServer } from 'redis-smq-common';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve('.env.local');

const config = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 0 },
  },
  apiServer: {
    port: 0,
    hostname: '127.0.0.1',
    basePath: '/',
  },
};

const redisServer = new RedisServer();
const redisPort = await redisServer.start();
config.redis.options.port = redisPort;
console.log(`[api] Redis running on port ${redisPort}`);

const httpPort = await net.getRandomPort();
config.apiServer.port = httpPort;

const server = new RedisSMQRestApi(config);
await server.run();

const apiUrl = `http://${config.apiServer.hostname}:${httpPort}/`;
console.log(`[api] REST API running at ${apiUrl}`);

// Write .env.local so Vite can read it at startup.
// Only VITE_-prefixed vars are exposed to the client, but REDIS_PORT
// is useful for ad-hoc debugging (e.g. `redis-cli -p <port>`).
let envContent = '';
if (fs.existsSync(envPath)) envContent = fs.readFileSync(envPath, 'utf8');

const upsert = (content, key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(content)
    ? content.replace(re, line)
    : `${content}${content.endsWith('\n') || content === '' ? '' : '\n'}${line}\n`;
};

envContent = upsert(envContent, 'VITE_API_URL', apiUrl);
envContent = upsert(envContent, 'REDIS_PORT', redisPort);
fs.writeFileSync(envPath, envContent);
console.log(`[api] Wrote ${envPath}`);

async function shutdown() {
  console.log('[api] Shutting down...');
  try {
    await server.shutdown();
  } catch {
    /* ignore */
  }
  try {
    await redisServer.shutdown();
  } catch {
    /* ignore */
  }
  process.exit(0);
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('uncaughtException', (err) => {
  console.error('[api] Uncaught exception:', err);
  shutdown();
});
process.once('unhandledRejection', (reason) => {
  console.error('[api] Unhandled rejection:', reason);
  shutdown();
});
