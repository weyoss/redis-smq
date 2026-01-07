/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parentPort, workerData } from 'worker_threads';
import { RedisSMQ } from 'redis-smq';
import { async } from 'redis-smq-common';
import { EWorkerMessageType, IWorkerData } from '../types/index.js';

const { queue, redisConfig, workerId, expectedMessages } =
  workerData as IWorkerData;

let consumedCount = 0;
let startTime = 0;

RedisSMQ.initialize(redisConfig, (err) => {
  if (err) throw err;
  const consumer = RedisSMQ.createConsumer();

  async.series(
    [
      (cb) => consumer.run(cb),
      (cb) => {
        startTime = Date.now();
        consumer.consume(
          queue,
          (_msg, ack) => {
            consumedCount++;
            ack();

            // Report progress every 10% of expected messages
            if (
              expectedMessages > 0 &&
              consumedCount % Math.max(1, Math.floor(expectedMessages / 10)) ===
                0
            ) {
              parentPort?.postMessage({
                type: EWorkerMessageType.PROGRESS,
                data: { workerId, processed: consumedCount },
              });
            }

            // Stop consuming after reaching expected message count
            if (expectedMessages > 0 && consumedCount >= expectedMessages) {
              const timeTaken = Date.now() - startTime;
              consumer.cancel(queue, (err) => {
                if (err) {
                  console.error(
                    `Worker ${workerId} error cancelling consumer:`,
                    err,
                  );
                  return cb(err);
                }
                parentPort?.postMessage({
                  type: EWorkerMessageType.COMPLETED,
                  data: {
                    workerId,
                    processed: consumedCount,
                    timeTaken,
                    expected: expectedMessages,
                  },
                });
                cb();
              });
            }
          },
          (err) => {
            if (err) cb(err);
          },
        );
      },
    ],
    (err) => {
      if (err) {
        console.error(`Worker ${workerId} error:`, err);
        throw err;
      }
      RedisSMQ.shutdown(() => void 0);
    },
  );
});
