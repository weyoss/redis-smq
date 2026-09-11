/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  WorkerCluster,
} from 'redis-smq-common';
import { ERedisScriptName } from '../../common/redis/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IRedisSMQParsedConfig } from '../../config-manager/index.js';
import { _parseMessage } from '../../message-manager/_/_parse-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
} from '../../queue-manager/index.js';
import { ConsumeMessage } from './consume-message/consume-message.js';
import {
  DequeueMessage,
  TDequeueMessageEvent,
} from './dequeue-message/dequeue-message.js';
import { EMessageUnacknowledgementCause } from './consume-message/types/index.js';
import { IConsumerMessageHandlerParams } from './types/index.js';
import { ERedisConnectionAcquisitionMode } from '../../common/redis/redis-connection-pool/types/connection-pool.js';
import { RedisConnectionPool } from '../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { _deleteEphemeralConsumerGroup } from './_/_delete-ephemeral-consumer-group.js';
import { IConsumerContext } from '../types/consumer-context.js';
import { IQueueWorkerPayload } from './queue-workers/types/queue-worker.js';
import { _subscribeConsumer } from './_/_subscribe-consumer.js';
import { _unsubscribeConsumer } from './_/_unsubscribe-consumer.js';
import { RedisConfig } from '../../common/redis/redis-config.js';

/**
 * Events emitted by a MessageHandler.
 *
 * - `error`: a runtime error occurred; the runner should shut down and
 *   possibly restart this handler.
 * - `shutdownRequired`: the handler cannot continue (e.g., the queue is
 *   STOPPED/LOCKED). The runner is expected to remove the instance from its
 *   registry. The handler does NOT shut itself down, because doing so would
 *   leave a stale instance in `MessageHandlerRunner.messageHandlerInstances`
 *   that blocks restart when the queue becomes ACTIVE again.
 */
export type TMessageHandlerEvent = {
  error: (err: Error, consumerId: string, queue: IQueueParsedParams) => void;
  shutdownRequired: (
    cause: EMessageUnacknowledgementCause,
    consumerId: string,
    queue: IQueueParsedParams,
  ) => void;
};

const WORKERS_DIR = path.resolve(
  env.getCurrentDir(),
  './queue-workers/workers',
);

export class MessageHandler extends Runnable<TMessageHandlerEvent> {
  protected readonly consumerContext: IConsumerContext;
  protected readonly config: IRedisSMQParsedConfig;

  protected logger: ILogger;
  protected queue;
  protected dequeueMessage: DequeueMessage | null = null;
  protected consumeMessage: ConsumeMessage | null = null;
  protected messageHandler;
  protected autoDequeue;
  protected queueWorkerCluster: WorkerCluster | null = null;
  protected redisClient: IRedisClient | null = null;
  protected timer: Timer;

  // Tracks an auto-generated ephemeral consumer group for PUB_SUB
  protected ephemeralConsumerGroupId: string | null = null;

  constructor(
    consumerContext: IConsumerContext,
    handlerParams: IConsumerMessageHandlerParams,
    ephemeralGroupId: string | null,
    autoDequeue: boolean = true,
  ) {
    super();
    this.consumerContext = consumerContext;
    this.logger = consumerContext.logger.createLogger(this.constructor.name);
    this.config = consumerContext.config;

    const { queue, messageHandler } = handlerParams;
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.ephemeralConsumerGroupId = ephemeralGroupId;
    this.autoDequeue = autoDequeue;
    this.timer = new Timer(this.logger);
  }

  protected getRedisClient(): IRedisClient | PanicError {
    if (!this.redisClient)
      return new PanicError({ message: 'A RedisClient instance is required.' });
    return this.redisClient;
  }

  protected onMessageReceived: TDequeueMessageEvent['messageReceived'] = (
    messageId,
  ) => {
    // A message has been received, so process it
    this.processMessage(messageId);
  };

