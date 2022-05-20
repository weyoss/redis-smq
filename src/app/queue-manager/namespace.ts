import { RedisClient } from '../../common/redis-client/redis-client';
import { ICallback, ICompatibleLogger, TQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { eachOf, waterfall } from '../../lib/async';
import { NamespaceNotFoundError } from './errors/namespace-not-found.error';
import { getNamespacedLogger } from '../../common/logger';
import { initDeleteQueueTransaction } from './delete-queue-transaction';

export class Namespace {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  list(cb: ICallback<string[]>): void {
    const { keyNamespaces } = redisKeys.getMainKeys();
    this.redisClient.smembers(keyNamespaces, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new EmptyCallbackReplyError());
      else cb(null, reply);
    });
  }

  getQueues(namespace: string, cb: ICallback<TQueueParams[]>): void {
    const { keyNsQueues } = redisKeys.getNsKeys(namespace);
    this.redisClient.smembers(keyNsQueues, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }

  delete(ns: string, cb: ICallback<void>): void {
    const { keyNamespaces } = redisKeys.getMainKeys();
    waterfall(
      [
        (cb: ICallback<void>) => {
          this.redisClient.sismember(keyNamespaces, ns, (err, isMember) => {
            if (err) cb(err);
            else if (!isMember) cb(new NamespaceNotFoundError(ns));
            else cb();
          });
        },
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.getQueues(ns, (err, reply) => {
            if (err) cb(err);
            else {
              const queues = reply ?? [];
              const multi = this.redisClient.multi();
              multi.srem(keyNamespaces, ns);
              eachOf(
                queues,
                (queueParams, _, done) => {
                  initDeleteQueueTransaction(
                    this.redisClient,
                    queueParams,
                    multi,
                    (err) => done(err),
                  );
                },
                (err) => {
                  if (err) cb(err);
                  else this.redisClient.execMulti(multi, (err) => cb(err));
                },
              );
            }
          });
        }
      },
    );
  }
}
