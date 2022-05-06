import { RedisClient } from '../../common/redis-client/redis-client';
import { ICallback, TQueueParams } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { eachOf, waterfall } from '../../lib/async';
import { NamespaceNotFoundError } from './errors/namespace-not-found.error';
import { deleteQueueTransaction } from './queue';

export function getNamespaces(
  redisClient: RedisClient,
  cb: ICallback<string[]>,
): void {
  const { keyNamespaces } = redisKeys.getMainKeys();
  redisClient.smembers(keyNamespaces, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new EmptyCallbackReplyError());
    else cb(null, reply);
  });
}

export function getNamespaceQueues(
  redisClient: RedisClient,
  namespace: string,
  cb: ICallback<TQueueParams[]>,
): void {
  const { keyNsQueues } = redisKeys.getNsKeys(namespace);
  redisClient.smembers(keyNsQueues, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new EmptyCallbackReplyError());
    else {
      const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
      cb(null, messageQueues);
    }
  });
}

export function deleteNamespace(
  redisClient: RedisClient,
  ns: string,
  cb: ICallback<void>,
): void {
  const { keyNamespaces } = redisKeys.getMainKeys();
  waterfall(
    [
      (cb: ICallback<void>) => {
        redisClient.sismember(keyNamespaces, ns, (err, isMember) => {
          if (err) cb(err);
          else if (!isMember) cb(new NamespaceNotFoundError(ns));
          else cb();
        });
      },
    ],
    (err) => {
      if (err) cb(err);
      else {
        getNamespaceQueues(redisClient, ns, (err, reply) => {
          if (err) cb(err);
          else {
            const queues = reply ?? [];
            const multi = redisClient.multi();
            multi.srem(keyNamespaces, ns);
            eachOf(
              queues,
              (queueParams, _, done) => {
                deleteQueueTransaction(redisClient, queueParams, multi, (err) =>
                  done(err),
                );
              },
              (err) => {
                if (err) cb(err);
                else redisClient.execMulti(multi, (err) => cb(err));
              },
            );
          }
        });
      }
    },
  );
}
