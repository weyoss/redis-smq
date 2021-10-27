import { Ticker } from '../ticker';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../redis-keys';
import { EventEmitter } from 'events';
import { LockManager } from '../lock-manager';
import { IConfig } from '../../../types';
import { MessageManager } from '../../message-manager';

export class DelayWorker extends EventEmitter {
  protected ticker: Ticker;
  protected messageManager: MessageManager;
  protected lockManager: LockManager;
  protected redisKeys: ReturnType<typeof redisKeys['getGlobalKeys']>;

  constructor(messageManager: MessageManager, lockManager: LockManager) {
    super();
    this.ticker = new Ticker(this.onTick, 1000);
    this.messageManager = messageManager;
    this.redisKeys = redisKeys.getGlobalKeys();
    this.lockManager = lockManager;
    this.ticker.nextTick();
  }

  onTick = (): void => {
    const { keyLockWorkerDelay } = this.redisKeys;
    this.lockManager.acquireLock(keyLockWorkerDelay, 10000, true, (err) => {
      if (err) throw err;
      this.messageManager.scheduleDelayedMessages((err) => {
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
    const messageManager = new MessageManager(redisClient);
    const lockManager = new LockManager(redisClient);
    new DelayWorker(messageManager, lockManager);
  });
});
