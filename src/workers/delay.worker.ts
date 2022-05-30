import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../lib/message/message';
import { async, RedisClient, Worker } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { scheduleMessage } from '../lib/broker/schedule-message';

export class DelayWorker extends Worker {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;
  protected redisClient: RedisClient;

  constructor(redisClient: RedisClient, managed: boolean) {
    super(managed);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getMainKeys();
  }

  work = (cb: ICallback<void>): void => {
    const { keyDelayedMessages } = redisKeys.getMainKeys();
    this.redisClient.lrange(keyDelayedMessages, 0, 99, (err, reply) => {
      if (err) cb(err);
      else {
        const messages = reply ?? [];
        if (messages.length) {
          const multi = this.redisClient.multi();
          async.each(
            messages,
            (i, _, done) => {
              multi.lrem(keyDelayedMessages, 1, i);
              const message = Message.createFromMessage(i);
              message.getRequiredMetadata().incrAttempts();
              const delay = message.getRetryDelay();
              message.getRequiredMetadata().setNextRetryDelay(delay);
              scheduleMessage(multi, message);
              done();
            },
            (err) => {
              if (err) cb(err);
              else multi.exec((err) => cb(err));
            },
          );
        } else cb();
      }
    });
  };
}

export default DelayWorker;
