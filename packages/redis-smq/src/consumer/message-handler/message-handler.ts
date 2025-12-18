/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import {
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  env,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
  Timer,
  WorkerResourceGroup,
} from 'redis-smq-common';
import {
  TConsumerMessageHandlerEvent,
  TRedisSMQEvent,
} from '../../common/index.js';
import { ELuaScriptName } from '../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IRedisSMQParsedConfig } from '../../config/index.js';
import { _parseMessage } from '../../message-manager/_/_parse-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import {
  EQueueProperty,
  IQueueParsedParams,
} from '../../queue-manager/index.js';
import { ConsumeMessage } from './consume-message/consume-message.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { evenBusPublisher } from './even-bus-publisher.js';
import { IConsumerMessageHandlerParams } from './types/index.js';
import { TConsumerMessageHandlerWorkerPayload } from './workers/types/index.js';
import { ERedisConnectionAcquisitionMode } from '../../common/redis/redis-connection-pool/types/connection-pool.js';
import { RedisConnectionPool } from '../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { _deleteEphemeralConsumerGroup } from './_/_delete-ephemeral-consumer-group.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';
import { IConsumerContext } from '../types/consumer-context.js';

const WORKERS_DIR = path.resolve(env.getCurrentDir(), './workers');

export class MessageHandler extends Runnable<TConsumerMessageHandlerEvent> {
  protected readonly consumerContext: IConsumerContext;
  protected readonly logger: ILogger;
  protected readonly config: IRedisSMQParsedConfig;

  protected queue;
  protected dequeueMessage: DequeueMessage | null = null;
  protected consumeMessage: ConsumeMessage | null = null;
  protected messageHandler;
  protected autoDequeue;
  protected workerResourceGroup: WorkerResourceGroup | null = null;
  protected redisClient: IRedisClient | null = null;
  protected timer: Timer;

  // Tracks an auto-generated ephemeral consumer group for PUB_SUB
  protected ephemeralConsumerGroupId: string | null = null;

  constructor(
    consumerContext: IConsumerContext,
    handlerParams: IConsumerMessageHandlerParams,
    autoDequeue: boolean = true,
  ) {
    super();
    this.consumerContext = consumerContext;
    this.logger = consumerContext.logger;
    this.config = consumerContext.config;

    const { queue, messageHandler } = handlerParams;
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.autoDequeue = autoDequeue;

    this.timer = new Timer();
    this.timer.on('error', (err) => this.handleError(err));

    if (this.config.eventBus.enabled) {
      evenBusPublisher(this);
    }
  }

