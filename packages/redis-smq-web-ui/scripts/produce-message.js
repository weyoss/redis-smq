#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ, ProducibleMessage } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import bluebird from 'bluebird';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

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
 * Parse message content from string
 * @param {string} messageInput - Raw message input
 * @returns {*} Parsed message content
 */
function parseMessageContent(messageInput) {
  if (!messageInput) {
    throw new Error('Message content is required');
  }
  return messageInput;
}

/**
 * Create a producible message
 * @param {Object} queue - Queue configuration
 * @param {*} messageContent - Message content
 * @param {number|null} delay - Delay in milliseconds
 * @param {number|null} ttl - Time to live in milliseconds
 * @returns {ProducibleMessage} Configured message
 */
function createMessage(queue, messageContent, delay, ttl) {
  const msg = new ProducibleMessage();

  msg.setQueue(queue).setBody(messageContent);

  if (delay && delay > 0) {
    msg.setScheduledDelay(delay);
    console.log(`Message scheduled with delay: ${delay}ms`);
  }

  if (ttl && ttl > 0) {
    msg.setTTL(ttl);
    console.log(`Message TTL set to: ${ttl}ms`);
  }

  return msg;
}

/**
 * Produce a single message
 * @param {Producer} producer - Producer instance
 * @param {ProducibleMessage} message - Message to produce
 * @returns {Promise<string[]>} Promise resolving to message IDs
 */
function produceMessage(producer, message) {
  return new Promise((resolve, reject) => {
    producer.produce(message, (err, ids) => {
      if (err) {
        reject(err);
      } else {
        resolve(ids);
      }
    });
  });
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed command line options and arguments
 */
function parseArguments() {
  const program = new Command();

  program
    .name('produce-message')
    .description('Produce messages to a RedisSMQ queue')
    .argument('<message>', 'Message content (string or JSON)')
    .option('-e, --env <file>', 'Environment file path', './.env')
    .requiredOption(
      '-q, --queue <ns:name>',
      'Queue to produce messages to (format: namespace:name)',
    )
    .option(
      '-c, --count <number>',
      'Number of messages to produce',
      (value) => parseInt(value, 10),
      1,
    )
    .option(
      '-d, --delay <milliseconds>',
      'Delay before message processing (milliseconds)',
      (value) => parseInt(value, 10),
    )
    .option(
      '-t, --ttl <milliseconds>',
      'Time to live for messages (milliseconds)',
      (value) => parseInt(value, 10),
    )
    .parse();

  return {
    message: program.args[0],
    ...program.opts(),
  };
}

/**
 * Validate command line options
 * @param {Object} options - Parsed command line options
 */
function validateOptions(options) {
  if (!options.message) {
    throw new Error('Message content is required');
  }

  if (options.count < 1) {
    throw new Error('Count must be a positive integer');
  }

  if (options.delay && options.delay < 0) {
    throw new Error('Delay must be a non-negative integer');
  }

  if (options.ttl && options.ttl < 0) {
    throw new Error('TTL must be a non-negative integer');
  }
}

/**
 * Main application entry point
 */
async function main() {
  // Parse command line arguments
  const options = parseArguments();

  // Validate options
  validateOptions(options);

  // Load environment configuration
  loadEnvironment(options.env);

  // Configure Redis connection
  await configure();

  // Parse queue configuration
  const queue = parseQueue(options.queue);

  // Parse message content
  const messageContent = parseMessageContent(options.message);

  // Initialize producer
  const producer = bluebird.promisifyAll(RedisSMQAsync.createProducer());
  await producer.runAsync();

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting message production...`);
    console.log(`Queue: ${queue.ns}:${queue.name}`);
    console.log(`Message count: ${options.count}`);
    console.log(`Message content:`, messageContent);

    // Produce messages
    const message = await createMessage(
      queue,
      messageContent,
      options.delay,
      options.ttl,
    );

    const allIds = await produceMessage(producer, message);

    const completedTimestamp = new Date().toISOString();
    console.log(`[${completedTimestamp}] Production completed successfully!`);
    console.log(`Message produced.`);
    console.log(`Returned IDs: ${allIds.join(', ')}`);
  } catch (error) {
    console.error('Production failed:', error);
    process.exit(1);
  } finally {
    // Always cleanup producer
    try {
      await RedisSMQAsync.shutdownAsync();
    } catch {
      // ignoring errors
    }
  }
}

// Start the application
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
