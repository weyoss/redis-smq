import { IConfig } from '../../../types';
import { Ticker } from '../ticker';
import { MessageManager } from '../../message-manager';
import { LockManager } from '../lock-manager';
import { redisKeys } from '../redis-keys';
import { RedisClient } from '../redis-client/redis-client';

export class ScheduleWorker {
  protected messageManager: MessageManager;
  protected ticker: Ticker;
  protected lockManager: LockManager;
  protected withPriority: boolean;

  constructor(
    lockManager: LockManager,
    messageManager: MessageManager,
    withPriority: boolean,
    tickPeriod = 1000,
  ) {
    this.lockManager = lockManager;
    this.messageManager = messageManager;
    this.withPriority = withPriority;
    this.ticker = new Ticker(this.onTick, tickPeriod);
    this.ticker.nextTick();
  }

  onTick = (): void => {
    const { keyLockWorkerRequeue } = redisKeys.getGlobalKeys();
    this.lockManager.acquireLock(keyLockWorkerRequeue, 10000, true, (err) => {
      if (err) throw err;
      this.messageManager.enqueueScheduledMessages(this.withPriority, (err) => {
        if (err) throw err;
        this.ticker.nextTick();
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
    const lockManager = new LockManager(redisClient);
    const messageManager = new MessageManager(redisClient);
    new ScheduleWorker(
      lockManager,
      messageManager,
      config.priorityQueue === true,
    );
  });
});
