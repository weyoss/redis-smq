import { EQueueProperty, IQueueParams, IQueueRateLimit } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueRateLimitError } from './errors';
import { Queue } from './queue/queue';
import {
  RedisClient,
  ICallback,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { _getQueueParams } from './queue/_get-queue-params';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class QueueRateLimit {
  protected queue: Queue;

  constructor() {
    this.queue = new Queue();
  }

  clear(queue: string | IQueueParams, cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        const { keyQueueProperties, keyQueueRateLimitCounter } =
          redisKeys.getQueueKeys(queueParams);
        const multi = client.multi();
        multi.hdel(keyQueueProperties, String(EQueueProperty.RATE_LIMIT));
        multi.del(keyQueueRateLimitCounter);
        multi.exec((err) => cb(err));
      }
    });
  }

  set(
    queue: string | IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<void>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        // validating rateLimit params from a javascript client
        const limit = Number(rateLimit.limit);
        if (isNaN(limit) || limit <= 0) {
          cb(
            new QueueRateLimitError(
              `Invalid rateLimit.limit. Expected a positive integer > 0`,
            ),
          );
        }
        const interval = Number(rateLimit.interval);
        if (isNaN(interval) || interval < 1000) {
          cb(
            new QueueRateLimitError(
              `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
            ),
          );
        }
        const validatedRateLimit: IQueueRateLimit = { interval, limit };
        const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams);
        client.hset(
          keyQueueProperties,
          String(EQueueProperty.RATE_LIMIT),
          JSON.stringify(validatedRateLimit),
          (err) => cb(err),
        );
      }
    });
  }

  hasExceeded(
    queue: IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else QueueRateLimit.hasExceeded(client, queue, rateLimit, cb);
    });
  }

  get(
    queue: string | IQueueParams,
    cb: ICallback<IQueueRateLimit | null>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams);
        client.hget(
          keyQueueProperties,
          String(EQueueProperty.RATE_LIMIT),
          (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(null, null);
            else {
              const rateLimit: IQueueRateLimit = JSON.parse(reply);
              cb(null, rateLimit);
            }
          },
        );
      }
    });
  }

  static hasExceeded(
    redisClient: RedisClient,
    queue: IQueueParams,
    rateLimit: IQueueRateLimit,
    cb: ICallback<boolean>,
  ): void {
    const { limit, interval } = rateLimit;
    const { keyQueueRateLimitCounter } = redisKeys.getQueueKeys(queue);
    redisClient.runScript(
      ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
      [keyQueueRateLimitCounter],
      [limit, interval],
      (err, reply) => {
        if (err) cb(err);
        else {
          const hasExceeded = Boolean(reply);
          cb(null, hasExceeded);
        }
      },
    );
  }
}