  processMessage(messageId: string): void {
    if (!this.isRunning() || !this.consumeMessage) {
      return;
    }
    const consumeMessage = this.consumeMessage;
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      return this.handleError(redisClient);
    }

    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const { keyQueueProperties } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );

    const keys: string[] = [keyMessage, keyQueueProperties];
    const argv: (string | number)[] = [
      EMessageProperty.PROCESSING_STARTED_AT,
      Date.now(),
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PROCESSING,
      EMessagePropertyStatus.PENDING, // Required for atomic check
      EMessageProperty.ATTEMPTS,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
    ];

    redisClient.runScript(
      ELuaScriptName.CHECKOUT_MESSAGE,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) return this.handleError(err);
        if (!reply) {
          this.logger.warn(
            `Message [${messageId}] could not be fetched. It may have been processed by another consumer.`,
          );
          // A slot has been freed. Immediately try to get another message.
          this.next();
          return;
        }
        if (!Array.isArray(reply)) {
          return this.handleError(new CallbackInvalidReplyError());
        }
        const message = _parseMessage(reply);
        consumeMessage.handleReceivedMessage(message);
      },
    );
  }

  next(): void {
    if (this.isRunning()) {
      this.dequeue();
    }
  }

  dequeue(): void {
    if (this.isRunning() && this.dequeueMessage) {
      this.dequeueMessage.dequeue();
    }
  }

  getQueue(): IQueueParsedParams {
    return this.queue;
  }

  protected getRedisClient(): IRedisClient | PanicError {
    if (!this.redisClient) return new PanicError('Redis Client is missing');
    return this.redisClient;
  }

  protected onMessageReceived: TRedisSMQEvent['consumer.dequeueMessage.messageReceived'] =
    (messageId) => {
      // A message has been received, so process it
      this.processMessage(messageId);
    };

  protected onMessageUnacknowledged: TRedisSMQEvent['consumer.consumeMessage.messageUnacknowledged'] =
    () => {
      // A message has been processed, so a slot is free.
      // Immediately request the next message.
      this.next();
    };

  protected onMessageAcknowledged: TRedisSMQEvent['consumer.consumeMessage.messageAcknowledged'] =
    () => {
      // A message has been processed, so a slot is free.
      // Immediately request the next message.
      this.next();
    };

  protected onMessageNext: TRedisSMQEvent['consumer.dequeueMessage.nextMessage'] =
    () => {
      // This event means the queue is empty or rate-limited.
      this.timer.setTimeout(() => this.next(), 1000);
    };

  protected onError = (err: Error) => {
    if (this.isRunning()) {
      this.handleError(err);
    }
  };

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`MessageHandler error: ${err.message}`, err);
      this.emit(
        'consumer.messageHandler.error',
        err,
        this.consumerContext.consumerId,
        this.queue,
      );
    }
    super.handleError(err);
  }

  protected setUpConsumerWorkers = (cb: ICallback): void => {
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) return cb(redisClient);
    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );
    this.workerResourceGroup = new WorkerResourceGroup(
      redisClient,
      this.logger,
      keyQueueWorkersLock,
    );
    this.workerResourceGroup.on('workerResourceGroup.error', this.onError);
    this.workerResourceGroup.loadFromDir<TConsumerMessageHandlerWorkerPayload>(
      WORKERS_DIR,
      { redisConfig: this.config.redis, queueParsedParams: this.queue },
      (err) => {
        if (err) return cb(err);
        this.workerResourceGroup?.run((err) => {
          if (err) this.handleError(err);
        });
        cb();
      },
    );
  };

  protected shutDownConsumerWorkers = (cb: ICallback): void => {
    if (this.workerResourceGroup) {
      this.workerResourceGroup.shutdown(() => {
        this.workerResourceGroup = null;
        cb();
      });
    } else cb();
  };

  /**
   * A factory method for creating a DequeueMessage instance.
   * This method can be overridden by subclasses to customize the DequeueMessage creation.
   */
  protected createDequeueMessageInstance(): DequeueMessage {
    return new DequeueMessage(this.consumerContext, this.queue);
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },
      (cb: ICallback) => {
        _prepareConsumerGroup(
          this.queue,
          this.consumerContext.consumerId,
          (err, effectiveGroupId) => {
            if (err) return cb(err);
            if (effectiveGroupId && this.queue.groupId !== effectiveGroupId) {
              this.queue = { ...this.queue, groupId: effectiveGroupId };
              this.ephemeralConsumerGroupId = effectiveGroupId;
            }
            cb();
          },
          this.logger,
        );
      },
      (cb: ICallback) => {
        this.consumeMessage = new ConsumeMessage(
          this.consumerContext,
          this.queue,
          this.getId(),
          this.messageHandler,
        );
        this.consumeMessage.on('consumer.consumeMessage.error', this.onError);
        this.consumeMessage.on(
          'consumer.consumeMessage.messageUnacknowledged',
          this.onMessageUnacknowledged,
        );
        this.consumeMessage.on(
          'consumer.consumeMessage.messageAcknowledged',
          this.onMessageAcknowledged,
        );
        this.consumeMessage.run((err) => cb(err));
      },
      (cb: ICallback) => {
        this.dequeueMessage = this.createDequeueMessageInstance();
        this.dequeueMessage.on('consumer.dequeueMessage.error', this.onError);
        this.dequeueMessage.on(
          'consumer.dequeueMessage.messageReceived',
          this.onMessageReceived,
        );
        this.dequeueMessage.on(
          'consumer.dequeueMessage.nextMessage',
          this.onMessageNext,
        );
        this.dequeueMessage.run((err) => cb(err));
      },
      this.setUpConsumerWorkers,
      (cb: ICallback) => {
        if (this.autoDequeue) {
          this.dequeue();
        }
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback): void => {
        this.timer.reset();
        const ephemeral = this.ephemeralConsumerGroupId;
        if (!ephemeral) return cb();
        _deleteEphemeralConsumerGroup(
          this.queue.queueParams,
          this.consumerContext.consumerId,
          ephemeral,
          (err) => {
            if (err) {
              this.logger.warn(
                `Failed to delete ephemeral consumer group '${ephemeral}': ${err.message}`,
              );
            }
            this.ephemeralConsumerGroupId = null;
            cb();
          },
        );
      },
      this.shutDownConsumerWorkers,
      (cb: ICallback) => {
        if (this.dequeueMessage) {
          this.dequeueMessage.shutdown(() => {
            this.dequeueMessage?.removeListener(
              'consumer.dequeueMessage.error',
              this.onError,
            );
            this.dequeueMessage?.removeListener(
              'consumer.dequeueMessage.messageReceived',
              this.onMessageReceived,
            );
            this.dequeueMessage?.removeListener(
              'consumer.dequeueMessage.nextMessage',
              this.onMessageNext,
            );
            this.dequeueMessage = null;
            cb();
          });
        } else cb();
      },
      (cb: ICallback) => {
        if (this.consumeMessage) {
          this.consumeMessage.shutdown(() => {
            this.consumeMessage?.removeListener(
              'consumer.consumeMessage.error',
              this.onError,
            );
            this.consumeMessage?.removeListener(
              'consumer.consumeMessage.messageUnacknowledged',
              this.onMessageUnacknowledged,
            );
            this.consumeMessage?.removeListener(
              'consumer.consumeMessage.messageAcknowledged',
              this.onMessageAcknowledged,
            );
            this.consumeMessage = null;
            cb();
          });
        } else cb();
      },
      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }
}
