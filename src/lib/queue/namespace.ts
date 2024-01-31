/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { _deleteQueue } from './queue/_delete-queue';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { QueueNamespaceNotFoundError } from './errors';
import { _getQueues } from './queue/_get-queues';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class Namespace {
  getNamespaces(cb: ICallback<string[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const { keyNamespaces } = redisKeys.getMainKeys();
        client.smembers(keyNamespaces, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, reply);
        });
      }
    });
  }

  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void {
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) cb(ns);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyNsQueues } = redisKeys.getNamespaceKeys(ns);
          client.smembers(keyNsQueues, (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new CallbackEmptyReplyError());
            else {
              const messageQueues: IQueueParams[] = reply.map((i) =>
                JSON.parse(i),
              );
              cb(null, messageQueues);
            }
          });
        }
      });
    }
  }

  delete(namespace: string, cb: ICallback<void>): void {
    const ns = redisKeys.validateRedisKey(namespace);
    if (ns instanceof Error) cb(ns);
    else {
      _getCommonRedisClient((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          const { keyNamespaces } = redisKeys.getMainKeys();
          async.waterfall(
            [
              (cb: ICallback<void>) => {
                client.sismember(keyNamespaces, ns, (err, isMember) => {
                  if (err) cb(err);
                  else if (!isMember) cb(new QueueNamespaceNotFoundError(ns));
                  else cb();
                });
              },
            ],
            (err) => {
              if (err) cb(err);
              else {
                _getQueues(client, (err, reply) => {
                  if (err) cb(err);
                  else {
                    const queues = reply ?? [];
                    const multi = client.multi();
                    multi.srem(keyNamespaces, ns);
                    async.eachOf(
                      queues,
                      (queueParams, _, done) => {
                        _deleteQueue(client, queueParams, multi, (err) =>
                          done(err),
                        );
                      },
                      (err) => {
                        if (err) cb(err);
                        else multi.exec((err) => cb(err));
                      },
                    );
                  }
                });
              }
            },
          );
        }
      });
    }
  }
}
