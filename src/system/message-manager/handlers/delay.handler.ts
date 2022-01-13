import { Message } from '../../message';
import { ScheduleHandler } from './schedule.handler';
import * as async from 'async';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ICallback } from '../../../../types';
import { Handler } from './handler';
import { RedisClient } from '../../common/redis-client/redis-client';

export class DelayHandler extends Handler {
  protected scheduleHandler: ScheduleHandler;

  constructor(redisClient: RedisClient, scheduleHandler: ScheduleHandler) {
    super(redisClient);
    this.scheduleHandler = scheduleHandler;
  }

  schedule(cb: ICallback<void>): void {
    const { keyDelayedMessages } = redisKeys.getGlobalKeys();
    this.redisClient.lrange(keyDelayedMessages, 0, 99, (err, reply) => {
      if (err) cb(err);
      else {
        const messages = reply ?? [];
        if (messages.length) {
          const multi = this.redisClient.multi();
          async.each(
            messages,
            (i, done) => {
              multi.lrem(keyDelayedMessages, 1, i);
              const message = Message.createFromMessage(i);
              message.incrAttempts();
              const delay = message.getRetryDelay();
              message.setScheduledDelay(delay);
              this.scheduleHandler.schedule(message, multi);
              done();
            },
            (err) => {
              if (err) cb(err);
              else this.redisClient.execMulti(multi, (err) => cb(err));
            },
          );
        } else cb();
      }
    });
  }
}
