import { ICallback, TQueueParams, TQueueRateLimit } from '../../../../../types';
import { queueManager } from '../../queue-manager/queue-manager';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { Ticker } from '../../../common/ticker/ticker';
import { events } from '../../../common/events';
import { consumerQueues } from '../consumer-queues';
import { processingQueue } from './processing-queue';
import { Message } from '../../message/message';
import { MessageHandler } from './message-handler';

export class DequeueMessage {
  protected redisClient: RedisClient;
  protected queue: TQueueParams;
  protected consumerId: string;
  protected keyQueuePending: string;
  protected keyQueuePriority: string;
  protected keyPendingMessagesWithPriority: string;
  protected keyQueueProcessing: string;
  protected usingPriorityQueuing: boolean;
  protected queueRateLimit: TQueueRateLimit | null = null;
  protected ticker: Ticker;
  protected messageHandler: MessageHandler;

  constructor(messageHandler: MessageHandler, redisClient: RedisClient) {
    this.messageHandler = messageHandler;
    this.redisClient = redisClient;
    this.queue = messageHandler.getQueue();
    this.consumerId = messageHandler.getConsumerId();
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePending,
      keyQueuePendingPriorityMessages,
      keyQueueProcessing,
    } = redisKeys.getQueueConsumerKeys(this.queue, this.consumerId);
    this.keyQueuePending = keyQueuePending;
    this.keyPendingMessagesWithPriority = keyQueuePendingPriorityMessages;
    this.keyQueuePriority = keyQueuePendingPriorityMessageIds;
    this.keyQueueProcessing = keyQueueProcessing;
    this.usingPriorityQueuing = messageHandler.isUsingPriorityQueuing();
    this.ticker = new Ticker(this.dequeue);
  }

  protected dequeueMessageWithPriority(cb: ICallback<string>): void {
    this.redisClient.zpophgetrpush(
      this.keyQueuePriority,
      this.keyPendingMessagesWithPriority,
      this.keyQueueProcessing,
      cb,
    );
  }

  protected waitForMessage(cb: ICallback<string>): void {
    this.redisClient.brpoplpush(
      this.keyQueuePending,
      this.keyQueueProcessing,
      0,
      cb,
    );
  }

  protected dequeueMessage(cb: ICallback<string>): void {
    this.redisClient.rpoplpush(
      this.keyQueuePending,
      this.keyQueueProcessing,
      cb,
    );
  }

  dequeue = (): void => {
    const cb: ICallback<string> = (err, reply) => {
      if (err) {
        this.ticker.abort();
        this.messageHandler.handleError(err);
      } else if (typeof reply === 'string') {
        const message = Message.createFromMessage(reply);
        this.messageHandler.emit(events.MESSAGE_RECEIVED, message);
      } else {
        this.ticker.nextTick();
      }
    };
    const deq = () => {
      if (this.usingPriorityQueuing) this.dequeueMessageWithPriority(cb);
      else this.dequeueMessage(cb);
    };
    if (this.usingPriorityQueuing || this.queueRateLimit) {
      if (this.queueRateLimit) {
        queueManager.hasQueueRateLimitExceeded(
          this.redisClient,
          this.queue,
          this.queueRateLimit,
          (err, isExceeded) => {
            if (err) this.messageHandler.handleError(err);
            else if (isExceeded) this.ticker.nextTick();
            else deq();
          },
        );
      } else deq();
    } else {
      this.waitForMessage(cb);
    }
  };

  run = (cb: ICallback<void>): void => {
    queueManager.getQueueRateLimit(
      this.redisClient,
      this.queue,
      (err, rateLimit) => {
        if (err) cb(err);
        else {
          this.queueRateLimit = rateLimit ?? null;
          const multi = this.redisClient.multi();
          queueManager.setUpMessageQueue(multi, this.queue);
          consumerQueues.addConsumer(multi, this.queue, this.consumerId);
          processingQueue.setUpProcessingQueue(
            multi,
            this.queue,
            this.consumerId,
          );
          this.redisClient.execMulti(multi, (err) => cb(err));
        }
      },
    );
  };

  quit = (cb: ICallback<void>): void => {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  };
}
