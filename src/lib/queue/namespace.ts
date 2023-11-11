import { IQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { _deleteQueue } from './queue/_delete-queue';
import { async, errors, ICallback } from 'redis-smq-common';
import { NamespaceNotFoundError } from './errors/namespace-not-found.error';
import { _getQueues } from './queue/_get-queues';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class Namespace {
  getNamespaces(cb: ICallback<string[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const { keyNamespaces } = redisKeys.getMainKeys();
        client.smembers(keyNamespaces, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new errors.EmptyCallbackReplyError());
          else cb(null, reply);
        });
      }
    });
  }

  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const { keyNsQueues } = redisKeys.getNamespaceKeys(namespace);
        client.smembers(keyNsQueues, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new errors.EmptyCallbackReplyError());
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

  delete(namespace: string, cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const { keyNamespaces } = redisKeys.getMainKeys();
        async.waterfall(
          [
            (cb: ICallback<void>) => {
              client.sismember(keyNamespaces, namespace, (err, isMember) => {
                if (err) cb(err);
                else if (!isMember) cb(new NamespaceNotFoundError(namespace));
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
                  multi.srem(keyNamespaces, namespace);
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