  protected onMessageNext: TDequeueMessageEvent['nextMessage'] = () => {
    // This event means the queue is empty or rate-limited.
    this.timer.schedule(() => this.next(), 1000);
  };

  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.logger.error(`MessageHandler error: ${err.message}`, err);
    this.emit('error', err, this.consumerContext.consumerId, this.queue);
    super.handleError(err);
  }

  protected runWorkerCluster = (cb: ICallback): void => {
    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      return cb(redisClient);
    }

    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );
    this.queueWorkerCluster = new WorkerCluster(
      redisClient,
      this.logger,
      keyQueueWorkersLock,
    );
    this.queueWorkerCluster.on('workerCluster.error', (err) =>
      this.handleError(err),
    );
    this.queueWorkerCluster.loadFromDir<IQueueWorkerPayload>(
      WORKERS_DIR,
      {
        config: this.config,
        redisConfig: RedisConfig.getConfig(),
        queueParsedParams: this.queue,
        loggerContext: {
          namespaces: this.logger.getNamespaces(),
        },
        consumerId: this.consumerContext.consumerId,
      },
      (err) => {
        if (err) return cb(err);

        // This operation may hang on forever as
        // the callback is invoked only when a lock is acquired
        this.queueWorkerCluster?.run(() => void 0);
        cb();
      },
    );
  };

  protected shutdownWorkerCluster = (cb: ICallback): void => {
    if (this.queueWorkerCluster) {
      this.queueWorkerCluster.shutdown(() => {
        this.queueWorkerCluster = null;
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
      (cb: ICallback) => this.timer.run(cb),
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
        _subscribeConsumer(this.consumerContext.consumerId, this.queue, cb);
      },
      (cb: ICallback) => {
        this.consumeMessage = new ConsumeMessage(
          this.consumerContext,
          this.queue,
          this.getId(),
          this.messageHandler,
        );
        this.consumeMessage.on('error', (err) => this.handleError(err));
        this.consumeMessage.on('next', () => {
          this.next();
        });
        this.consumeMessage.run(cb);
      },
      (cb: ICallback) => {
        this.dequeueMessage = this.createDequeueMessageInstance();
        this.dequeueMessage.on('error', (err) => this.handleError(err));
        this.dequeueMessage.on('messageReceived', this.onMessageReceived);
        this.dequeueMessage.on('nextMessage', this.onMessageNext);
        this.dequeueMessage.run(cb);
      },
      this.runWorkerCluster,
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
      (cb: ICallback) => this.timer.shutdown(cb),
      this.shutdownWorkerCluster,

      // stop dequeuing messages
      (cb: ICallback) => {
        if (this.dequeueMessage) {
          this.dequeueMessage.shutdown(() => {
            this.dequeueMessage?.removeListener('error', (err) =>
              this.handleError(err),
            );
            this.dequeueMessage?.removeListener(
              'messageReceived',
              this.onMessageReceived,
            );
            this.dequeueMessage?.removeListener(
              'nextMessage',
              this.onMessageNext,
            );
            this.dequeueMessage = null;
            cb();
          });
        } else cb();
      },

      // stop consuming messages
      (cb: ICallback) => {
        if (this.consumeMessage) {
          this.consumeMessage.shutdown(() => {
            this.consumeMessage?.removeListener('error', (err) =>
              this.handleError(err),
            );
            this.consumeMessage = null;
            cb();
          });
        } else cb();
      },

      // unsubscribe from queue
      (cb: ICallback) => {
        _unsubscribeConsumer(this.consumerContext.consumerId, this.queue, cb);
      },

      (cb: ICallback): void => {
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

      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  processMessage(messageId: string): void {
    if (!this.isOperational() || !this.consumeMessage) {
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
      EMessageProperty.LAST_PROCESSED_AT,
      Date.now(),
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PROCESSING,
      EMessagePropertyStatus.PENDING, // Required for atomic check
      EMessageProperty.ATTEMPTS,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EQueueProperty.OPERATIONAL_STATE,
      EQueueOperationalState.ACTIVE,
      EQueueOperationalState.PAUSED,
      EQueueOperationalState.STOPPED,
      EQueueOperationalState.LOCKED,
    ];

    redisClient.runScript(
      ERedisScriptName.CHECKOUT_MESSAGE,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) return this.handleError(err);

        // Handle queue state specific errors. In each case, signal the runner
        // that this handler must be stopped, but do NOT call this.shutdown()
        // directly: the runner owns the instance's lifecycle and needs to
        // remove it from its registry so that a fresh handler can be created
        // when the queue returns to ACTIVE (see MessageHandlerRunner).
        if (reply === 'QUEUE_STOPPED') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in STOPPED state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_STOPPED,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'QUEUE_LOCKED') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in LOCKED state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_LOCKED,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'QUEUE_INVALID_STATE') {
          this.logger.warn(
            `Cannot checkout message ${messageId}: Queue is in invalid state. Requesting shutdown of this message handler.`,
          );
          this.emit(
            'shutdownRequired',
            EMessageUnacknowledgementCause.QUEUE_INVALID_STATE,
            this.consumerContext.consumerId,
            this.queue,
          );
          return;
        }

        if (reply === 'MESSAGE_NOT_FOUND') {
          this.logger.warn(
            `Message [${messageId}] not found. It may have been deleted or expired.`,
          );
          // A slot has been freed. Immediately try to get another message.
          this.next();
          return;
        }

        if (reply === 'MESSAGE_NOT_PENDING') {
          this.logger.warn(
            `Message [${messageId}] could not be fetched. It may have been processed by another consumer.`,
          );
          // A slot has been freed. Immediately try to get another message.
          this.next();
          return;
        }

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
    if (this.isOperational()) {
      this.dequeue();
    }
  }

  dequeue(): void {
    if (this.isOperational() && this.dequeueMessage) {
      this.dequeueMessage.dequeue();
    }
  }

  getQueue(): IQueueParsedParams {
    return this.queue;
  }
}
