/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerHeartbeat } from '../lib/consumer/consumer-heartbeat';
import { ICallback, ILogger, RedisClient, Worker } from 'redis-smq-common';
import { EConsumeMessageUnacknowledgedCause } from '../../types';
import { processingQueue } from '../lib/consumer/message-handler/processing-queue';

export class WatchConsumersWorker extends Worker {
  protected redisClient: RedisClient;
  protected logger: ILogger;

  constructor(redisClient: RedisClient, managed: boolean, logger: ILogger) {
    super(managed);
    this.redisClient = redisClient;
    this.logger = logger;
  }

  work = (cb: ICallback<void>): void => {
    ConsumerHeartbeat.getExpiredHeartbeatIds(
      this.redisClient,
      0,
      10,
      (err, reply) => {
        if (err) cb(err);
        else {
          processingQueue.handleProcessingQueue(
            this.redisClient,
            reply ?? [],
            [],
            this.logger,
            EConsumeMessageUnacknowledgedCause.OFFLINE_CONSUMER,
            (err) => cb(err),
          );
        }
      },
    );
  };
}

export default WatchConsumersWorker;
