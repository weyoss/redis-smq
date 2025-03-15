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
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
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
  QueueRateLimitInvalidIntervalError,
  QueueRateLimitInvalidLimitError,
  QueueRateLimitQueueNotFoundError,
} from './errors/index.js';

/**
 * The QueueRateLimit class provides functionality to manage rate limiting for
 * message queues. It allows to set, get, check, and clear rate limits on
 * specified queues. The rate limiting mechanism helps ensure fair usage of
 * resources by controlling the number of messages processed within a defined
 * timeframe.
 */
export class QueueRateLimit {
  protected redisClient; // Redis client instance for interacting with Redis.
  protected logger; // Logger instance for logging errors and information.
  protected queue; // Queue instance for managing queue operations.

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue-rate-limit`,
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
    this.queue = new Queue();
  }

  /**
   * Resets or clears the rate limit settings for a specific queue.
   *
   * @param queue - The name of the queue or an IQueueParams object representing the queue.
   * @param cb - A callback function which receives an error or undefined when the operation is complete.
   */
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

  /**
   * Sets a rate limit for a specific queue.
   *
   * Rate limiting is a common practice to control how many messages can be
   * processed within a certain timeframe, preventing overload on consumers and
   * ensuring fair usage of resources.
   *
   * @param queue - The name of the queue or an IQueueParams object. This is the queue for which you want to set a rate limit.
   * @param rateLimit - An IQueueRateLimit object specifying the rate limit configuration (limit and interval).
   * @param cb - A callback function called when the rate limit is set successfully. No arguments are passed.
   */
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
            client.runScript(
              ELuaScriptName.SET_QUEUE_RATE_LIMIT,
              [keyQueueProperties],
              [EQueueProperty.RATE_LIMIT, JSON.stringify(validatedRateLimit)],
              (err, reply) => {
                if (err) cb(err);
                else if (reply !== 'OK')
                  cb(new QueueRateLimitQueueNotFoundError());
                else cb();
              },
            );
          }
        });
    });
  }

  /**
   * Checks if the rate limit for a specific queue has been exceeded.
   *
   * @param queue - The name of the queue or an IQueueParams object containing the queue configuration.
   * @param rateLimit - An IQueueRateLimit object defining the rate limit parameters.
   * @param cb - A callback function which receives a boolean value indicating whether the rate limit has been exceeded.
   */
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

  /**
   * Retrieves the current rate limit parameters for a specific message queue.
   *
   * @param queue - The name of the queue or an IQueueParams object containing the queue configuration.
   * @param cb - A callback function that is called once the rate limit has been fetched.
   * It receives either the current rate limit parameters or null if not set.
   */
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

  /**
   * Cleans up resources by shutting down the Redis client and the queue.
   *
   * @param {ICallback<void>} cb - A callback function to handle completion of the shutdown process.
   */
  shutdown = (cb: ICallback<void>): void => {
    async.waterfall([this.queue.shutdown, this.redisClient.shutdown], cb);
  };
}
