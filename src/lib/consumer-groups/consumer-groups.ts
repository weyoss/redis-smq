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
  IRedisClient,
  logger,
} from 'redis-smq-common';
import { TRedisSMQEvent } from '../../common/index.js';
import { RedisClientInstance } from '../../common/redis-client/redis-client-instance.js';
import { Configuration } from '../../config/index.js';
import { EventBusRedisInstance } from '../event-bus/index.js';
import { _parseQueueParams } from '../queue/_/_parse-queue-params.js';
import { IQueueParams } from '../queue/index.js';
import { _deleteConsumerGroup } from './_/_delete-consumer-group.js';
import { _getConsumerGroups } from './_/_get-consumer-groups.js';
import { _saveConsumerGroup } from './_/_save-consumer-group.js';

/**
 * ConsumerGroups Class
 *
 * The `ConsumerGroups` class is responsible for managing consumer groups within the RedisSMQ MQ.
 * It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
 * The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.
 */
export class ConsumerGroups {
  protected redisClient;
  protected eventBus;
  protected logger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `consumer-groups`,
    );

    // Set up the event bus and error handling
    this.eventBus = new EventBusRedisInstance();
    this.eventBus.on('error', (err) => this.logger.error(err));

    // Initialize Redis client and error handling
    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
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
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          this.eventBus.getSetInstance((err, eventBus) => {
            if (eventBus)
              _saveConsumerGroup(client, eventBus, queueParams, groupId, cb);
            else cb(err);
          });
        }
      });
    }
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
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      async.waterfall(
        [
          (cb: ICallback<IRedisClient>) => this.redisClient.getSetInstance(cb),
          (
            redisClient: IRedisClient,
            cb: ICallback<{
              redisClient: IRedisClient;
              eventBus: IEventBus<TRedisSMQEvent>;
            }>,
          ) => {
            this.eventBus.getSetInstance((err, eventBus) => {
              if (eventBus) cb(null, { redisClient, eventBus });
              else cb(err);
            });
          },
          (
            args: {
              redisClient: IRedisClient;
              eventBus: IEventBus<TRedisSMQEvent>;
            },
            cb: ICallback<void>,
          ) => {
            _deleteConsumerGroup(
              args.redisClient,
              args.eventBus,
              queueParams,
              groupId,
              cb,
            );
          },
        ],
        cb,
      );
    }
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
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _getConsumerGroups(client, queueParams, cb);
      });
    }
  }

  /**
   * Shutdown
   *
   * Shuts down the consumer groups manager and cleans up resources.
   *
   * @param {ICallback<void>} cb - Callback function to handle the result of the shutdown operation.
   */
  shutdown = (cb: ICallback<void>): void => {
    async.waterfall([this.redisClient.shutdown, this.eventBus.shutdown], cb);
  };
}
