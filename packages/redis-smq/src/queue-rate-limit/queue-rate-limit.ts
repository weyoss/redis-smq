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
import { Configuration } from '../config/index.js';
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
 * The QueueRateLimit class provides functionality to manage rate limiting for
 * message queues. It allows to set, get, check, and clear rate limits on
 * specified queues. The rate limiting mechanism helps ensure fair usage of
 * resources by controlling the number of messages processed within a defined
 * timeframe.
 *
 * Rate limiting is essential for:
 * - Preventing consumer overload
 * - Ensuring fair resource distribution
 * - Protecting downstream services
 * - Managing message throughput
 * - Implementing service level agreements (SLAs)
 *
 * @example
 * ```typescript
 * const rateLimit = new QueueRateLimit();
 *
 * // Using callback
 * rateLimit.set('my-queue', { limit: 100, interval: 60000 }, (err) => {
 *   if (err) {
 *     console.error('Failed to set rate limit:', err);
 *   } else {
 *     console.log('Rate limit set: 100 messages per minute');
 *   }
 * });
 *
 * // Using promise
 * await rateLimit.set('my-queue', { limit: 100, interval: 60000 });
 * console.log('Rate limit set successfully');
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
   * Resets or clears the rate limit settings for a specific queue.
   *
   * This method removes any existing rate limit configuration from the queue,
   * allowing unlimited message processing. After clearing, the queue will
   * no longer have any rate restrictions.
   *
   * @param queue - The name of the queue or an IQueueParams object representing the queue
   * @param cb - Optional callback function which receives an error or undefined when complete.
   *             - On success: `cb(null)`
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves when cleared.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {QueueLockedError} When the queue is locked and no lock ID is provided.
   *
   * @example
   * ```typescript
   * // Callback pattern
   * rateLimit.clear('my-queue', (err) => {
   *   if (err) {
   *     console.error('Failed to clear rate limit:', err);
   *   } else {
   *     console.log('Rate limit cleared successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await rateLimit.clear('my-queue');
   *   console.log('Rate limit cleared successfully');
   * } catch (err) {
   *   console.error('Failed to clear rate limit:', err);
   * }
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
          const { keyQueueProperties, keyQueueRateLimitCounter } =
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
            [keyQueueProperties, keyQueueRateLimitCounter],
            argv,
            (err, reply) => {
              if (err) {
                this.logger.error(
                  `Failed to clear rate limit for ${queueName}: ${err.message}`,
                );
                return cb(err);
              }

              const replyStr = String(reply);

              // Handle queue state errors
              if (replyStr === 'QUEUE_LOCKED') {
                const error = new QueueLockedError({
                  metadata: {
                    queue: queueParams,
                  },
                });
                this.logger.error(
                  `Cannot clear rate limit for ${queueName}: Queue is locked and no lock ID provided`,
                );
                return cb(error);
              }

              if (replyStr === 'QUEUE_NOT_FOUND') {
                const error = new QueueNotFoundError({
                  metadata: {
                    queue: queueParams,
                  },
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
   * Sets a rate limit for a specific queue.
   *
   * Rate limiting is a common practice to control how many messages can be
   * processed within a certain timeframe, preventing overload on consumers and
   * ensuring fair usage of resources.
   *
   * **Rate Limit Parameters:**
   * - `limit`: Maximum number of messages allowed within the interval
   * - `interval`: Time window in milliseconds (minimum 1000ms)
   *
   * **Important Notes:**
   * - Rate limits are enforced at the queue level
   * - All consumers of the queue share the same rate limit
   * - The interval must be at least 1000ms (1 second)
   * - Rate limit must be a positive integer
   *
   * @param queue - The name of the queue or an IQueueParams object
   * @param rateLimit - An IQueueRateLimit object specifying the rate limit configuration
   * @param cb - Optional callback function called when the rate limit is set.
   *             - On success: `cb(null)`
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves when set.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {InvalidRateLimitValueError} When the rate limit value is invalid (<= 0).
   * @throws {InvalidRateLimitIntervalError} When the interval is invalid (< 1000ms).
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {QueueLockedError} When the queue is locked.
   *
   * @example
   * ```typescript
   * // Callback pattern - set rate limit to 100 messages per minute
   * rateLimit.set('my-queue', { limit: 100, interval: 60000 }, (err) => {
   *   if (err) {
   *     console.error('Failed to set rate limit:', err);
   *   } else {
   *     console.log('Rate limit set to 100 messages per minute');
   *   }
   * });
   *
   * // Promise pattern - set rate limit to 10 messages per second
   * try {
   *   await rateLimit.set('orders-queue', { limit: 10, interval: 1000 });
   *   console.log('Rate limit set to 10 messages per second');
   * } catch (err) {
   *   console.error('Failed to set rate limit:', err);
   * }
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

              // Handle queue state errors
              if (replyStr === 'QUEUE_LOCKED') {
                const error = new QueueLockedError({
                  metadata: {
                    queue: queueParams,
                  },
                });
                this.logger.error(
                  `Cannot set rate limit for ${queueName}: Queue is locked and no lock ID provided`,
                );
                return cb(error);
              }

              if (replyStr === 'QUEUE_NOT_FOUND') {
                const error = new QueueNotFoundError({
                  metadata: {
                    queue: queueParams,
                  },
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
   * Checks if the rate limit for a specific queue has been exceeded.
   *
   * This method checks whether the number of messages processed in the current
   * time window has reached or exceeded the configured rate limit.
   *
   * @param queue - The name of the queue or an IQueueParams object
   * @param rateLimit - An IQueueRateLimit object defining the rate limit parameters
   * @param cb - Optional callback function which receives a boolean value.
   *             - On success: `cb(null, exceeded)` where exceeded is true if rate limit exceeded.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the boolean.
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * // Callback pattern
   * rateLimit.hasExceeded('my-queue', { limit: 100, interval: 60000 }, (err, exceeded) => {
   *   if (err) {
   *     console.error('Failed to check rate limit:', err);
   *   } else if (exceeded) {
   *     console.log('Rate limit exceeded, please slow down');
   *   } else {
   *     console.log('Rate limit not exceeded, safe to process');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const exceeded = await rateLimit.hasExceeded('my-queue', { limit: 100, interval: 60000 });
   *   if (exceeded) {
   *     console.log('Rate limit exceeded, implementing backoff');
   *   } else {
   *     console.log('Rate limit OK, proceeding with processing');
   *   }
   * } catch (err) {
   *   console.error('Failed to check rate limit:', err);
   * }
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
   * Retrieves the current rate limit parameters for a specific message queue.
   *
   * This method returns the currently configured rate limit for the queue,
   * or null if no rate limit is set.
   *
   * @param queue - The name of the queue or an IQueueParams object
   * @param cb - Optional callback function that is called with the rate limit.
   *             - On success: `cb(null, rateLimit)` where rateLimit is the current config or null.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the rate limit.
   * @returns {Promise<IQueueRateLimit | null> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * // Callback pattern
   * rateLimit.get('my-queue', (err, rateLimit) => {
   *   if (err) {
   *     console.error('Failed to get rate limit:', err);
   *   } else if (rateLimit) {
   *     console.log(`Current rate limit: ${rateLimit.limit}/${rateLimit.interval}ms`);
   *   } else {
   *     console.log('No rate limit set for this queue');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const rateLimit = await rateLimit.get('my-queue');
   *   if (rateLimit) {
   *     console.log(`Rate limit: ${rateLimit.limit} messages per ${rateLimit.interval}ms`);
   *   } else {
   *     console.log('Queue has no rate limit configured');
   *   }
   * } catch (err) {
   *   console.error('Failed to get rate limit:', err);
   * }
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
