/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  logger,
} from 'redis-smq-common';
import { RedisClientInstance } from '../../common/redis-client/redis-client-instance.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { _parseQueueParamsAndValidate } from '../queue/_/_parse-queue-params-and-validate.js';
import {
  EQueueProperty,
  IQueueParams,
  IQueueRateLimit,
  Queue,
} from '../queue/index.js';
import { _hasRateLimitExceeded } from './_/_has-rate-limit-exceeded.js';
import {
  QueueRateLimitInvalidLimitError,
  QueueRateLimitInvalidIntervalError,
} from './errors/index.js';

export class QueueRateLimit {
  protected redisClient;
  protected logger;
  protected queue;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue-rate-limit`,
    );
    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
    this.queue = new Queue();
  }

  clear(queue: string | IQueueParams, cb: ICallback<void>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) cb(err);
          else if (!queueParams) cb(new CallbackEmptyReplyError());
          else {
            const { keyQueueProperties, keyQueueRateLimitCounter } =
              redisKeys.getQueueKeys(queueParams, null);
            const multi = client.multi();
            multi.hdel(keyQueueProperties, String(EQueueProperty.RATE_LIMIT));
            multi.del(keyQueueRateLimitCounter);
            multi.exec((err) => cb(err));
          }
        });
    });
  }

  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) cb(err);
          else if (!queueParams) cb(new CallbackEmptyReplyError());
          else {
            // validating rateLimit params from a javascript client
            const limit = Number(rateLimit.limit);
            if (isNaN(limit) || limit <= 0) {
              cb(new QueueRateLimitInvalidLimitError());
            }
            const interval = Number(rateLimit.interval);
            if (isNaN(interval) || interval < 1000) {
              cb(new QueueRateLimitInvalidIntervalError());
            }
            const validatedRateLimit: IQueueRateLimit = { interval, limit };
            const { keyQueueProperties } = redisKeys.getQueueKeys(
              queueParams,
              null,
            );
            client.hset(
              keyQueueProperties,
              String(EQueueProperty.RATE_LIMIT),
              JSON.stringify(validatedRateLimit),
              (err) => cb(err),
            );
          }
        });
    });
  }

  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) cb(err);
          else if (!queueParams) cb(new CallbackEmptyReplyError());
          else _hasRateLimitExceeded(client, queueParams, rateLimit, cb);
        });
    });
  }

  get(
    queue: string | IQueueParams,
    cb: ICallback<IQueueRateLimit | null>,
  ): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) cb(err);
          else if (!queueParams) cb(new CallbackEmptyReplyError());
          else {
            const { keyQueueProperties } = redisKeys.getQueueKeys(
              queueParams,
              null,
            );
            client.hget(
              keyQueueProperties,
              String(EQueueProperty.RATE_LIMIT),
              (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(null, null);
                else {
                  const rateLimit: IQueueRateLimit = JSON.parse(reply);
                  cb(null, rateLimit);
                }
              },
            );
          }
        });
    });
  }

  shutdown = (cb: ICallback<void>): void => {
    async.waterfall([this.queue.shutdown, this.redisClient.shutdown], cb);
  };
}
