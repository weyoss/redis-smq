import { Ticker } from '../common/ticker/ticker';
import { RedisClient } from '../common/redis-client/redis-client';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { TConsumerWorkerParameters } from '../../../types';
import { MessageManager } from '../message-manager/message-manager';
import { Logger } from '../common/logger';
import { EmptyCallbackReplyError } from '../common/errors/empty-callback-reply.error';

export class DelayWorker extends EventEmitter {
  protected ticker: Ticker;
  protected messageManager: MessageManager;
  protected redisKeys: ReturnType<typeof redisKeys['getMainKeys']>;

  constructor(messageManager: MessageManager) {
    super();
    this.ticker = new Ticker(this.onTick, 1000);
    this.messageManager = messageManager;
    this.redisKeys = redisKeys.getMainKeys();
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
  const { config, consumerId }: TConsumerWorkerParameters = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(DelayWorker.name, {
        ...config.log,
        options: {
          ...config.log?.options,
          consumerId,
        },
      });
      const messageManager = new MessageManager(client, logger, config);
      new DelayWorker(messageManager);
    }
  });
});
