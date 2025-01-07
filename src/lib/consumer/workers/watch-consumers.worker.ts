/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { consumerQueues } from '../consumer-queues.js';
import { processingQueue } from '../message-handler/processing-queue/processing-queue.js';
import {
  EMessageUnknowledgmentReason,
  IConsumerMessageHandlerWorkerPayload,
} from '../types/index.js';
import { Worker } from './worker.js';

class WatchConsumersWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    consumerQueues.getQueueConsumerIds(
      redisClient,
      this.queueParsedParams.queueParams,
      (err, consumerIds) => {
        if (err) cb(err);
        else {
          async.eachOf(
            consumerIds ?? [],
            (consumerId, _, done) => {
              ConsumerHeartbeat.isConsumerAlive(
                redisClient,
                consumerId,
                (err, alive) => {
                  if (err) done(err);
                  else if (!alive) {
                    processingQueue.unknowledgeMessage(
                      redisClient,
                      consumerId,
                      [this.queueParsedParams.queueParams],
                      this.logger,
                      EMessageUnknowledgmentReason.OFFLINE_CONSUMER,
                      (err) => done(err),
                    );
                  } else done();
                },
              );
            },
            (err) => cb(err),
          );
        }
      },
    );
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new WatchConsumersWorker(payload);
