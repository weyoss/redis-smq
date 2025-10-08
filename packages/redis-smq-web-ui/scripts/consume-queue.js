#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer, Configuration } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';

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
function configure() {
  const redisConfig = {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
  };

  Configuration.getSetConfig({ redis: redisConfig });
  console.log(
    `Redis configured: ${redisConfig.options.host}:${redisConfig.options.port}`,
  );

  return redisConfig;
}

/**
 * Start the consumer
 * @param {Consumer} consumer - Consumer instance
 * @param {Object} consumeQueue - Queue configuration for consuming
 */
function startConsumer(consumer, consumeQueue) {
  return new Promise((resolve, reject) => {
    consumer.run((err) => {
      if (err) {
        console.error('Failed to start consumer:', err);
        reject(err);
        return;
      }

      console.log(
        `Consumer started - consuming from ${consumeQueue.ns}:${consumeQueue.name}`,
      );

      resolve();
    });
  });
}

/**
 * Shutdown consumer with promise wrapper
 * @param {Consumer} consumer - Consumer instance
 * @returns {Promise} Promise that resolves when shutdown is complete
 */
function shutdownConsumer(consumer) {
  return new Promise((resolve, reject) => {
    consumer.shutdown((err) => {
      if (err) {
        console.error('Error during consumer shutdown:', err);
        reject(err);
      } else {
        console.log('Consumer shutdown completed');
        resolve();
      }
    });
  });
}

/**
 * Create graceful shutdown handler
 * @param {Consumer} consumer - Consumer instance
 * @returns {Function} Shutdown function
 */
function createShutdownHandler(consumer) {
  let isShuttingDown = false;

  return async () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log('\nInitiating graceful shutdown...');

    try {
      await shutdownConsumer(consumer);
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
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
 * Initialize application components
 * @param {Object} options - Command line options
 * @returns {Object} Initialized components
 */
function initializeComponents(options) {
  // Load environment configuration
  loadEnvironment(options.env);

  // Configure
  configure();

  // Parse queue configuration
  const consumeQueue = parseQueue(options.queue);

  // Initialize consumer
  const consumer = new Consumer();
  consumer.consume(
    consumeQueue,
    (msg, cb) => cb(),
    (err) => {
      if (err) console.log(err);
    },
  );

  return {
    consumer,
    consumeQueue,
  };
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

    // Initialize components
    const { consumer, consumeQueue } = initializeComponents(options);

    // Create and setup shutdown handler
    const shutdownHandler = createShutdownHandler(consumer);
    setupSignalHandlers(shutdownHandler);

    // Start the consumer
    await startConsumer(consumer, consumeQueue);
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
