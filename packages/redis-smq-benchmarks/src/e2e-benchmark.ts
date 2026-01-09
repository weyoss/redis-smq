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
  IWorkerCompleteMessage,
  TWorkerMessageHandler,
} from './types/index.js';
import { createWorker } from './helpers/create-worker.js';
import { Worker } from 'worker_threads';
import { HighResTimer } from './helpers/timing.js';
import { calculateBenchmarkResult } from './helpers/calculate-benchmark-result.js';

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
  const consumerWorkerResults: IWorkerCompleteMessage['data'][] = [];
  const producerWorkerResults: IWorkerCompleteMessage['data'][] = [];

  let completedProducers = 0;
  let completedConsumers = 0;

  const onProducerMessage: TWorkerMessageHandler = (msg) => {
    if (msg.type === EWorkerMessageType.COMPLETED) {
      completedProducers++;
      producerWorkerResults.push(msg.data);
      const { workerId, processed, timeTaken } = msg.data;

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
      consumerWorkerResults.push(msg.data);
      const { workerId, processed, timeTaken } = msg.data;

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
      console.log('\n========== E2E BENCHMARK COMPLETE ==========');
      const pResult = calculateBenchmarkResult(producerWorkerResults);
      const cResult = calculateBenchmarkResult(consumerWorkerResults);
      const result: IE2EBenchmarkResult = {
        totalTime: Math.max(pResult.totalTimeNs, cResult.totalTimeNs),
        totalMessages: pResult.totalMessages + cResult.totalMessages,
        workerCount: producerCount + consumerCount,
        productionTime: pResult.totalTimeNs,
        consumptionTime: cResult.totalTimeNs,
        messagesProduced: pResult.totalMessages,
        messagesConsumed: cResult.totalMessages,
        productionThroughput: pResult.throughput,
        consumptionThroughput: cResult.throughput,
      };

      console.log(`Production Phase:`);
      console.log(`  Total produced: ${result.messagesProduced}`);
      console.log(
        `  Production time: ${HighResTimer.format(result.productionTime)}`,
      );
      console.log(
        `  Production throughput: ${result.productionThroughput} msg/s`,
      );

      console.log(`\nConsumption Phase:`);
      console.log(`  Total consumed: ${result.messagesConsumed}`);
      console.log(
        `  Consumption time: ${HighResTimer.format(result.consumptionTime)}`,
      );
      console.log(
        `  Consumption throughput: ${result.consumptionThroughput} msg/s`,
      );

      console.log(`\nEnd-to-End:`);
      console.log(`  Total time: ${HighResTimer.format(result.totalTime)}`);
      console.log(
        `  Overall throughput: ${(result.messagesProduced / HighResTimer.toSeconds(result.totalTime)).toFixed(0)} msg/s`,
      );
      console.log(
        `  System backlog: ${result.messagesProduced - result.messagesConsumed} messages`,
      );

      if (result.messagesProduced === result.messagesConsumed) {
        console.log(`  Status: All messages processed successfully ✓`);
      } else {
        console.log(
          `  Status: ${result.messagesProduced - result.messagesConsumed} messages not consumed ⚠️`,
        );
      }
      console.log('============================================\n');

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
