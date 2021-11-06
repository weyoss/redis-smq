import { Ticker } from '../common/ticker';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys';
import { Message } from '../message';
import * as async from 'async';
import { IConfig } from '../../../types';

export class RequeueWorker {
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected redisKeys: ReturnType<typeof redisKeys['getGlobalKeys']>;
  protected withPriority: boolean;

  constructor(redisClient: RedisClient, withPriority: boolean) {
    this.ticker = new Ticker(this.onTick, 1000);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getGlobalKeys();
    this.withPriority = withPriority;
    this.ticker.nextTick();
  }

  onTick = (): void => {
    const { keyQueueRequeue } = this.redisKeys;
    this.redisClient.lrange(keyQueueRequeue, 0, 99, (err, reply) => {
      if (err) throw err;
      const messages = reply ?? [];
      if (messages.length) {
        const multi = this.redisClient.multi();
        const tasks = messages.map((i) => (cb: () => void) => {
          const message = Message.createFromMessage(i);
          const queue = message.getQueue();
          if (!queue) throw new Error('Got a message without a queue');
          const { ns, name } = queue;
          const { keyQueue, keyQueuePriority } = redisKeys.getKeys(name, ns);
          multi.lrem(keyQueueRequeue, 1, i);
          message.incrAttempts();
          if (this.withPriority) {
            const priority = message.getSetPriority(undefined);
            multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
          } else multi.lpush(keyQueue, JSON.stringify(message));
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
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new Error(`Expected an instance of RedisClient`);
    else {
      new RequeueWorker(client, config.priorityQueue === true);
    }
  });
});
