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
import { EWorkerMessageType, IWorkerData } from '../types/index.js';

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
        startTime = Date.now();
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
            const timeTaken = Date.now() - startTime;
            parentPort?.postMessage({
              type: EWorkerMessageType.COMPLETED,
              data: {
                workerId,
                processed: producedCount,
                timeTaken,
                expected: expectedMessages,
              },
            });
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
