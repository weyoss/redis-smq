import { Ticker } from '../ticker';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../redis-keys';
import { EventEmitter } from 'events';
import { events } from '../events';
import { Message } from '../../message';
import * as async from 'async';
import { IConfig } from '../../../types';
import { LockManager } from '../lock-manager';

export class RequeueWorker extends EventEmitter {
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected redisKeys: ReturnType<typeof redisKeys['getGlobalKeys']>;
  protected withPriority: boolean;
  protected lockManager: LockManager;

  constructor(redisClient: RedisClient, withPriority: boolean) {
    super();
    this.ticker = new Ticker(this.onTick, 1000);
    this.redisClient = redisClient;
    this.redisKeys = redisKeys.getGlobalKeys();
    this.withPriority = withPriority;
    this.lockManager = new LockManager(redisClient);
  }

  onTick = (): void => {
    const { keyLockWorkerRequeue } = this.redisKeys;
    this.lockManager.acquireLock(keyLockWorkerRequeue, 10000, true, (err) => {
      if (err) throw err;
      const { keyQueueDelay } = this.redisKeys;
      this.redisClient.lrange(keyQueueDelay, 0, 99, (err, reply) => {
        if (err) this.emit(events.ERROR, err);
        else {
          const messages = reply ?? [];
          if (messages.length) {
            const multi = this.redisClient.multi();
            const tasks = messages.map((i) => (cb: () => void) => {
              const message = Message.createFromMessage(i);
              const queueName = message.getQueue();
              if (!queueName)
                throw new Error('Got a message without queue name');
              const { keyQueue, keyQueuePriority } =
                redisKeys.getKeys(queueName);
              multi.lrem(keyQueueDelay, 1, i);
              if (this.withPriority) {
                const priority = message.getSetPriority(undefined);
                multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
              } else multi.lpush(keyQueue, i);
              cb();
            });
            async.parallel(tasks, (err) => {
              if (err) this.emit(events.ERROR, err);
              else {
                this.redisClient.execMulti(multi, (err) => {
                  if (err) this.emit(events.ERROR, err);
                });
              }
            });
          }
        }
      });
    });
  };
}

process.on('message', (c: string) => {
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (redisClient) => {
    new RequeueWorker(redisClient, config.priorityQueue === true);
  });
});
