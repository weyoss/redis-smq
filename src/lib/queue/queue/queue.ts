import {
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { QueueExistsError } from '../errors/queue-exists.error';
import { _deleteQueue } from './_delete-queue';
import { errors, ICallback } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _getQueueProperties } from './_get-queue-properties';
import { _getQueueParams } from './_get-queue-params';
import { _getQueues } from './_get-queues';

export class Queue {
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        const { keyQueues, keyNsQueues, keyNamespaces, keyQueueProperties } =
          redisKeys.getQueueKeys(queueParams);
        const queueIndex = JSON.stringify(queueParams);
        client.runScript(
          ELuaScriptName.CREATE_QUEUE,
          [
            keyNamespaces,
            keyNsQueues,
            keyQueues,
            keyQueueProperties,
            EQueueProperty.QUEUE_TYPE,
          ],
          [queueParams.ns, queueIndex, queueType],
          (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new QueueExistsError());
            else
              this.getProperties(queueParams, (err, properties) => {
                if (err) cb(err);
                else if (!properties) cb(new errors.EmptyCallbackReplyError());
                else cb(null, { queue: queueParams, properties });
              });
          },
        );
      }
    });
  }

  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const queueParams = _getQueueParams(queue);
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

  delete(queue: string | IQueueParams, cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        _deleteQueue(client, queueParams, undefined, (err, multi) => {
          if (err) cb(err);
          else if (!multi) cb(new errors.EmptyCallbackReplyError());
          else multi.exec((err) => cb(err));
        });
      }
    });
  }

  getProperties(
    queue: string | IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void {
    const queueParams = _getQueueParams(queue);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else _getQueueProperties(client, queueParams, cb);
    });
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else _getQueues(client, cb);
    });
  }
}
