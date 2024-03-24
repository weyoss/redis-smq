/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { IRedisSMQConfigRequired } from '../../../config/index.js';
import { _cleanupOfflineConsumer } from '../consumer-heartbeat/_/_cleanup-offline-consumer.js';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { processingQueue } from '../message-handler/processing-queue.js';
import { EConsumeMessageUnacknowledgedCause } from '../types/index.js';
import { Worker } from './worker.js';

class WatchConsumersWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    ConsumerHeartbeat.getExpiredHeartbeatIds(
      redisClient,
      0,
      10,
      (err, reply) => {
        if (err) cb(err);
        else {
          if (reply?.length) {
            async.waterfall(
              [
                (cb: ICallback<void>) => {
                  processingQueue.handleProcessingQueue(
                    redisClient,
                    reply,
                    [],
                    this.logger,
                    EConsumeMessageUnacknowledgedCause.OFFLINE_CONSUMER,
                    (err) => cb(err),
                  );
                },
                (cb: ICallback<void>) => {
                  _cleanupOfflineConsumer(redisClient, reply, cb);
                },
              ],
              cb,
            );
          } else cb();
        }
      },
    );
  };
}

export default (config: IRedisSMQConfigRequired) =>
  new WatchConsumersWorker(config);
