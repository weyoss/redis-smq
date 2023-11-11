import * as os from 'os';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueType,
  TQueueConsumer,
  IQueueParams,
  IQueueRateLimit,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import {
  async,
  errors,
  RedisClient,
  Ticker,
  ICallback,
} from 'redis-smq-common';
import { events } from '../../../common/events/events';
import { MessageHandler } from './message-handler';
import { QueueRateLimit } from '../../queue/queue-rate-limit';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { QueueNotFoundError } from '../../queue/errors/queue-not-found.error';
import { _getQueueProperties } from '../../queue/queue/_get-queue-properties';
import { _fromMessage } from '../../message/_from-message';

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
  protected queue: IQueueParams;
  protected consumerId: string;
  protected redisKeys: ReturnType<typeof redisKeys['getQueueConsumerKeys']>;
  protected queueRateLimit: IQueueRateLimit | null = null;
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

  protected emitReceivedMessage(messageId: string): void {
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const keys: string[] = [keyMessage];
    const argv: (string | number)[] = [
      EMessageProperty.STATUS,
      EMessageProperty.STATE,
      EMessageProperty.MESSAGE,
      EMessagePropertyStatus.PROCESSING,
    ];
    this.redisClient.runScript(
      ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) this.messageHandler.handleError(err);
        else if (!reply)
          this.messageHandler.handleError(new errors.EmptyCallbackReplyError());
        else if (!Array.isArray(reply))
          this.messageHandler.handleError(
            new errors.InvalidCallbackReplyError(),
          );
        else {
          const [state, msg]: string[] = reply;
          const message = _fromMessage(msg, state);
          this.messageHandler.emit(events.MESSAGE_RECEIVED, message);
        }
      },
    );
  }

  protected dequeueMessageWithPriority(cb: ICallback<string | null>): void {
    this.redisClient.zpoprpush(
      this.redisKeys.keyPriorityQueuePending,
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
        this.emitReceivedMessage(reply);
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
          const consumerInfo: TQueueConsumer = {
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
          _getQueueProperties(this.redisClient, this.queue, (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new errors.EmptyCallbackReplyError());
            else {
              this.queueType = reply.queueType;
              this.queueRateLimit = reply.rateLimit ?? null;
              cb();
            }
          });
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
