#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQRestApi } from 'redis-smq-rest-api';
import { ERedisConfigClient, net, RedisServer } from 'redis-smq-common';
import fs from 'fs';
import path from 'path';
import { RedisSMQ } from 'redis-smq';
import bluebird from 'bluebird';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

// Define the run directory path
const envFilePath = path.resolve('./.env');

export const config = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 0,
    },
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
console.log(`Redis server is running on port ${redisPort}`);

const httpPort = await net.getRandomPort();
config.apiServer.port = httpPort;

await RedisSMQAsync.initializeWithConfigAsync(config);
await RedisSMQAsync.shutdownAsync();

// Pass the config to the RedisSmqRestApi constructor
const server = new RedisSMQRestApi(config);
await server.run();
console.log(
  `API server is running at http://${config.apiServer.hostname}:${httpPort}${config.apiServer.basePath}`,
);

// Generate API URL
const apiUrl = `http://${config.apiServer.hostname}:${httpPort}${config.apiServer.basePath}`;

// Write API URL to .env file
let envContent = '';
if (fs.existsSync(envFilePath)) {
  envContent = fs.readFileSync(envFilePath, 'utf8');
}

// Check if VITE_API_URL already exists in the .env file
const r1 = /^VITE_API_URL=.*/m;
if (r1.test(envContent)) {
  // Replace existing VITE_API_URL
  envContent = envContent.replace(r1, `VITE_API_URL=${apiUrl}`);
} else {
  // Add VITE_API_URL to the end of the file
  envContent += `\nVITE_API_URL=${apiUrl}`;
}

// Check if REDIS_PORT already exists in the .env file
const r2 = /^REDIS_PORT=.*/m;
if (r2.test(envContent)) {
  // Replace existing REDIS_PORT
  envContent = envContent.replace(r2, `REDIS_PORT=${redisPort}`);
} else {
  // Add VITE_API_URL to the end of the file
  envContent += `\nREDIS_PORT=${redisPort}`;
}

fs.writeFileSync(envFilePath, envContent);
console.log(`API URL written to ${envFilePath} as VITE_API_URL`);

// Setup shutdown handler
async function shutdown() {
  console.log('Shutting down services...');

  // Stop the API server if it's running
  try {
    console.log('Stopping API server...');
    await server.shutdown();
  } catch {
    //  Ignore errors
  }

  try {
    // Stop the Redis server
    console.log('Stopping Redis server...');
    await redisServer.shutdown();
  } catch {
    //  Ignore errors
  }

  console.log('All services stopped successfully');
  process.exit(0);
}

// Register shutdown handlers
process.once('SIGINT', () => {
  console.log('SIGINT received');
  shutdown();
});
process.once('SIGTERM', () => {
  console.log('SIGTERM received');
  shutdown();
});
process.once('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown();
});
process.once('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown();
});
