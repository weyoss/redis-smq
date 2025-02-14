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
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerDequeueMessageEvent } from '../../../../common/index.js';
import { RedisClient } from '../../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { _saveConsumerGroup } from '../../../consumer-groups/_/_save-consumer-group.js';
import { EventBus } from '../../../event-bus/index.js';
import { _hasRateLimitExceeded } from '../../../queue-rate-limit/_/_has-rate-limit-exceeded.js';
import { _getQueueProperties } from '../../../queue/_/_get-queue-properties.js';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParsedParams,
  IQueueRateLimit,
  QueueQueueNotFoundError,
  TQueueConsumer,
} from '../../../queue/index.js';
import { Consumer } from '../../consumer/consumer.js';
import {
  ConsumerConsumerGroupIdNotSupportedError,
  ConsumerConsumerGroupIdRequiredError,
} from '../../errors/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';

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

export class DequeueMessage extends Runnable<TConsumerDequeueMessageEvent> {
  protected redisClient;
  protected queue;
  protected consumerId;
  protected timer;
  protected keyQueues;
  protected keyQueueConsumers;
  protected keyConsumerQueues;
  protected keyQueueProcessingQueues;
  protected keyQueueProcessing;
  protected keyQueuePending;
  protected keyQueuePriorityPending;
  protected logger;
  protected blockUntilMessageReceived;
  protected autoCloseRedisConnection;
  protected eventBus;

  protected queueRateLimit: IQueueRateLimit | null = null;
  protected queueType: EQueueType | null = null;
  protected idleThreshold = 5;
  protected idleTrigger = 0;

