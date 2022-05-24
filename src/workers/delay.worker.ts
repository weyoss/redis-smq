import { redisKeys } from '../common/redis-keys/redis-keys';
import { IConsumerWorkerParameters } from '../../types';
import { Message } from '../lib/message/message';
import { broker } from '../lib/broker/broker';
import { async, RedisClient, Worker } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class DelayWorker extends Worker<IConsumerWorkerParameters> {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;

  constructor(
    redisClient: RedisClient,
    params: IConsumerWorkerParameters,
    managed: boolean,
  ) {
    super(redisClient, params, managed);
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
              broker.scheduleMessage(multi, message);
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
  };
}

export default DelayWorker;
