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
   * @param queue - The name of the queue or an IQueueParams object representing the queue.
   * @param cb - A callback function which receives an error or undefined when the operation is complete.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   * @throws QueueLockedError
   */
  clear(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueName =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Clearing rate limit for queue: ${queueName}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

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
              const error = new QueueNotFoundError();
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

            this.logger.info(`Cleared rate limit for queue: ${queueName}`);
            cb();
          },
        );
      },
      cb,
    );
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
   *
   * @throws InvalidQueueParametersError
   * @throws InvalidRateLimitValueError
   * @throws InvalidRateLimitIntervalError
   * @throws UnexpectedScriptReplyError
   * @throws QueueNotFoundError
   * @throws QueueLockedError
   */
  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void {
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
              const error = new QueueNotFoundError();
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
              `Set rate limit for ${queueName}: ${limit}/${interval}ms`,
            );
            cb();
          },
        );
      },
      cb,
    );
  }

  /**
   * Checks if the rate limit for a specific queue has been exceeded.
   *
   * @param queue - The name of the queue or an IQueueParams object containing the queue configuration.
   * @param rateLimit - An IQueueRateLimit object defining the rate limit parameters.
   * @param cb - A callback function which receives a boolean value indicating whether the rate limit has been exceeded.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   */
  hasExceeded(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
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
    }, cb);
  }

  /**
   * Retrieves the current rate limit parameters for a specific message queue.
   *
   * @param queue - The name of the queue or an IQueueParams object containing the queue configuration.
   * @param cb - A callback function that is called once the rate limit has been fetched.
   * It receives either the current rate limit parameters or null if not set.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   */
  get(
    queue: string | IQueueParams,
    cb: ICallback<IQueueRateLimit | null>,
  ): void {
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
    }, cb);
  }
}
