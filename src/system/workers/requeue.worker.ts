import { Ticker } from '../common/ticker/ticker';
import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { Message } from '../message';
import * as async from 'async';
import { TConsumerWorkerParameters } from '../../../types';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';
import { PanicError } from '../common/errors/panic.error';

export class RequeueWorker {
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected redisKeys: ReturnType<typeof redisKeys['getGlobalKeys']>;

  constructor(redisClient: RedisClient) {
    this.ticker = new Ticker(this.onTick, 1000);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getGlobalKeys();
    this.ticker.nextTick();
  }

  onTick = (): void => {
    const { keyMessagesRequeue } = this.redisKeys;
    this.redisClient.lrange(keyMessagesRequeue, 0, 99, (err, reply) => {
      if (err) throw err;
      const messages = reply ?? [];
      if (messages.length) {
        const multi = this.redisClient.multi();
        const tasks = messages.map((i) => (cb: () => void) => {
          const message = Message.createFromMessage(i);
          const queue = message.getQueue();
          if (!queue)
            throw new PanicError('Message queue parameters are required');
          const { ns, name } = queue;
          const { keyQueuePending, keyQueuePriority } = redisKeys.getQueueKeys(
            name,
            ns,
          );
          multi.lrem(keyMessagesRequeue, 1, i);
          message.incrAttempts();
          if (message.isWithPriority()) {
            const priority = message.getPriority();
            if (priority === null)
              throw new PanicError(
                `Expected a non-empty message priority value`,
              );
            multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
          } else multi.lpush(keyQueuePending, JSON.stringify(message));
          cb();
        });
        async.parallel(tasks, () => {
          this.redisClient.execMulti(multi, (err) => {
            if (err) throw err;
            this.ticker.nextTick();
          });
        });
      } else this.ticker.nextTick();
    });
  };
}

process.on('message', (c: string) => {
  const { config }: TConsumerWorkerParameters = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      new RequeueWorker(client);
    }
  });
});
