import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { ICallback, IConsumerWorkerParameters } from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { Message } from '../message/message';
import { broker } from '../common/broker';
import { Worker } from '../common/worker/worker';
import { setConfiguration } from '../common/configuration';
import { each } from '../lib/async';

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
          each(
            messages,
            (i, _, done) => {
              multi.lrem(keyDelayedMessages, 1, i);
              const message = Message.createFromMessage(i);
              message.getRequiredMetadata().incrAttempts();
              const delay = message.getRetryDelay();
              message.getRequiredMetadata().setNextRetryDelay(delay);
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

export default DelayWorker;

process.on('message', (payload: string) => {
  const params: IConsumerWorkerParameters = JSON.parse(payload);
  setConfiguration(params.config);
  RedisClient.getNewInstance((err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else new DelayWorker(client, params, false).run();
  });
});
