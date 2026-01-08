/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ensureQueue } from './helpers/ensure-queue.js';
import { async, ICallback } from 'redis-smq-common';
import {
  EWorkerMessageType,
  IE2EBenchmarkConfig,
  IE2EBenchmarkResult,
  TWorkerMessageHandler,
} from './types/index.js';
import { createWorker } from './helpers/create-worker.js';
import { Worker } from 'worker_threads';
import { HighResTimer } from './helpers/timing.js';

/**
 * RedisSMQ Benchmark: End-to-End Throughput with N producers and M consumers.
 *
 * Steps:
 * 1) Main thread ensures a FIFO queue exists.
 * 2) Main thread spawns PRODUCER_COUNT worker threads to produce messages.
 * 3) Main thread spawns CONSUMER_COUNT worker threads to consume messages.
 * 4) All workers run concurrently, simulating real-world load.
 * 5) Main thread measures total time until all messages are produced and consumed.
 * 6) Results include production throughput, consumption throughput, and end-to-end latency.
 */

export function runE2EBenchmark(
  config: IE2EBenchmarkConfig,
  cb: ICallback<IE2EBenchmarkResult>,
) {
  const {
    redisConfig,
    queue,
    totalMessages,
    producerWorkerPath,
    consumerWorkerPath,
    producerCount,
    consumerCount,
    showProgress,
  } = config;

  console.log('Starting end-to-end throughput benchmark...');
  console.log(
    `Queue: ${queue.ns}/${queue.name} | Messages: ${totalMessages} | Producers: ${producerCount} | Consumers: ${consumerCount}`,
  );

  const allWorkers: Worker[] = [];

  let completedProducers = 0;
  let completedConsumers = 0;
  let totalProduced = 0;
  let totalConsumed = 0;
  let totalProductionTime = 0;
  let totalConsumptionTime = 0;

  let productionStartTime = 0;
  let consumptionStartTime = 0;
  let productionEndTime = 0;
  let consumptionEndTime = 0;

  let benchmarkStartTime = 0;
  let benchmarkEndTime = 0;

  const onProducerMessage: TWorkerMessageHandler = (msg) => {
    if (msg.type === EWorkerMessageType.COMPLETED) {
      completedProducers++;
      const { workerId, processed, timeTaken } = msg.data;
      totalProduced += Number(processed);
      totalProductionTime += Number(timeTaken);
      productionEndTime = HighResTimer.now();

      console.log(
        `Producer ${workerId} completed: ${processed} messages in ${HighResTimer.format(timeTaken)} (${(processed / HighResTimer.toSeconds(timeTaken)).toFixed(0)} msg/s)`,
      );

      checkBenchmarkCompletion();
    } else if (msg.type === EWorkerMessageType.PROGRESS && showProgress) {
      const { workerId, progress } = msg.data;
      console.log(`Producer ${workerId} progress: ${progress} messages`);
    }
  };

  const onConsumerMessage: TWorkerMessageHandler = (msg) => {
    if (msg.type === EWorkerMessageType.COMPLETED) {
      completedConsumers++;
      const { workerId, processed, timeTaken } = msg.data;
      totalConsumed += Number(processed);
      totalConsumptionTime += Number(timeTaken);
      consumptionEndTime = HighResTimer.now();

      console.log(
        `Consumer ${workerId} completed: ${processed} messages in ${HighResTimer.format(timeTaken)} (${(processed / HighResTimer.toSeconds(timeTaken)).toFixed(0)} msg/s)`,
      );

      checkBenchmarkCompletion();
    } else if (msg.type === EWorkerMessageType.PROGRESS && showProgress) {
      const { workerId, progress } = msg.data;
      console.log(`Consumer ${workerId} progress: ${progress} messages`);
    }
  };

  const checkBenchmarkCompletion = () => {
    // Wait for both producers and consumers to complete
    if (
      completedProducers === producerCount &&
      completedConsumers === consumerCount
    ) {
      benchmarkEndTime = HighResTimer.now();
      const totalTime = benchmarkEndTime - benchmarkStartTime;

      const productionTime = productionEndTime - productionStartTime;
      const consumptionTime = consumptionEndTime - consumptionStartTime;

      const productionThroughput =
        totalProduced / HighResTimer.toSeconds(productionTime);
      const consumptionThroughput =
        totalConsumed / HighResTimer.toSeconds(consumptionTime);

      console.log('\n========== E2E BENCHMARK COMPLETE ==========');
      console.log(`Production Phase:`);
      console.log(`  Total produced: ${totalProduced}`);
      console.log(`  Production time: ${HighResTimer.format(productionTime)}`);
      console.log(
        `  Production throughput: ${productionThroughput.toFixed(0)} msg/s`,
      );

      console.log(`\nConsumption Phase:`);
      console.log(`  Total consumed: ${totalConsumed}`);
      console.log(
        `  Consumption time: ${HighResTimer.format(consumptionTime)}`,
      );
      console.log(
        `  Consumption throughput: ${consumptionThroughput.toFixed(0)} msg/s`,
      );

      console.log(`\nEnd-to-End:`);
      console.log(`  Total time: ${HighResTimer.format(totalTime)}`);
      console.log(
        `  Overall throughput: ${(totalProduced / HighResTimer.toSeconds(totalTime)).toFixed(0)} msg/s`,
      );
      console.log(
        `  System backlog: ${totalProduced - totalConsumed} messages`,
      );

      if (totalProduced === totalConsumed) {
        console.log(`  Status: All messages processed successfully ✓`);
      } else {
        console.log(
          `  Status: ${totalProduced - totalConsumed} messages not consumed ⚠️`,
        );
      }
      console.log('============================================\n');

      // Calculate final result
      const result: IE2EBenchmarkResult = {
        totalTime,
        totalWorkerTime: totalProductionTime + totalConsumptionTime,
        total: totalProduced + totalConsumed,
        workerCount: producerCount + consumerCount,
        productionTime,
        consumptionTime,
        messagesProduced: totalProduced,
        messagesConsumed: totalConsumed,
        productionThroughput,
        consumptionThroughput,
      };

      // Shutdown all workers
      const shutdownPromises = Promise.all(
        allWorkers.map((worker) => {
          worker.removeAllListeners();
          return worker.terminate();
        }),
      );
      shutdownPromises.catch(() => void 0).finally(() => cb(null, result));
    }
  };

  async.series(
    [
      (cb) => ensureQueue(queue, cb),
      (cb) => {
        console.log('Setting up producers and consumers...');

        // Calculate message distribution
        const messagesPerProducer = Math.floor(totalMessages / producerCount);
        const remainingProducers = totalMessages % producerCount;

        const messagesPerConsumer = Math.floor(totalMessages / consumerCount);
        const remainingConsumers = totalMessages % consumerCount;

        console.log(`Messages per producer (approx): ${messagesPerProducer}`);
        console.log(`Messages per consumer (approx): ${messagesPerConsumer}`);

        benchmarkStartTime = HighResTimer.now();
        productionStartTime = HighResTimer.now();
        consumptionStartTime = HighResTimer.now();

        try {
          // Create producers
          for (let i = 0; i < producerCount; i++) {
            let producerMessageCount = messagesPerProducer;
            if (i < remainingProducers) {
              producerMessageCount += 1;
            }

            console.log(
              `Producer ${i + 1} will produce ${producerMessageCount} messages`,
            );

            const producer = createWorker({
              workerPath: producerWorkerPath,
              workerId: i,
              expectedMessages: producerMessageCount,
              redisConfig,
              queue,
              onMessage: onProducerMessage,
            });

            allWorkers.push(producer);
          }

          // Create consumers
          for (let i = 0; i < consumerCount; i++) {
            let consumerMessageCount = messagesPerConsumer;
            if (i < remainingConsumers) {
              consumerMessageCount += 1;
            }

            console.log(
              `Consumer ${i + 1} will consume ${consumerMessageCount} messages`,
            );

            const consumer = createWorker({
              workerPath: consumerWorkerPath,
              workerId: i,
              expectedMessages: consumerMessageCount,
              redisConfig,
              queue,
              onMessage: onConsumerMessage,
            });

            allWorkers.push(consumer);
          }

          cb();
        } catch (err: unknown) {
          cb(err instanceof Error ? err : new Error(String(err)));
        }
      },
    ],
    (err) => {
      if (err) {
        console.error('Benchmark setup failed:', err);
        // Cleanup on error
        Promise.all(allWorkers.map((worker) => worker.terminate())).finally(
          () => cb(err),
        );
      }
    },
  );
}
