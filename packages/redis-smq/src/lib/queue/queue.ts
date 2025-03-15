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
import { EventBus } from '../event-bus/index.js';
import { _deleteQueue } from './_/_delete-queue.js';
import { _getQueueProperties } from './_/_get-queue-properties.js';
import { _getQueues } from './_/_get-queues.js';
import { _parseQueueParams } from './_/_parse-queue-params.js';
import { _queueExists } from './_/_queue-exists.js';
import { QueueQueueExistsError } from './errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from './types/index.js';

/**
 * The Queue class represents an interface that interacts with Redis for storing
 * and managing queues.
 * It provides functionality to create, check existence, delete, retrieve
 * properties of queues, and manage shutdown operations.
 */
export class Queue {
  protected redisClient;
  protected eventBus;
  protected logger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue`,
    );
    this.eventBus = new EventBus();
    this.eventBus.on('error', (err) => this.logger.error(err));

    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  /**
   * Save a new queue with specified parameters.
   * Upon success the callback function is invoked with the created queue details.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/enums/EQueueType.md
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/enums/EQueueDeliveryModel.md
   * @param queue - The name or parameters for the queue.
   * @param queueType - The type of the queue, defined by EQueueType.
   * @param deliveryModel - The model for message delivery, defined by EQueueDeliveryModel.
   * @param cb - Callback function to handle success or error.
   */
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());

      const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
      const { keyNamespaces, keyQueues } = redisKeys.getMainKeys();
      const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);
      const queueParamsStr = JSON.stringify(queueParams);

      client.runScript(
        ELuaScriptName.CREATE_QUEUE,
        [keyNamespaces, keyNamespaceQueues, keyQueues, keyQueueProperties],
        [
          queueParams.ns,
          queueParamsStr,
          EQueueProperty.QUEUE_TYPE,
          queueType,
          EQueueProperty.DELIVERY_MODEL,
          deliveryModel,
        ],
        (err, reply) => {
          if (err) return cb(err);
          if (!reply) return cb(new CallbackEmptyReplyError());
          if (reply !== 'OK') return cb(new QueueQueueExistsError());

          this.getProperties(queueParams, (err, properties) => {
            if (err) return cb(err);
            if (!properties) return cb(new CallbackEmptyReplyError());

            this.eventBus.getSetInstance((err, instance) => {
              if (err) return cb(err);
              instance?.emit('queue.queueCreated', queueParams, properties);
              cb(null, { queue: queueParams, properties });
            });
          });
        },
      );
    });
  }

  /**
   * Checks if a specified queue exists.
   *
   * @param queue - The name or parameters for the queue.
   * @param cb - Callback function to return a boolean indicating the existence of the queue.
   */
  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _queueExists(client, queueParams, cb);
      });
    }
  }

  /**
   * Deletes a specific queue.
   *
   * @param queue - The name or parameters for the queue to be deleted.
   * @param cb - Callback function to handle success or error.
   */
  delete(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);
    this.redisClient.getSetInstance((err, client) => {
      if (err) return cb(err);
      if (!client) return cb(new CallbackEmptyReplyError());
      _deleteQueue(client, queueParams, undefined, (err, multi) => {
        if (err) return cb(err);
        if (!multi) return cb(new CallbackEmptyReplyError());
        multi.exec((err) => {
          if (err) return cb(err);
          this.eventBus.getSetInstance((err, instance) => {
            if (err) return cb(err);
            instance?.emit('queue.queueDeleted', queueParams);
            cb();
          });
        });
      });
    });
  }

  /**
   * Retrieves the properties of a specified queue.
   *
   * @param queue - The name or parameters for the queue.
   * @param cb - Callback function to return the queue properties or an error.
   */
  getProperties(
    queue: string | IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _getQueueProperties(client, queueParams, cb);
      });
    }
  }

  /**
   * Fetches all existing queues.
   *
   * @param cb - Callback function to return with a list of queues or an error.
   */
  getQueues(cb: ICallback<IQueueParams[]>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getQueues(client, cb);
    });
  }

  /**
   * Cleans up resources by shutting down the Redis client and event bus.
   *
   * @param {ICallback<void>} cb - Callback function to handle completion of the shutdown process.
   */
  shutdown = (cb: ICallback<void>): void => {
    async.waterfall([this.redisClient.shutdown, this.eventBus.shutdown], cb);
  };
}
