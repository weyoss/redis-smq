/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
} from 'redis-smq-common';
import { TConsumerDequeueMessageEvent } from '../../../common/index.js';
import { ELuaScriptName } from '../../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { IRedisSMQParsedConfig } from '../../../config/index.js';
import { _hasRateLimitExceeded } from '../../../queue-rate-limit/_/_has-rate-limit-exceeded.js';
import { _getQueueProperties } from '../../../queue-manager/_/_get-queue-properties.js';
import {
  EQueueType,
  IQueueParsedParams,
  IQueueRateLimit,
  TQueueConsumer,
} from '../../../index.js';
import { QueueNotFoundError } from '../../../errors/index.js';
import { eventPublisher } from './event-publisher.js';
import { ERedisConnectionAcquisitionMode } from '../../../common/redis/redis-connection-pool/types/connection-pool.js';
import { RedisConnectionPool } from '../../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { IConsumerContext } from '../../types/consumer-context.js';
import { UnexpectedScriptReplyError } from '../../../errors/index.js';

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
  protected readonly consumerContext: IConsumerContext;
  protected readonly logger: ILogger;
  protected readonly config: IRedisSMQParsedConfig;

  protected queue;
  protected keyQueues;
  protected keyQueueConsumers;
  protected keyConsumerQueues;
  protected keyQueueProcessingQueues;
  protected keyQueueProcessing;
  protected keyQueuePending;
  protected keyQueuePriorityPending;
  protected blockUntilMessageReceived;
  protected autoCloseRedisConnection;

  protected redisClient: IRedisClient | null = null;
  protected queueRateLimit: IQueueRateLimit | null = null;
  protected queueType: EQueueType | null = null;

  constructor(
    consumerContext: IConsumerContext,
    queue: IQueueParsedParams,
    blockUntilMessageReceived: boolean = true,
    autoCloseRedisConnection = true,
  ) {
    super();
    this.consumerContext = consumerContext;
    this.logger = consumerContext.logger;
    this.config = consumerContext.config;
    this.queue = queue;

    this.blockUntilMessageReceived = blockUntilMessageReceived;
    this.autoCloseRedisConnection = autoCloseRedisConnection;

    eventPublisher(this);

    const { keyConsumerQueues } = redisKeys.getConsumerKeys(
      this.consumerContext.consumerId,
    );
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerContext.consumerId,
    );
    const { keyQueues } = redisKeys.getMainKeys();
    const {
      keyQueueProcessingQueues,
      keyQueuePending,
      keyQueuePriorityPending,
      keyQueueConsumers,
    } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );

    this.keyQueuePriorityPending = keyQueuePriorityPending;
    this.keyQueuePending = keyQueuePending;
    this.keyQueueProcessing = keyQueueProcessing;
    this.keyQueues = keyQueues;
    this.keyQueueConsumers = keyQueueConsumers;
    this.keyConsumerQueues = keyConsumerQueues;
    this.keyQueueProcessingQueues = keyQueueProcessingQueues;
  }

  dequeue(): void {
    if (!this.isRunning()) {
      return;
    }
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      return this.handleError(redisClient);
    }
    this.runDequeue(redisClient);
  }

  protected runDequeue(redisClient: IRedisClient): void {
    if (this.queueRateLimit) {
      _hasRateLimitExceeded(
        redisClient,
        this.queue.queueParams,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) this.handleError(err);
          else if (isExceeded) {
            // Rate limit exceeded, let the controller handle the delay
            this.emit('consumer.dequeueMessage.nextMessage');
          } else {
            // Rate limit not exceeded, proceed with dequeue
            this.performDequeue(redisClient);
          }
        },
      );
    } else {
      // No rate limit, proceed directly with dequeue
      this.performDequeue(redisClient);
    }
  }

  protected performDequeue(redisClient: IRedisClient): void {
    if (this.isPriorityQueuingEnabled()) {
      // Priority Queue: Use ZPOPRPUSH to get the highest-priority message.
      redisClient.zpoprpush(
        this.keyQueuePriorityPending,
        this.keyQueueProcessing,
        this.handleMessage,
      );
    } else if (this.blockUntilMessageReceived && !this.queueRateLimit) {
      // Blocking FIFO Queue: Use BRPOPLPUSH to wait indefinitely for a message.
      // This is not used for rate-limited queues to allow the polling mechanism to work.
      redisClient.brpoplpush(
        this.keyQueuePending,
        this.keyQueueProcessing,
        0,
        this.handleMessage,
      );
    } else {
      // Non-Blocking FIFO Queue: Use RPOPLPUSH to get a message if one is available.
      // This is the fallback for standard FIFO queues and all rate-limited queues.
      redisClient.rpoplpush(
        this.keyQueuePending,
        this.keyQueueProcessing,
        this.handleMessage,
      );
    }
  }

  protected getRedisClient(): IRedisClient | PanicError {
    if (!this.redisClient)
      return new PanicError({ message: 'A RedisClient instance is required.' });
    return this.redisClient;
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`DequeueMessage error: ${err.message}`, err);
      this.emit(
        'consumer.dequeueMessage.error',
        err,
        this.consumerContext.consumerId,
        this.queue,
      );
    }
    super.handleError(err);
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        const redisConnectionAcquisitionMode = this.blockUntilMessageReceived
          ? ERedisConnectionAcquisitionMode.EXCLUSIVE
          : ERedisConnectionAcquisitionMode.SHARED;

        RedisConnectionPool.getInstance().acquire(
          redisConnectionAcquisitionMode,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },
      (cb: ICallback) => {
        const consumerInfo: TQueueConsumer = {
          ipAddress: IPAddresses,
          hostname: os.hostname(),
          pid: process.pid,
          createdAt: Date.now(),
        };
        const redisClient = this.getRedisClient();
        if (redisClient instanceof Error) return cb(redisClient);

        const keys = [
          this.keyQueues,
          this.keyQueueConsumers,
          this.keyConsumerQueues,
          this.keyQueueProcessingQueues,
          this.keyQueueProcessing,
        ];
        const args = [
          this.consumerContext.consumerId,
          JSON.stringify(consumerInfo),
          JSON.stringify(this.queue.queueParams),
        ];
        redisClient.runScript(
          ELuaScriptName.SUBSCRIBE_CONSUMER,
          keys,
          args,
          (err, reply) => {
            if (err) return cb(err);
            if (reply === 'QUEUE_NOT_FOUND')
              return cb(new QueueNotFoundError());
            if (reply === 'OK') return cb();
            cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
          },
        );
      },
      (cb: ICallback) => {
        const redisClient = this.getRedisClient();
        if (redisClient instanceof Error) return cb(redisClient);
        _getQueueProperties(
          redisClient,
          this.queue.queueParams,
          (err, queueProperties) => {
            if (err) return cb(err);
            if (!queueProperties) return cb(new CallbackEmptyReplyError());
            this.queueType = queueProperties.queueType;
            this.queueRateLimit = queueProperties.rateLimit ?? null;
            cb();
          },
        );
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback): void => {
        if (this.redisClient) {
          if (this.autoCloseRedisConnection) {
            RedisConnectionPool.getInstance().destroy(this.redisClient, () => {
              this.redisClient = null;
              cb();
            });
          } else {
            RedisConnectionPool.getInstance().release(this.redisClient);
            this.redisClient = null;
            cb();
          }
        } else cb();
      },
    ].concat(super.goingDown());
  }

  protected isPriorityQueuingEnabled(): boolean {
    return this.queueType === EQueueType.PRIORITY_QUEUE;
  }

  protected handleMessage: ICallback<string | null> = (err, messageId) => {
    if (err) {
      this.handleError(err);
    } else if (typeof messageId === 'string') {
      this.emit(
        'consumer.dequeueMessage.messageReceived',
        messageId,
        this.queue,
        this.consumerContext.consumerId,
      );
    } else {
      // No message received. Emit an event to let the controller (MessageHandler) decide what to do.
      this.emit('consumer.dequeueMessage.nextMessage');
    }
  };
}
