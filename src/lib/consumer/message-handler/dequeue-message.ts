/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParsedParams,
  IQueueRateLimit,
  TQueueConsumer,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  PanicError,
  RedisClient,
  Ticker,
} from 'redis-smq-common';
import { MessageHandler } from './message-handler';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { QueueNotFoundError } from '../../queue/errors';
import { _getQueueProperties } from '../../queue/queue/_get-queue-properties';
import { _hasRateLimitExceeded } from '../../queue/queue-rate-limit/_has-rate-limit-exceeded';
import {
  ConsumerGroupIdNotSupportedError,
  ConsumerGroupIdRequiredError,
} from '../errors';
import { _saveConsumerGroup } from '../consumer-groups/_save-consumer-group';

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
  protected queue: IQueueParsedParams;
  protected consumerId: string;
  protected queueRateLimit: IQueueRateLimit | null = null;
  protected ticker: Ticker;
  protected messageHandler: MessageHandler;
  protected blockUntilMessageReceived: boolean = true;
  protected queueType: EQueueType | null = null;

  protected keyQueues: string;
  protected keyQueueConsumers: string;
  protected keyConsumerQueues: string;
  protected keyProcessingQueues: string;
  protected keyQueueProcessingQueues: string;

  protected keyQueueProcessing: string;
  protected keyQueuePending: string;
  protected keyQueuePriorityPending: string;

  constructor(messageHandler: MessageHandler, redisClient: RedisClient) {
    this.messageHandler = messageHandler;
    this.redisClient = redisClient;
    this.queue = messageHandler.getQueue();
    this.consumerId = messageHandler.getConsumerId();
    const {
      keyQueues,
      keyQueueConsumers,
      keyConsumerQueues,
      keyProcessingQueues,
      keyQueueProcessingQueues,
      keyQueuePending,
      keyQueuePriorityPending,
      keyQueueProcessing,
    } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
      this.queue.groupId,
    );
    this.keyQueuePriorityPending = keyQueuePriorityPending;
    this.keyQueuePending = keyQueuePending;
    this.keyQueueProcessing = keyQueueProcessing;
    this.keyQueues = keyQueues;
    this.keyQueueConsumers = keyQueueConsumers;
    this.keyConsumerQueues = keyConsumerQueues;
    this.keyProcessingQueues = keyProcessingQueues;
    this.keyQueueProcessingQueues = keyQueueProcessingQueues;
    this.ticker = new Ticker(() => {
      this.messageHandler.emit('next');
    });
  }

  protected handleMessage: ICallback<string | null> = (err, messageId) => {
    if (err) {
      this.ticker.abort();
      this.messageHandler.handleError(err);
    } else if (typeof messageId === 'string') {
      this.messageHandler.emit(
        'messageReceived',
        messageId,
        this.queue,
        this.consumerId,
      );
    } else {
      this.ticker.nextTick();
    }
  };

  protected dequeueWithRateLimit = (): boolean => {
    if (this.queueRateLimit) {
      _hasRateLimitExceeded(
        this.redisClient,
        this.queue.queueParams,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) this.messageHandler.handleError(err);
          else if (isExceeded) this.ticker.nextTick();
          else this.dequeueWithRateLimitExec();
        },
      );
      return true;
    }
    return false;
  };

  protected dequeueWithRateLimitExec = () => {
    if (this.isPriorityQueuingEnabled()) this.dequeueWithPriority();
    else this.dequeueAndReturn();
  };

  protected dequeueWithPriority = (): boolean => {
    if (this.isPriorityQueuingEnabled()) {
      this.redisClient.zpoprpush(
        this.keyQueuePriorityPending,
        this.keyQueueProcessing,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndBlock = (): boolean => {
    if (this.blockUntilMessageReceived) {
      this.redisClient.brpoplpush(
        this.keyQueuePending,
        this.keyQueueProcessing,
        0,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndReturn = (): void => {
    this.redisClient.rpoplpush(
      this.keyQueuePending,
      this.keyQueueProcessing,
      this.handleMessage,
    );
  };

  disableConnectionBlocking(): DequeueMessage {
    this.blockUntilMessageReceived = false;
    return this;
  }

  dequeue(): void {
    this.dequeueWithRateLimit() ||
      this.dequeueWithPriority() ||
      this.dequeueAndBlock() ||
      this.dequeueAndReturn();
  }

  protected isPriorityQueuingEnabled(): boolean {
    return this.queueType === EQueueType.PRIORITY_QUEUE;
  }

  run(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const consumerInfo: TQueueConsumer = {
            ipAddress: IPAddresses,
            hostname: os.hostname(),
            pid: process.pid,
            createdAt: Date.now(),
          };
          this.redisClient.runScript(
            ELuaScriptName.INIT_CONSUMER_QUEUE,
            [
              this.keyQueues,
              this.keyQueueConsumers,
              this.keyConsumerQueues,
              this.keyProcessingQueues,
              this.keyQueueProcessingQueues,
            ],
            [
              this.consumerId,
              JSON.stringify(consumerInfo),
              JSON.stringify(this.queue.queueParams),
              this.keyQueueProcessing,
            ],
            (err, reply) => {
              if (err) cb(err);
              else if (!reply) cb(new QueueNotFoundError());
              else cb();
            },
          );
        },
        (cb: ICallback<void>) => {
          _getQueueProperties(
            this.redisClient,
            this.queue.queueParams,
            (err, queueProperties) => {
              if (err) cb(err);
              else if (!queueProperties) cb(new CallbackEmptyReplyError());
              else {
                this.queueType = queueProperties.queueType;
                this.queueRateLimit = queueProperties.rateLimit ?? null;
                const { queueParams, groupId } = this.queue;
                // P2P delivery model
                if (
                  queueProperties.deliveryModel ===
                  EQueueDeliveryModel.POINT_TO_POINT
                ) {
                  if (groupId) cb(new ConsumerGroupIdNotSupportedError());
                  else cb();
                }
                // PubSub delivery model
                else if (
                  queueProperties.deliveryModel === EQueueDeliveryModel.PUB_SUB
                ) {
                  if (!groupId) cb(new ConsumerGroupIdRequiredError());
                  else
                    _saveConsumerGroup(
                      this.redisClient,
                      queueParams,
                      groupId,
                      (err) => cb(err),
                    );
                }
                // Unknown delivery model
                else cb(new PanicError('UNKNOWN_DELIVERY_MODEL'));
              }
            },
          );
        },
      ],
      cb,
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once('down', cb);
    this.ticker.quit();
  }
}
