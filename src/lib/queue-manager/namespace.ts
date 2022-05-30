import { IRequiredConfig, TQueueParams } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { async, errors, RedisClient } from 'redis-smq-common';
import { NamespaceNotFoundError } from './errors/namespace-not-found.error';
import { initDeleteQueueTransaction } from './delete-queue-transaction';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class Namespace {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;
  protected config: IRequiredConfig;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.redisClient = redisClient;
    this.logger = logger;
    this.config = config;
  }

  list(cb: ICallback<string[]>): void {
    const { keyNamespaces } = redisKeys.getMainKeys();
    this.redisClient.smembers(keyNamespaces, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new errors.EmptyCallbackReplyError());
      else cb(null, reply);
    });
  }

  getQueues(namespace: string, cb: ICallback<TQueueParams[]>): void {
    const { keyNsQueues } = redisKeys.getNamespaceKeys(namespace);
    this.redisClient.smembers(keyNsQueues, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new errors.EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }

  delete(ns: string, cb: ICallback<void>): void {
    const { keyNamespaces } = redisKeys.getMainKeys();
    async.waterfall(
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
              async.eachOf(
                queues,
                (queueParams, _, done) => {
                  initDeleteQueueTransaction(
                    this.config,
                    this.redisClient,
                    queueParams,
                    multi,
                    (err) => done(err),
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
}
