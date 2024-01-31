/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueExistsError } from '../errors';
import { _deleteQueue } from './_delete-queue';
import {
  CallbackEmptyReplyError,
  ICallback,
  RedisClient,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _getQueueProperties } from './_get-queue-properties';
import { _parseQueueParams } from './_parse-queue-params';
import { _getQueues } from './_get-queues';
import { QueueEventEmitter } from './queue-event-emitter';

export class Queue {
  protected queueEventEmitter: QueueEventEmitter | null = null;

  protected getQueueEventEmitter(redisClient: RedisClient): QueueEventEmitter {
    if (!this.queueEventEmitter) {
      this.queueEventEmitter = new QueueEventEmitter(redisClient, redisClient);
    }
    return this.queueEventEmitter;
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
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyQueues, keyNsQueues, keyNamespaces, keyQueueProperties } =
            redisKeys.getQueueKeys(queueParams, null);
          const queueParamsStr = JSON.stringify(queueParams);
          client.runScript(
            ELuaScriptName.CREATE_QUEUE,
            [keyNamespaces, keyNsQueues, keyQueues, keyQueueProperties],
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
                    this.getQueueEventEmitter(client).emit(
                      'queueCreated',
                      queueParams,
                      properties,
                    );
                    cb(null, { queue: queueParams, properties });
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
      _getCommonRedisClient((err, client) => {
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
      _getCommonRedisClient((err, client) => {
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
                  this.getQueueEventEmitter(client).emit(
                    'queueDeleted',
                    queueParams,
                  );
                  cb();
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
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _getQueueProperties(client, queueParams, cb);
      });
    }
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getQueues(client, cb);
    });
  }
}
