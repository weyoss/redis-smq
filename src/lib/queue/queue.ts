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
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { EventBusRedisInstance } from '../event-bus/event-bus-redis-instance.js';
import { _deleteQueue } from './_/_delete-queue.js';
import { _getQueueProperties } from './_/_get-queue-properties.js';
import { _getQueues } from './_/_get-queues.js';
import { _parseQueueParams } from './_/_parse-queue-params.js';
import { QueueExistsError } from './errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from './types/index.js';

export class Queue {
  protected redisClient;
  protected eventBus;
  protected logger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue`,
    );
    this.eventBus = new EventBusRedisInstance();
    this.eventBus.on('error', (err) => this.logger.error(err));

    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyQueueProperties } = redisKeys.getQueueKeys(
            queueParams,
            null,
          );
          const { keyNamespaces, keyQueues } = redisKeys.getMainKeys();
          const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(
            queueParams.ns,
          );
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
              if (err) cb(err);
              else if (!reply) cb(new CallbackEmptyReplyError());
              else if (reply !== 'OK') cb(new QueueExistsError());
              else
                this.getProperties(queueParams, (err, properties) => {
                  if (err) cb(err);
                  else if (!properties) cb(new CallbackEmptyReplyError());
                  else {
                    this.eventBus.getSetInstance((err, instance) => {
                      if (err) cb(err);
                      else {
                        instance?.emit(
                          'queue.queueCreated',
                          queueParams,
                          properties,
                        );
                        cb(null, { queue: queueParams, properties });
                      }
                    });
                  }
                });
            },
          );
        }
      });
    }
  }

  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyQueues } = redisKeys.getMainKeys();
          client.sismember(
            keyQueues,
            JSON.stringify(queueParams),
            (err, reply) => {
              if (err) cb(err);
              else cb(null, !!reply);
            },
          );
        }
      });
    }
  }

  delete(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) cb(queueParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          _deleteQueue(client, queueParams, undefined, (err, multi) => {
            if (err) cb(err);
            else if (!multi) cb(new CallbackEmptyReplyError());
            else
              multi.exec((err) => {
                if (err) cb(err);
                else {
                  this.eventBus.getSetInstance((err, instance) => {
                    if (err) cb(err);
                    else {
                      instance?.emit('queue.queueDeleted', queueParams);
                      cb();
                    }
                  });
                }
              });
          });
        }
      });
    }
  }

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

  getQueues(cb: ICallback<IQueueParams[]>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getQueues(client, cb);
    });
  }

  shutdown = (cb: ICallback<void>): void => {
    async.waterfall([this.redisClient.shutdown, this.eventBus.shutdown], cb);
  };
}
