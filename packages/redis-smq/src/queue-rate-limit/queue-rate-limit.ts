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
  EQueueProperty,
  IQueueParams,
  IQueueRateLimit,
  QueueManager,
} from '../queue-manager/index.js';
import { _hasRateLimitExceeded } from './_/_has-rate-limit-exceeded.js';
import {
  InvalidRateLimitIntervalError,
  InvalidRateLimitValueError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
} from '../errors/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';

/**
 * The QueueRateLimit class provides functionality to manage rate limiting for
 * message queues. It allows to set, get, check, and clear rate limits on
 * specified queues. The rate limiting mechanism helps ensure fair usage of
 * resources by controlling the number of messages processed within a defined
 * timeframe.
 */
export class QueueRateLimit {
  protected logger; // Logger instance for logging errors and information.
  protected queue; // Queue instance for managing queue operations.

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.debug('Initializing QueueRateLimit');
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
   */
  clear(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueName =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Clearing rate limit for queue: ${queueName}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Validating queue parameters for: ${queueName}`);
      const { keyQueueProperties, keyQueueRateLimitCounter } =
        redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
      this.logger.debug(
        `Clearing rate limit for queue ${queueParams.name}@${queueParams.ns} using keys: ${keyQueueProperties}, ${keyQueueRateLimitCounter}`,
      );
      client.runScript(
        ERedisScriptName.CLEAR_QUEUE_RATE_LIMIT,
        [keyQueueProperties, keyQueueRateLimitCounter],
        [String(EQueueProperty.RATE_LIMIT)],
        (err, reply) => {
          if (err) {
            this.logger.error(`Failed to clear rate limit: ${err.message}`);
            return cb(err);
          }
          if (!['OK', 'QUEUE_NOT_FOUND'].includes(String(reply))) {
            this.logger.error(
              `Failed to clear rate limit. Got unknown reply: ${reply}`,
            );
            return cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
          }
          if (reply === 'QUEUE_NOT_FOUND') {
            this.logger.error(`Failed to clear rate limit: ${reply}`);
            return cb(new QueueNotFoundError());
          }
          this.logger.info(
            `Successfully cleared rate limit for queue: ${queueParams.name}@${queueParams.ns}`,
          );
          cb();
        },
      );
    }, cb);
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
   */
  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    const queueName =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(
      `Setting rate limit for queue: ${queueName}, limit: ${rateLimit.limit}, interval: ${rateLimit.interval}ms`,
    );

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Validating queue parameters for: ${queueName}`);
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) return cb(queueParams);

      // validating rateLimit params from a javascript client
      const limit = Number(rateLimit.limit);
      if (isNaN(limit) || limit <= 0) {
        this.logger.error(`Invalid rate limit value: ${rateLimit.limit}`);
        return cb(new InvalidRateLimitValueError());
      }

      const interval = Number(rateLimit.interval);
      if (isNaN(interval) || interval < 1000) {
        this.logger.error(`Invalid rate limit interval: ${rateLimit.interval}`);
        return cb(new InvalidRateLimitIntervalError());
      }

      const validatedRateLimit: IQueueRateLimit = { interval, limit };
      this.logger.debug(
        `Validated rate limit: ${limit} messages per ${interval}ms for queue: ${queueParams.name}@${queueParams.ns}`,
      );

      const { keyQueueProperties } = redisKeys.getQueueKeys(
        queueParams.ns,
        queueParams.name,
        null,
      );
      this.logger.debug(`Setting rate limit using key: ${keyQueueProperties}`);

      client.runScript(
        ERedisScriptName.SET_QUEUE_RATE_LIMIT,
        [keyQueueProperties],
        [EQueueProperty.RATE_LIMIT, JSON.stringify(validatedRateLimit)],
        (err, reply) => {
          if (err) {
            this.logger.error(`Failed to set rate limit: ${err.message}`);
            return cb(err);
          }
          if (!['OK', 'QUEUE_NOT_FOUND'].includes(String(reply))) {
            this.logger.error(
              `Failed to set rate limit. Got unknown reply: ${reply}`,
            );
            return cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
          }
          if (reply === 'QUEUE_NOT_FOUND') {
            this.logger.error(`Failed to set rate limit: ${reply}`);
            return cb(new QueueNotFoundError());
          }
          this.logger.info(
            `Successfully set rate limit for queue: ${queueParams.name}@${queueParams.ns}, limit: ${limit}, interval: ${interval}ms`,
          );
          cb();
        },
      );
    }, cb);
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
      `Checking if rate limit exceeded for queue: ${queueName}, limit: ${rateLimit.limit}, interval: ${rateLimit.interval}ms`,
    );

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Validating queue parameters for: ${queueName}`);
      _parseQueueParamsAndValidate(client, queue, (err, queueParams) => {
        if (err) {
          this.logger.error(
            `Failed to validate queue parameters: ${err.message}`,
          );
          return cb(err);
        }
        if (!queueParams) {
          this.logger.error(
            'Queue parameters validation returned empty result',
          );
          return cb(new CallbackEmptyReplyError());
        }

        this.logger.debug(
          `Checking rate limit for queue: ${queueParams.name}@${queueParams.ns}`,
        );
        _hasRateLimitExceeded(
          client,
          queueParams,
          rateLimit,
          (err, hasExceeded) => {
            if (err) {
              this.logger.error(`Failed to check rate limit: ${err.message}`);
              return cb(err);
            }

            this.logger.debug(
              `Rate limit check result for queue ${queueParams.name}@${queueParams.ns}: ${hasExceeded ? 'exceeded' : 'not exceeded'}`,
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
    this.logger.debug(`Getting rate limit for queue: ${queueName}`);
    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Validating queue parameters for: ${queueName}`);
      async.withCallback(
        (cb: ICallback<IQueueParams>) =>
          _parseQueueParamsAndValidate(client, queue, cb),
        (queueParams, cb) => {
          const { keyQueueProperties } = redisKeys.getQueueKeys(
            queueParams.ns,
            queueParams.name,
            null,
          );
          this.logger.debug(
            `Getting rate limit using key: ${keyQueueProperties}`,
          );

          client.hget(
            keyQueueProperties,
            String(EQueueProperty.RATE_LIMIT),
            (err, reply) => {
              if (err) {
                this.logger.error(`Failed to get rate limit: ${err.message}`);
                return cb(err);
              }

              if (!reply) {
                this.logger.debug(
                  `No rate limit found for queue: ${queueParams.name}@${queueParams.ns}`,
                );
                return cb(null, null);
              }

              const rateLimit: IQueueRateLimit = JSON.parse(reply);
              this.logger.debug(
                `Retrieved rate limit for queue ${queueParams.name}@${queueParams.ns}: limit: ${rateLimit.limit}, interval: ${rateLimit.interval}ms`,
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
