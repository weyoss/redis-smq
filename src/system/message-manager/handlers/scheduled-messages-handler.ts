import { Message } from '../../../message';
import { redisKeys } from '../../redis-keys';
import * as async from 'async';
import { Scheduler } from '../../scheduler';
import { LockManager } from '../../lock-manager';
import { RedisClient } from '../../redis-client/redis-client';
import { ICallback } from '../../../../types';

export class ScheduledMessagesHandler {
  schedule(
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    timestamp: number,
    cb: ICallback<void>,
  ): void {
    const { keyQueueScheduledMessages } = redisKeys.getKeys(queueName);
    redisClient.zadd(
      keyQueueScheduledMessages,
      timestamp,
      JSON.stringify(message),
      (err) => cb(err),
    );
  }

  enqueueScheduledMessages(
    redisClient: RedisClient,
    scheduler: Scheduler,
    queueName: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyLockScheduler } = redisKeys.getKeys(queueName);
    const lockManager = new LockManager(redisClient);
    const enqueue = (messages: string[], cb: ICallback<void>) => {
      if (messages.length) {
        async.each<string, Error>(
          messages,
          (msg, done) => {
            const message = Message.createFromMessage(msg);
            const { keyQueue, keyQueuePriority, keyQueueScheduledMessages } =
              redisKeys.getKeys(queueName);
            const multi = redisClient.multi();
            multi.zrem(keyQueueScheduledMessages, JSON.stringify(message));
            const priority = withPriority
              ? message.getSetPriority(undefined)
              : null;
            if (typeof priority === 'number') {
              multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
            } else {
              multi.lpush(keyQueue, JSON.stringify(message));
            }
            redisClient.execMulti(multi, (err) => done(err));
          },
          cb,
        );
      } else cb();
    };
    const fetch = (cb: ICallback<Message[]>) => {
      const { keyQueueScheduledMessages } = redisKeys.getKeys(queueName);
      redisClient.zrangebyscore(
        keyQueueScheduledMessages,
        0,
        Date.now(),
        (err, reply) => {
          if (err) cb(err);
          else {
            const messages = (reply ?? []).map((i) =>
              Message.createFromMessage(i),
            );
            cb(null, messages);
          }
        },
      );
    };
    const cleanup = (cb: ICallback<void>) => {
      lockManager.releaseLock(cb);
    };
    lockManager.acquireLock(keyLockScheduler, 10000, false, (err, acquired) => {
      if (err) cb(err);
      else if (acquired)
        async.waterfall([fetch, enqueue, cleanup], (err) => cb(err));
      else cleanup(cb);
    });
  }
}
