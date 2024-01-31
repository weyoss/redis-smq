/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueProperty,
  IQueueParams,
  IQueueRateLimit,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueRateLimitError } from '../errors';
import { Queue } from '../queue/queue';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _parseQueueParams } from '../queue/_parse-queue-params';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _hasRateLimitExceeded } from './_has-rate-limit-exceeded';

export class QueueRateLimit {
  protected queue: Queue;

  constructor() {
    this.queue = new Queue();
  }

  clear(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyQueueProperties, keyQueueRateLimitCounter } =
            redisKeys.getQueueKeys(queueParams, null);
          const multi = client.multi();
          multi.hdel(keyQueueProperties, String(EQueueProperty.RATE_LIMIT));
          multi.del(keyQueueRateLimitCounter);
          multi.exec((err) => cb(err));
        }
      });
    }
  }

  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          // validating rateLimit params from a javascript client
          const limit = Number(rateLimit.limit);
          if (isNaN(limit) || limit <= 0) {
            cb(
              new QueueRateLimitError(
                `Invalid rateLimit.limit. Expected a positive integer > 0`,
              ),
            );
          }
          const interval = Number(rateLimit.interval);
          if (isNaN(interval) || interval < 1000) {
            cb(
              new QueueRateLimitError(
                `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
              ),
            );
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
    }
  }

  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _hasRateLimitExceeded(client, queueParams, rateLimit, cb);
      });
    }
  }

  get(
    queue: string | IQueueParams,
    cb: ICallback<IQueueRateLimit | null>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
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
    }
  }
}
