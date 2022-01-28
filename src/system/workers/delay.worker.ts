import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { ICallback, TConsumerWorkerParameters } from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import * as async from 'async';
import { Message } from '../message/message';
import { broker } from '../common/broker';
import { ConsumerWorker } from '../consumer/consumer-worker';
import { setConfiguration } from '../common/configuration';

export class DelayWorker extends ConsumerWorker {
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;

  constructor(redisClient: RedisClient) {
    super(redisClient);
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
            (i, done) => {
              multi.lrem(keyDelayedMessages, 1, i);
              const message = Message.createFromMessage(i);
              message.incrAttempts();
              const delay = message.getRetryDelay();
              message.setNextRetryDelay(delay);
              broker.schedule(multi, message);
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

process.on('message', (c: string) => {
  const { config }: TConsumerWorkerParameters = JSON.parse(c);
  setConfiguration(config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new DelayWorker(client).run();
  });
});
