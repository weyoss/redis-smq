/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parentPort, workerData } from 'worker_threads';
import { ProducibleMessage, RedisSMQ } from 'redis-smq';
import { async } from 'redis-smq-common';
import {
  EWorkerMessageType,
  IWorkerData,
  TWorkerMessage,
} from '../types/index.js';
import { HighResTimer } from '../helpers/timing.js';

const { queue, redisConfig, workerId, expectedMessages } =
  workerData as IWorkerData;

let producedCount = 0;
let startTime = 0;

RedisSMQ.initialize(redisConfig, (err) => {
  if (err) throw err;
  const producer = RedisSMQ.createProducer();

  async.series(
    [
      (cb) => producer.run(cb),
      (cb) => {
        startTime = HighResTimer.now();
        const pump = () => {
          if (producedCount < expectedMessages) {
            producedCount++;
            const msg = new ProducibleMessage()
              .setQueue(queue)
              .setBody(`m${producedCount}`);
            producer.produce(msg, (perr) => {
              if (perr) return cb(perr);
              pump();
            });
          }

          // Stop consuming after reaching expected message count
          else if (producedCount >= expectedMessages) {
            const timeTaken = HighResTimer.now() - startTime;
            const message: TWorkerMessage = {
              type: EWorkerMessageType.COMPLETED,
              data: {
                workerId,
                processed: producedCount,
                timeTaken,
                expected: expectedMessages,
              },
            };
            parentPort?.postMessage(message);
            return cb();
          }

          //
          else cb();
        };
        pump();
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
