import * as os from 'os';
import {
  EQueueType,
  TConsumerInfo,
  TQueueParams,
  TQueueRateLimit,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { async, errors, RedisClient, Ticker } from 'redis-smq-common';
import { events } from '../../../common/events/events';
import { Message } from '../../message/message';
import { MessageHandler } from './message-handler';
import { QueueRateLimit } from '../../queue-manager/queue-rate-limit';
import { Queue } from '../../queue-manager/queue';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { QueueNotFoundError } from '../../queue-manager/errors/queue-not-found.error';
import { ICallback } from 'redis-smq-common/dist/types';

const IPAddresses = (() => {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const netInterface in nets) {
    const addr = nets[netInterface] ?? [];
    for (const netAddr of addr) {
      if (netAddr.family === 'IPv4' && !netAddr.internal) {
        addresses.push(netAddr.address);
      }
    }
  }
  return addresses;
})();

export class DequeueMessage {
  protected redisClient: RedisClient;
  protected queue: TQueueParams;
  protected consumerId: string;
  protected redisKeys: ReturnType<typeof redisKeys['getQueueConsumerKeys']>;
  protected queueRateLimit: TQueueRateLimit | null = null;
  protected ticker: Ticker;
  protected messageHandler: MessageHandler;
  protected queueType: EQueueType | null = null;

  constructor(messageHandler: MessageHandler, redisClient: RedisClient) {
    this.messageHandler = messageHandler;
    this.redisClient = redisClient;
    this.queue = messageHandler.getQueue();
    this.consumerId = messageHandler.getConsumerId();
    this.redisKeys = redisKeys.getQueueConsumerKeys(
      this.queue,
      this.consumerId,
    );
    this.ticker = new Ticker(() => this.dequeue());
  }

  protected dequeueMessageWithPriority(cb: ICallback<string | null>): void {
    this.redisClient.zpophgetrpush(
      this.redisKeys.keyQueuePendingPriorityMessageWeight,
      this.redisKeys.keyQueuePendingPriorityMessages,
      this.redisKeys.keyQueueProcessing,
      cb,
    );
  }

  protected waitForMessage(cb: ICallback<string | null>): void {
    this.redisClient.brpoplpush(
      this.redisKeys.keyQueuePending,
      this.redisKeys.keyQueueProcessing,
      0,
      cb,
    );
  }

  protected dequeueMessage(cb: ICallback<string | null>): void {
    this.redisClient.rpoplpush(
      this.redisKeys.keyQueuePending,
      this.redisKeys.keyQueueProcessing,
      cb,
    );
  }

  dequeue(): void {
    const cb: ICallback<string | null> = (err, reply) => {
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
      if (this.isPriorityQueuingEnabled()) this.dequeueMessageWithPriority(cb);
      else this.dequeueMessage(cb);
    };
    if (this.isPriorityQueuingEnabled() || this.queueRateLimit) {
      if (this.queueRateLimit) {
        QueueRateLimit.hasExceeded(
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
  }

  protected isPriorityQueuingEnabled(): boolean {
    return this.queueType === EQueueType.PRIORITY_QUEUE;
  }

  run(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const {
            keyQueues,
            keyQueueConsumers,
            keyConsumerQueues,
            keyQueueProcessing,
            keyProcessingQueues,
            keyQueueProcessingQueues,
          } = this.redisKeys;
          const consumerInfo: TConsumerInfo = {
            ipAddress: IPAddresses,
            hostname: os.hostname(),
            pid: process.pid,
            createdAt: Date.now(),
          };
          this.redisClient.runScript(
            ELuaScriptName.INIT_CONSUMER_QUEUE,
            [
              keyQueues,
              keyQueueConsumers,
              keyConsumerQueues,
              keyProcessingQueues,
              keyQueueProcessingQueues,
            ],
            [
              this.consumerId,
              JSON.stringify(consumerInfo),
              JSON.stringify(this.queue),
              keyQueueProcessing,
            ],
            (err, reply) => {
              if (err) cb(err);
              else if (!reply) cb(new QueueNotFoundError());
              else cb();
            },
          );
        },
        (cb: ICallback<void>) => {
          Queue.getSettings(
            this.messageHandler.getConfig(),
            this.redisClient,
            this.queue,
            (err, reply) => {
              if (err) cb(err);
              else if (!reply) cb(new errors.EmptyCallbackReplyError());
              else {
                this.queueType = reply.type;
                this.queueRateLimit = reply.rateLimit ?? null;
                cb();
              }
            },
          );
        },
      ],
      cb,
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
