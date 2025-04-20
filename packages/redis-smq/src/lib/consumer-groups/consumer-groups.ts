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
  IEventBus,
  ILogger,
  IRedisClient,
  logger,
} from 'redis-smq-common';
import { TRedisSMQEvent } from '../../common/index.js';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { Configuration } from '../../config/index.js';
import { EventBus } from '../event-bus/index.js';
import { _parseQueueParams } from '../queue/_/_parse-queue-params.js';
import { IQueueParams } from '../queue/index.js';
import { _deleteConsumerGroup } from './_/_delete-consumer-group.js';
import { _getConsumerGroups } from './_/_get-consumer-groups.js';
import { _saveConsumerGroup } from './_/_save-consumer-group.js';

/**
 * The `ConsumerGroups` class is responsible for managing consumer groups within RedisSMQ.
 * It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
 * The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.
 */
export class ConsumerGroups {
  protected redisClient: RedisClient;
  protected eventBus: EventBus;
  protected logger: ILogger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.info('Initializing ConsumerGroups manager');

    // Set up the event bus and error handling
    this.eventBus = new EventBus();
    this.eventBus.on('error', (err) => {
      this.logger.error(`EventBus error: ${err.message}`, err);
    });
    this.logger.debug('EventBus initialized');

    // Initialize Redis client and error handling
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => {
      this.logger.error(`RedisClient error: ${err.message}`, err);
    });
    this.logger.debug('RedisClient initialized');
  }

  /**
   * Save Consumer Group
   *
   * Saves a consumer group to a specific queue.
   *
   * @param {string | IQueueParams} queue - The queue to which the consumer group belongs.
   * @param {string} groupId - The ID of the consumer group to save.
   * @param {ICallback<number>} cb - Callback function to handle the result or error.
   */
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<number>,
  ): void {
    this.logger.debug(
      `Saving consumer group '${groupId}' to queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
    }

    this.logger.debug(
      `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
    );

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Failed to get Redis client instance: ${err.message}`,
        );
        return cb(err);
      }

      if (!client) {
        this.logger.error('Redis client returned empty instance');
        return cb(new CallbackEmptyReplyError());
      }

      this.logger.debug('Redis client instance obtained successfully');

      this.eventBus.getSetInstance((err, eventBus) => {
        if (err) {
          this.logger.error(`Failed to get EventBus instance: ${err.message}`);
          return cb(err);
        }

        if (!eventBus) {
          this.logger.error('EventBus returned empty instance');
          return cb(new CallbackEmptyReplyError());
        }

        this.logger.debug('EventBus instance obtained successfully');

        _saveConsumerGroup(
          client,
          eventBus,
          queueParams,
          groupId,
          (err, result) => {
            if (err) {
              this.logger.error(
                `Failed to save consumer group '${groupId}': ${err.message}`,
              );
              return cb(err);
            }

            this.logger.info(
              `Consumer group '${groupId}' ${result === 1 ? 'created' : 'already exists'} for queue: ${queueParams.name}`,
            );
            cb(null, result);
          },
        );
      });
    });
  }

  /**
   * Delete Consumer Group
   *
   * Deletes a consumer group from a specific queue.
   *
   * @param {string | IQueueParams} queue - The queue from which to delete the consumer group.
   * @param {string} groupId - The ID of the consumer group to delete.
   * @param {ICallback<void>} cb - Callback function to handle the result or error.
   */
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting consumer group '${groupId}' from queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
    }

    this.logger.debug(
      `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
    );

    async.waterfall(
      [
        (cb: ICallback<IRedisClient>) => {
          this.logger.debug('Getting Redis client instance');
          this.redisClient.getSetInstance((err, client) => {
            if (err) {
              this.logger.error(
                `Failed to get Redis client instance: ${err.message}`,
              );
              return cb(err);
            }
            if (!client) {
              this.logger.error('Redis client returned empty instance');
              return cb(new CallbackEmptyReplyError());
            }
            this.logger.debug('Redis client instance obtained successfully');
            cb(null, client);
          });
        },
        (
          redisClient: IRedisClient,
          cb: ICallback<{
            redisClient: IRedisClient;
            eventBus: IEventBus<TRedisSMQEvent>;
          }>,
        ) => {
          this.logger.debug('Getting EventBus instance');
          this.eventBus.getSetInstance((err, eventBus) => {
            if (err) {
              this.logger.error(
                `Failed to get EventBus instance: ${err.message}`,
              );
              return cb(err);
            }
            if (!eventBus) {
              this.logger.error('EventBus returned empty instance');
              return cb(new CallbackEmptyReplyError());
            }
            this.logger.debug('EventBus instance obtained successfully');
            cb(null, { redisClient, eventBus });
          });
        },
        (
          args: {
            redisClient: IRedisClient;
            eventBus: IEventBus<TRedisSMQEvent>;
          },
          cb: ICallback<void>,
        ) => {
          this.logger.debug(
            `Executing delete operation for consumer group '${groupId}'`,
          );
          _deleteConsumerGroup(
            args.redisClient,
            args.eventBus,
            queueParams,
            groupId,
            (err) => {
              if (err) {
                this.logger.error(
                  `Failed to delete consumer group '${groupId}': ${err.message}`,
                );
                return cb(err);
              }
              this.logger.info(
                `Consumer group '${groupId}' successfully deleted from queue: ${queueParams.name}`,
              );
              cb();
            },
          );
        },
      ],
      (err) => {
        if (err) {
          this.logger.error(
            `Error in deleteConsumerGroup workflow: ${err.message}`,
          );
          return cb(err);
        }
        cb();
      },
    );
  }

  /**
   * Get Consumer Groups
   *
   * Retrieves a list of consumer group IDs associated with a specific queue.
   *
   * @param {string | IQueueParams} queue - The queue from which to retrieve consumer groups.
   * @param {ICallback<string[]>} cb - Callback function to handle the result or error.
   */
  getConsumerGroups(
    queue: string | IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    this.logger.debug(
      `Getting consumer groups for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
    }

    this.logger.debug(
      `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
    );

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Failed to get Redis client instance: ${err.message}`,
        );
        return cb(err);
      }

      if (!client) {
        this.logger.error('Redis client returned empty instance');
        return cb(new CallbackEmptyReplyError());
      }

      this.logger.debug('Redis client instance obtained successfully');

      _getConsumerGroups(client, queueParams, (err, groups) => {
        if (err) {
          this.logger.error(`Failed to get consumer groups: ${err.message}`);
          return cb(err);
        }

        this.logger.info(
          `Retrieved ${Number(groups?.length)} consumer groups for queue: ${queueParams.name}`,
        );
        if (groups && groups.length > 0) {
          this.logger.debug(`Consumer groups: ${JSON.stringify(groups)}`);
        }

        cb(null, groups);
      });
    });
  }

  /**
   * Shutdown
   *
   * Shuts down the consumer groups manager and cleans up resources.
   *
   * @param {ICallback<void>} cb - Callback function to handle the result of the shutdown operation.
   */
  shutdown = (cb: ICallback<void>): void => {
    this.logger.info('Shutting down ConsumerGroups manager');

    async.waterfall(
      [
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down RedisClient');
          this.redisClient.shutdown((err) => {
            if (err) {
              this.logger.warn(
                `Error during RedisClient shutdown (continuing): ${err.message}`,
              );
            } else {
              this.logger.debug('RedisClient shutdown successful');
            }
            next();
          });
        },
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down EventBus');
          this.eventBus.shutdown((err) => {
            if (err) {
              this.logger.warn(
                `Error during EventBus shutdown (continuing): ${err.message}`,
              );
            } else {
              this.logger.debug('EventBus shutdown successful');
            }
            next();
          });
        },
      ],
      (err) => {
        if (err) {
          this.logger.error(`Error during shutdown: ${err.message}`);
          return cb(err);
        }
        this.logger.info('ConsumerGroups manager shutdown complete');
        cb();
      },
    );
  };
}
