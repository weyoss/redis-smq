import { TConsumerWorkerParameters } from '../../../types';
import { Ticker } from '../common/ticker/ticker';
import { MessageManager } from '../message-manager/message-manager';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../common/redis-client/redis-client';
import { Logger } from '../common/logger';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

export class ScheduleWorker {
  protected messageManager: MessageManager;
  protected ticker: Ticker;

  constructor(messageManager: MessageManager, tickPeriod = 1000) {
    this.messageManager = messageManager;
    this.ticker = new Ticker(this.onTick, tickPeriod);
    this.ticker.nextTick();
  }

  onTick = (): void => {
    this.messageManager.enqueueScheduledMessages((err) => {
      if (err) throw err;
      this.ticker.nextTick();
    });
  };
}

process.on('message', (c: string) => {
  const { config, consumerId }: TConsumerWorkerParameters = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(ScheduleWorker.name, {
        ...config.log,
        options: {
          ...config.log?.options,
          consumerId,
        },
      });
      const messageManager = new MessageManager(client, logger, config);
      new ScheduleWorker(messageManager);
    }
  });
});
