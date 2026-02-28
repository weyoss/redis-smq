/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parentPort, workerData } from 'worker_threads';
import { RedisSMQ, TConsumerMessageHandler } from 'redis-smq';
import { async } from 'redis-smq-common';
import {
  EWorkerMessageType,
  IWorkerData,
  TWorkerMessage,
} from '../types/index.js';
import { HighResTimer } from '../helpers/timing.js';

const { queue, redisConfig, workerId, totalMessages, expectedMessages } =
  workerData as IWorkerData;

let consumedCount = 0;
let startTime = 0;
let lastMessageTime = 0;
let idleTimer: NodeJS.Timeout | null = null;
let isActive = true;

RedisSMQ.initialize(redisConfig, (err) => {
  if (err) throw err;
  const consumer = RedisSMQ.createConsumer();

  const complete = () => {
    if (!isActive) return;
    isActive = false;
    RedisSMQ.shutdown(() => {
      // Use lastMessageTime as the end time (time of last consumption)
      const timeTaken = lastMessageTime - startTime;

      const message: TWorkerMessage = {
        type: EWorkerMessageType.COMPLETED,
        data: {
          workerId,
          processed: consumedCount,
          timeTaken,
          expected: expectedMessages,
        },
      };
      parentPort?.postMessage(message);
    });
  };

  const checkIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);

    // If no message received for 5 seconds, consider queue empty
    idleTimer = setTimeout(complete, 5000);
  };

  async.series(
    [
      (cb) => consumer.run(cb),
      (cb) => {
        startTime = HighResTimer.now();
        lastMessageTime = startTime;

        const messageHandler: TConsumerMessageHandler = (msg, ack) => {
          // Update last message time on each consumption
          lastMessageTime = HighResTimer.now();

          // Reset idle timer on each message
          checkIdle();

          consumedCount++;
          ack();

          // Report progress every 20% of total messages
          if (
            totalMessages > 0 &&
            consumedCount % Math.max(1, Math.floor(totalMessages / 20)) === 0
          ) {
            const message: TWorkerMessage = {
              type: EWorkerMessageType.PROGRESS,
              data: { workerId, progress: consumedCount },
            };
            parentPort?.postMessage(message);
          }
        };

        consumer.consume(queue, messageHandler, (err) => {
          if (err) return cb(err);

          // if this consumer gets no messages, complete after a longer idle
          checkIdle();
        });
      },
    ],
    (err) => {
      if (err) {
        console.error(`Worker ${workerId} error:`, err);
        throw err;
      }
    },
  );
});
