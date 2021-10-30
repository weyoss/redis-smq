import { Ticker } from '../common/ticker';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from '../common/redis-keys';
import { EventEmitter } from 'events';
import { IConfig } from '../../../types';
import { MessageManager } from '../message-manager/message-manager';

export class DelayWorker extends EventEmitter {
  protected ticker: Ticker;
  protected messageManager: MessageManager;
  protected redisKeys: ReturnType<typeof redisKeys['getGlobalKeys']>;

  constructor(messageManager: MessageManager) {
    super();
    this.ticker = new Ticker(this.onTick, 1000);
    this.messageManager = messageManager;
    this.redisKeys = redisKeys.getGlobalKeys();
    this.ticker.nextTick();
  }

  onTick = (): void => {
    this.messageManager.scheduleDelayedMessages((err) => {
      if (err) throw err;
      this.ticker.nextTick();
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
      const messageManager = new MessageManager(client);
      new DelayWorker(messageManager);
    }
  });
});
