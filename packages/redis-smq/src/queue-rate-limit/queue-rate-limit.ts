/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
} from 'redis-smq-common';
import { ERedisScriptName } from '../common/redis/scripts.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { Configuration } from '../config-manager/configuration.js';
import { _parseQueueParamsAndValidate } from '../queue-manager/_/_parse-queue-params-and-validate.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParams,
  IQueueRateLimit,
  QueueManager,
} from '../queue-manager/index.js';
import { _hasRateLimitExceeded } from './_/_has-rate-limit-exceeded.js';
import {
  InvalidRateLimitIntervalError,
  InvalidRateLimitValueError,
  QueueLockedError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../errors/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { getRedisForQueueOperation } from '../common/helpers/get-redis-for-queue-operation.js';
import { EQueueOperation } from '../queue-operation-validator/index.js';

/**
 * Manages queue rate limiting.
 *
 * Provides methods to set, get, check, and clear rate limits on queues.
 * Rate limiting controls the number of messages processed within a timeframe.
 *
 * @example
 * ```typescript
 * const rateLimit = new QueueRateLimit();
 *
 * // Set rate limit: 100 messages per minute
 * await rateLimit.set('orders', { limit: 100, interval: 60000 });
 *
 * // Check if exceeded
 * const exceeded = await rateLimit.hasExceeded('orders', { limit: 100, interval: 60000 });
 * ```
 */
export class QueueRateLimit {
  protected logger;
  protected queue;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.queue = new QueueManager();
    this.logger.debug('QueueRateLimit initialized');
  }

  /**
   * Clears the rate limit for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * ```typescript
   * // Promise
   * await rateLimit.clear('orders');
   *
   * // Callback
   * rateLimit.clear('orders', (err) => {
   *   if (err) throw err;
   * });
   * ```
   */
  clear(queue: string | IQueueParams): Promise<void>;
  clear(queue: string | IQueueParams, cb: ICallback<void>): void;
  clear(
    queue: string | IQueueParams,
    cb?: ICallback<void>,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback: ICallback<void>) => {
      const queueName =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Clearing rate limit for queue: ${queueName}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) return callback(queueParams);

      getRedisForQueueOperation(
        queue,
        EQueueOperation.CLEAR_RATE_LIMIT,
        (client, cb) => {
          const { keyQueueProperties, keyQueueRateLimit } =
            redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);

          const argv: (string | number)[] = [
            EQueueProperty.RATE_LIMIT,
            EQueueProperty.OPERATIONAL_STATE,
            EQueueOperationalState.LOCKED,
            EQueueProperty.LOCK_ID,
            '', // lock ID
          ];

          client.runScript(
            ERedisScriptName.CLEAR_QUEUE_RATE_LIMIT,
            [keyQueueProperties, keyQueueRateLimit],
            argv,
            (err, reply) => {
              if (err) {
                this.logger.error(
                  `Failed to clear rate limit for ${queueName}: ${err.message}`,
                );
                return cb(err);
              }

              const replyStr = String(reply);

              if (replyStr === 'QUEUE_LOCKED') {
                const error = new QueueLockedError({
                  metadata: { queue: queueParams },
                });
                this.logger.error(
                  `Cannot clear rate limit for ${queueName}: Queue is locked and no lock ID provided`,
                );
                return cb(error);
              }

              if (replyStr === 'QUEUE_NOT_FOUND') {
                const error = new QueueNotFoundError({
                  metadata: { queue: queueParams },
                });
                this.logger.error(
                  `Queue not found when clearing rate limit: ${queueName}`,
                );
                return cb(error);
              }

              if (replyStr !== 'OK') {
                const error = new UnexpectedScriptReplyError({
                  metadata: { reply },
                });
                this.logger.error(
                  `Unexpected reply when clearing rate limit for ${queueName}: ${replyStr}`,
                );
                return cb(error);
              }

              this.logger.info(
                `Cleared rate limit for queue ${queueParams.name}@${queueParams.ns}`,
              );
              cb();
            },
          );
        },
        callback,
      );
    });
  }

  /**
   * Sets a rate limit for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param rateLimit - { limit, interval } where interval is in milliseconds (min 1000)
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * ```typescript
   * // Promise - 100 messages per minute
   * await rateLimit.set('orders', { limit: 100, interval: 60000 });
   *
   * // Promise - 10 messages per second
   * await rateLimit.set('orders', { limit: 10, interval: 1000 });
   *
   * // Callback
   * rateLimit.set('orders', { limit: 100, interval: 60000 }, (err) => {
   *   if (err) throw err;
   * });
   * ```
   */
  set(queue: string | IQueueParams, rateLimit: IQueueRateLimit): Promise<void>;
  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void;
  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb?: ICallback<void>,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback: ICallback<void>) => {
      const queueName =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(
        `Setting rate limit for ${queueName}: ${rateLimit.limit}/${rateLimit.interval}ms`,
      );

      getRedisForQueueOperation(
        queue,
        EQueueOperation.SET_RATE_LIMIT,
        (client, cb) => {
          const queueParams = _parseQueueParams(queue);
          if (queueParams instanceof Error) return cb(queueParams);

          const limit = Number(rateLimit.limit);
          if (isNaN(limit) || limit <= 0) {
            const error = new InvalidRateLimitValueError();
            this.logger.error(
              `Invalid rate limit value for ${queueName}: ${rateLimit.limit}`,
            );
            return cb(error);
          }

          const interval = Number(rateLimit.interval);
          if (isNaN(interval) || interval < 1000) {
            const error = new InvalidRateLimitIntervalError();
            this.logger.error(
              `Invalid rate limit interval for ${queueName}: ${rateLimit.interval}`,
            );
            return cb(error);
          }

          const validatedRateLimit: IQueueRateLimit = { interval, limit };

          const { keyQueueProperties } = redisKeys.getQueueKeys(
            queueParams.ns,
            queueParams.name,
            null,
          );

          const argv: (string | number)[] = [
            EQueueProperty.RATE_LIMIT,
            JSON.stringify(validatedRateLimit),
            EQueueProperty.OPERATIONAL_STATE,
            EQueueOperationalState.LOCKED,
            EQueueProperty.LOCK_ID,
            '', // lock ID
          ];

          client.runScript(
            ERedisScriptName.SET_QUEUE_RATE_LIMIT,
            [keyQueueProperties],
            argv,
            (err, reply) => {
              if (err) {
                this.logger.error(
                  `Failed to set rate limit for ${queueName}: ${err.message}`,
                );
                return cb(err);
              }

              const replyStr = String(reply);

              if (replyStr === 'QUEUE_LOCKED') {
                const error = new QueueLockedError({
                  metadata: { queue: queueParams },
                });
                this.logger.error(
                  `Cannot set rate limit for ${queueName}: Queue is locked and no lock ID provided`,
                );
                return cb(error);
              }

              if (replyStr === 'QUEUE_NOT_FOUND') {
                const error = new QueueNotFoundError({
                  metadata: { queue: queueParams },
                });
                this.logger.error(
                  `Queue not found when setting rate limit: ${queueName}`,
                );
                return cb(error);
              }

              if (replyStr !== 'OK') {
                const error = new UnexpectedScriptReplyError({
                  metadata: { reply },
                });
                this.logger.error(
                  `Unexpected reply when setting rate limit for ${queueName}: ${replyStr}`,
                );
                return cb(error);
              }

              this.logger.info(
                `Set rate limit for ${queueParams.name}@${queueParams.ns}: ${limit}/${interval}ms`,
              );
              cb();
            },
          );
        },
        callback,
      );
    });
  }

  /**
   * Checks if the rate limit has been exceeded for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param rateLimit - { limit, interval } to check against
   * @param cb - (err, exceeded) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * ```typescript
   * // Promise
   * const exceeded = await rateLimit.hasExceeded('orders', { limit: 100, interval: 60000 });
   * if (exceeded) {
   *   console.log('Rate limit exceeded');
   * }
   *
   * // Callback
   * rateLimit.hasExceeded('orders', { limit: 100, interval: 60000 }, (err, exceeded) => {
   *   if (err) throw err;
   *   console.log(exceeded);
   * });
   * ```
   */
  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
  ): Promise<boolean>;
  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void;
  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueName =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(
        `Checking rate limit for ${queueName}: ${rateLimit.limit}/${rateLimit.interval}ms`,
      );

      withSharedPoolConnection((client, cb) => {
        _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
          if (err) {
            this.logger.error(
              `Failed to validate queue ${queueName}: ${err.message}`,
            );
            return cb(err);
          }

          if (!queueParams) {
            const error = new CallbackEmptyReplyError();
            this.logger.error(`Empty queue parameters for ${queueName}`);
            return cb(error);
          }

          _hasRateLimitExceeded(
            client,
            queueParams,
            rateLimit,
            (err, hasExceeded) => {
              if (err) {
                this.logger.error(
                  `Failed to check rate limit for ${queueName}: ${err.message}`,
                );
                return cb(err);
              }

              this.logger.debug(
                `Rate limit ${hasExceeded ? 'exceeded' : 'not exceeded'} for ${queueName}`,
              );
              cb(null, hasExceeded);
            },
          );
        });
      }, callback);
    });
  }

  /**
   * Gets the current rate limit for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, rateLimit) => void. Returns IQueueRateLimit or null if not set
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * ```typescript
   * // Promise
   * const rateLimit = await rateLimit.get('orders');
   * if (rateLimit) {
   *   console.log(`${rateLimit.limit} per ${rateLimit.interval}ms`);
   * } else {
   *   console.log('No rate limit set');
   * }
   *
   * // Callback
   * rateLimit.get('orders', (err, rateLimit) => {
   *   if (err) throw err;
   *   console.log(rateLimit);
   * });
   * ```
   */
  get(queue: string | IQueueParams): Promise<IQueueRateLimit | null>;
  get(
    queue: string | IQueueParams,
    cb: ICallback<IQueueRateLimit | null>,
  ): void;
  get(
    queue: string | IQueueParams,
    cb?: ICallback<IQueueRateLimit | null>,
  ): Promise<IQueueRateLimit | null> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueName =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting rate limit for ${queueName}`);

      withSharedPoolConnection((client, cb) => {
        async.withCallback(
          (cb: ICallback<IQueueParams>) =>
            _parseQueueParamsAndValidate(client, queue, cb),
          (queueParams, cb) => {
            const { keyQueueProperties } = redisKeys.getQueueKeys(
              queueParams.ns,
              queueParams.name,
              null,
            );

            client.hget(
              keyQueueProperties,
              String(EQueueProperty.RATE_LIMIT),
              (err, reply) => {
                if (err) {
                  this.logger.error(
                    `Failed to get rate limit for ${queueName}: ${err.message}`,
                  );
                  return cb(err);
                }

                if (!reply) {
                  this.logger.debug(`No rate limit found for ${queueName}`);
                  return cb(null, null);
                }

                const rateLimit: IQueueRateLimit = JSON.parse(reply);
                this.logger.debug(
                  `Got rate limit for ${queueName}: ${rateLimit.limit}/${rateLimit.interval}ms`,
                );
                cb(null, rateLimit);
              },
            );
          },
          cb,
        );
      }, callback);
    });
  }
}