  constructor(
    redisClient: RedisClient,
    queue: IQueueParsedParams,
    consumer: Consumer,
    logger: ILogger,
    eventBus: EventBus | null,
    blockUntilMessageReceived: boolean = true,
    autoCloseRedisConnection = true,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumer.getId();
    this.logger = logger;
    this.blockUntilMessageReceived = blockUntilMessageReceived;
    this.autoCloseRedisConnection = autoCloseRedisConnection;
    this.redisClient = redisClient;
    this.redisClient.on('error', (err) => this.handleError(err));
    if (!eventBus) {
      this.eventBus = new EventBus();
      this.eventBus.on('error', (err) => this.handleError(err));
    } else this.eventBus = eventBus;
    if (Configuration.getSetConfig().eventBus.enabled) {
      eventBusPublisher(this, this.eventBus, logger);
    }
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(this.consumerId);
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
    );
    const { keyQueues } = redisKeys.getMainKeys();
    const {
      keyQueueProcessingQueues,
      keyQueuePending,
      keyQueuePriorityPending,
      keyQueueConsumers,
    } = redisKeys.getQueueKeys(this.queue.queueParams, this.queue.groupId);
    this.keyQueuePriorityPending = keyQueuePriorityPending;
    this.keyQueuePending = keyQueuePending;
    this.keyQueueProcessing = keyQueueProcessing;
    this.keyQueues = keyQueues;
    this.keyQueueConsumers = keyQueueConsumers;
    this.keyConsumerQueues = keyConsumerQueues;
    this.keyQueueProcessingQueues = keyQueueProcessingQueues;
    this.timer = new Timer();
    this.timer.on('error', (err) => this.handleError(err));
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.emit(
        'consumer.dequeueMessage.error',
        err,
        this.consumerId,
        this.queue,
      );
    }
    super.handleError(err);
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      this.redisClient.init,
      (cb: ICallback<void>) => {
        const consumerInfo: TQueueConsumer = {
          ipAddress: IPAddresses,
          hostname: os.hostname(),
          pid: process.pid,
          createdAt: Date.now(),
        };
        const redisClient = this.redisClient.getInstance();
        if (redisClient instanceof Error) {
          cb(redisClient);
          return void 0;
        }
        redisClient.runScript(
          ELuaScriptName.INIT_CONSUMER_QUEUE,
          [
            this.keyQueues,
            this.keyQueueConsumers,
            this.keyConsumerQueues,
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
            else if (!reply) cb(new QueueQueueNotFoundError());
            else cb();
          },
        );
      },
      (cb: ICallback<void>) => {
        const redisClient = this.redisClient.getInstance();
        if (redisClient instanceof Error) {
          cb(redisClient);
          return void 0;
        }
        _getQueueProperties(
          redisClient,
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
                if (groupId) cb(new ConsumerConsumerGroupIdNotSupportedError());
                else cb();
              }
              // PubSub delivery model
              else if (
                queueProperties.deliveryModel === EQueueDeliveryModel.PUB_SUB
              ) {
                if (!groupId) cb(new ConsumerConsumerGroupIdRequiredError());
                else {
                  const eventBus = this.eventBus.getInstance();
                  if (eventBus instanceof Error) cb(eventBus);
                  else
                    _saveConsumerGroup(
                      redisClient,
                      eventBus,
                      queueParams,
                      groupId,
                      (err) => cb(err),
                    );
                }
              }
              // Unknown delivery model
              else cb(new PanicError('UNKNOWN_DELIVERY_MODEL'));
            }
          },
        );
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>): void => {
        this.timer.reset();
        if (!this.autoCloseRedisConnection) return cb();
        const redisClient = this.redisClient.getInstance();
        // ignoring errors
        if (redisClient instanceof Error) return cb();
        redisClient.halt(cb);
      },
    ].concat(super.goingDown());
  }

  protected updateIdle(): void {
    this.idleTrigger = this.idleTrigger + 1;
  }

  protected resetIdle(): void {
    this.idleTrigger = 0;
  }

  protected isIdle(): boolean {
    return this.idleTrigger >= this.idleThreshold;
  }

  protected isPriorityQueuingEnabled(): boolean {
    return this.queueType === EQueueType.PRIORITY_QUEUE;
  }

  protected handleMessage: ICallback<string | null> = (err, messageId) => {
    if (err) {
      this.timer.reset();
      this.handleError(err);
    } else if (typeof messageId === 'string') {
      this.resetIdle();
      this.emit(
        'consumer.dequeueMessage.messageReceived',
        messageId,
        this.queue,
        this.consumerId,
      );
    } else {
      this.updateIdle();
      this.emit('consumer.dequeueMessage.nextMessage');
    }
  };

  protected dequeueWithRateLimit = (redisClient: IRedisClient): boolean => {
    if (this.queueRateLimit) {
      _hasRateLimitExceeded(
        redisClient,
        this.queue.queueParams,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) this.handleError(err);
          else if (isExceeded)
            this.timer.setTimeout(() => {
              this.dequeue();
            }, 1000);
          else this.dequeueWithRateLimitExec(redisClient);
        },
      );
      return true;
    }
    return false;
  };

  protected dequeueWithRateLimitExec = (redisClient: IRedisClient) => {
    if (this.isPriorityQueuingEnabled()) this.dequeueWithPriority(redisClient);
    else this.dequeueAndReturn(redisClient);
  };

  protected dequeueWithPriority = (redisClient: IRedisClient): boolean => {
    if (this.isPriorityQueuingEnabled()) {
      redisClient.zpoprpush(
        this.keyQueuePriorityPending,
        this.keyQueueProcessing,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndBlock = (redisClient: IRedisClient): boolean => {
    if (this.blockUntilMessageReceived) {
      redisClient.brpoplpush(
        this.keyQueuePending,
        this.keyQueueProcessing,
        0,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndReturn = (redisClient: IRedisClient): void => {
    redisClient.rpoplpush(
      this.keyQueuePending,
      this.keyQueueProcessing,
      this.handleMessage,
    );
  };

  dequeue(): void {
    if (!this.isRunning()) return void 0;

    if (this.isIdle()) {
      this.resetIdle();
      return void this.timer.setTimeout(() => {
        this.dequeue();
      }, 1000);
    }

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      return this.handleError(redisClient);
    }

    return void (
      this.dequeueWithRateLimit(redisClient) ||
      this.dequeueWithPriority(redisClient) ||
      this.dequeueAndBlock(redisClient) ||
      this.dequeueAndReturn(redisClient)
    );
  }
}
