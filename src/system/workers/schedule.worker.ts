import { IConfig } from '../../../types';
import { Ticker } from '../common/ticker';
import { MessageManager } from '../message-manager/message-manager';
import { redisKeys } from '../common/redis-keys';
import { RedisClient } from '../redis-client/redis-client';

export class ScheduleWorker {
  protected messageManager: MessageManager;
  protected ticker: Ticker;
  protected withPriority: boolean;

  constructor(
    messageManager: MessageManager,
    withPriority: boolean,
    tickPeriod = 1000,
  ) {
    this.messageManager = messageManager;
    this.withPriority = withPriority;
    this.ticker = new Ticker(this.onTick, tickPeriod);
    this.ticker.nextTick();
  }

  onTick = (): void => {
    this.messageManager.enqueueScheduledMessages(this.withPriority, (err) => {
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
      new ScheduleWorker(messageManager, config.priorityQueue === true);
    }
  });
});
