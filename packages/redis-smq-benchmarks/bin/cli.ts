#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import {
  redisConfig,
  shutdownRedisServer,
  startRedisServer,
} from '../src/common/redis-server.js';
import {
  async,
  EConsoleLoggerLevel,
  env,
  ERedisConfigClient,
  IRedisConfig,
} from 'redis-smq-common';
import { ConsumerBenchmark } from '../src/consumer-benchmark.js';
import { ProducerBenchmark } from '../src/producer-benchmark.js';
import { runE2EBenchmark } from '../src/e2e-benchmark.js';
import { IBenchmarkConfig, IE2EBenchmarkConfig } from '../src/types/index.js';
import path from 'node:path';

//
const __dirname = env.getCurrentDir();
const consumerWorkerPath = path.resolve(
  __dirname,
  `../src/threads/consumer-worker-thread.js`,
);
const producerWorkerPath = path.resolve(
  __dirname,
  `../src/threads/producer-worker-thread.js`,
);

//
const ns = 'benchmarking';
const name = `queue-${Date.now()}`;
const totalMessages = Number(process.env.BENCH_MESSAGES || 100000);
const consumerCount = Math.min(
  Infinity,
  Number(process.env.BENCH_CONSUMERS || 0),
);
const producerCount = Math.min(
  Infinity,
  Number(process.env.BENCH_PRODUCERS || 0),
);
const showProgress = process.env.BENCH_SHOW_PROGRESS === '1';

// Check if running in development mode
const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.env.BENCH_ENV === 'development';

// Redis configuration
let useRedisConfig: IRedisConfig = redisConfig;
if (!isDevelopment) {
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = process.env.REDIS_PORT || '6379';
  const redisDB = process.env.REDIS_DB || '0';
  useRedisConfig = {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: redisHost,
      port: parseInt(redisPort, 10),
      db: parseInt(redisDB, 10),
    },
  };
}

if (!consumerCount && !producerCount) {
  console.log(`No benchmark type provided. Exiting...`);
  process.exit(0);
}

async.series(
  [
    // Start Redis server only in development mode
    (cb) => {
      if (isDevelopment) {
        // After starting the local Redis server redisConfig.options.port will be updated
        startRedisServer()
          .then(() => cb())
          .catch(cb);
      } else {
        cb(); // Skip Redis server start in package mode
      }
    },
    (cb) => {
      RedisSMQ.initializeWithConfig(
        {
          redis: useRedisConfig,
          eventBus: { enabled: false },
          logger: {
            enabled: false,
            options: { logLevel: EConsoleLoggerLevel.DEBUG },
          },
        },
        cb,
      );
    },
    (cb) => {
      if (!consumerCount || producerCount) return cb();

      const config: IBenchmarkConfig = {
        redisConfig: useRedisConfig,
        queue: { ns, name },
        totalMessages,
        workerCount: consumerCount,
        workerPath: consumerWorkerPath,
        workerLabel: 'Consumer',
        showProgress,
      };
      const benchmark = new ConsumerBenchmark(config);
      benchmark.run(cb);
    },
    (cb) => {
      if (!producerCount || consumerCount) return cb();

      const config: IBenchmarkConfig = {
        redisConfig: useRedisConfig,
        queue: { ns, name },
        totalMessages,
        workerCount: producerCount,
        workerPath: producerWorkerPath,
        workerLabel: 'Producer',
        showProgress,
      };
      const benchmark = new ProducerBenchmark(config);
      benchmark.run(cb);
    },
    (cb) => {
      if (!consumerCount || !producerCount) return cb();

      const config: IE2EBenchmarkConfig = {
        redisConfig: useRedisConfig,
        queue: { ns, name },
        totalMessages,
        consumerCount,
        producerCount,
        producerWorkerPath,
        consumerWorkerPath,
        showProgress,
      };
      runE2EBenchmark(config, cb);
    },
    (cb) => {
      RedisSMQ.shutdown(cb);
    },
    // Shutdown Redis server only in development mode
    (cb) => {
      if (isDevelopment) {
        shutdownRedisServer()
          .then(() => cb())
          .catch(() => cb());
      } else {
        cb();
      }
    },
  ],
  (err) => {
    if (err) throw err;
    process.exit(0);
  },
);
