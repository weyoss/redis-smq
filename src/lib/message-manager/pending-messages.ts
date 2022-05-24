import { RedisClient } from 'redis-smq-common';
import { TGetMessagesReply, TQueueParams } from '../../../types';
import { Queue } from '../queue-manager/queue';
import { PendingPriorityMessages } from './pending-priority-messages';
import { PendingLifoMessages } from './pending-lifo-messages';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class PendingMessages {
  protected redisClient: RedisClient;
  protected pendingPriorityMessages: PendingPriorityMessages;
  protected pendingLifoMessages: PendingLifoMessages;

  constructor(redisClient: RedisClient, logger: ICompatibleLogger) {
    this.redisClient = redisClient;
    this.pendingLifoMessages = new PendingLifoMessages(redisClient, logger);
    this.pendingPriorityMessages = new PendingPriorityMessages(
      redisClient,
      logger,
    );
  }

  purge(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(queue);
    Queue.getSettings(this.redisClient, queueParams, (err, settings) => {
      if (err) cb(err);
      else if (settings?.priorityQueuing) {
        this.pendingPriorityMessages.purge(queueParams, cb);
      } else {
        this.pendingLifoMessages.purge(queueParams, cb);
      }
    });
  }

  list(
    queue: string | TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const queueParams = Queue.getParams(queue);
    Queue.getSettings(this.redisClient, queueParams, (err, settings) => {
      if (err) cb(err);
      else if (settings?.priorityQueuing) {
        this.pendingPriorityMessages.list(queueParams, skip, take, cb);
      } else {
        this.pendingLifoMessages.list(queueParams, skip, take, cb);
      }
    });
  }

  delete(
    queue: string | TQueueParams,
    messageId: string,
    sequenceId: number,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(queue);
    Queue.getSettings(this.redisClient, queueParams, (err, settings) => {
      if (err) cb(err);
      else if (settings?.priorityQueuing) {
        this.pendingPriorityMessages.delete(queueParams, messageId, cb);
      } else {
        this.pendingLifoMessages.delete(queueParams, messageId, sequenceId, cb);
      }
    });
  }
}
