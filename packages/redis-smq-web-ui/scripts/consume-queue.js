#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import bluebird from 'bluebird';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

/**
 * Create graceful shutdown handler
 * @returns {Function} Shutdown function
 */
function createShutdownHandler() {
  let isShuttingDown = false;

  return async () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log('\nInitiating graceful shutdown...');

    try {
      await RedisSMQAsync.shutdownAsync();
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
}

/**
 * Parse queue string into namespace and name components
 * @param {string} queueString - Queue string in format "namespace:name"
 * @returns {{ns: string, name: string}} Parsed queue object
 */
function parseQueue(queueString) {
  if (!queueString || typeof queueString !== 'string') {
    throw new Error('Queue string is required and must be a string');
  }

  const parts = queueString.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid queue format: ${queueString}. Expected format: namespace:name`,
    );
  }

  return { ns: parts[0], name: parts[1] };
}

/**
 * Load environment configuration
 * @param {string} envPath - Path to environment file
 */
function loadEnvironment(envPath) {
  const resolvedPath = path.resolve(envPath);
  dotenv.config({ path: resolvedPath });
  console.log(`Environment loaded from: ${resolvedPath}`);
}

/**
 * Configure RedisSMQ connection
 */
async function configure() {
  const redisConfig = {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
  };

  await RedisSMQAsync.initializeAsync(redisConfig);
  console.log(
    `Redis configured: ${redisConfig.options.host}:${redisConfig.options.port}`,
  );

  return redisConfig;
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed command line options
 */
function parseArguments() {
  const program = new Command();

  program
    .name('consume-queue')
    .description('Start a RedisSMQ consumer')
    .option('-e, --env <file>', 'Environment file path', './.env')
    .requiredOption(
      '-q, --queue <ns:name>',
      'Queue to consume messages from (format: namespace:name)',
    )
    .parse();

  return program.opts();
}

/**
 * Setup signal handlers for graceful shutdown
 * @param {Function} shutdownHandler - Shutdown handler function
 */
function setupSignalHandlers(shutdownHandler) {
  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);
}

/**
 * Main application entry point
 */
async function main() {
  try {
    // Parse command line arguments
    const options = parseArguments();

    // Load environment configuration
    loadEnvironment(options.env);

    // Configure
    await configure();

    // Parse queue configuration
    const consumeQueue = parseQueue(options.queue);

    // Initialize consumer
    const consumer = bluebird.promisifyAll(RedisSMQAsync.createConsumer());
    await consumer.runAsync();
    await consumer.consumeAsync(consumeQueue, (msg, cb) => cb());
    console.log(
      `Consumer started - consuming from ${consumeQueue.ns}:${consumeQueue.name}`,
    );

    const shutdownHandler = createShutdownHandler();
    setupSignalHandlers(shutdownHandler);
  } catch (error) {
    console.error('Application startup failed:', error.message);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
