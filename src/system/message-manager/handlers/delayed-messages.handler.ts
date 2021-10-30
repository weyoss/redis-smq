import { Message } from '../../message';
import { ScheduledMessagesHandler } from './scheduled-messages.handler';
import * as async from 'async';
import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys';
import { ICallback } from '../../../../types';

export class DelayedMessagesHandler {
  schedule(redisClient: RedisClient, cb: ICallback<void>): void {
    const { keyQueueDelay, keyQueueScheduled } = redisKeys.getGlobalKeys();
    redisClient.lrange(keyQueueDelay, 0, 99, (err, reply) => {
      if (err) cb(err);
      else {
        const messages = reply ?? [];
        if (messages.length) {
          const multi = redisClient.multi();
          const tasks = messages.map((i) => (cb: () => void) => {
            multi.lrem(keyQueueDelay, 1, i);
            const message = Message.createFromMessage(i);
            message.incrAttempts();
            const delay = message.getRetryDelay();
            message.setScheduledDelay(delay);
            const timestamp =
              ScheduledMessagesHandler.getNextScheduledTimestamp(message);
            multi.zadd(keyQueueScheduled, timestamp, JSON.stringify(message));
            cb();
          });
          async.parallel(tasks, (err) => {
            if (err) cb(err);
            else redisClient.execMulti(multi, (err) => cb(err));
          });
        } else cb();
      }
    });
  }
}
