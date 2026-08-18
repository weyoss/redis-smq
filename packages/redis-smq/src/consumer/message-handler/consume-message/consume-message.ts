/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { stat } from 'fs';
import path from 'path';
import {
  async,
  AsyncCallbackTimeoutError,
  CallableWorker,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  Runnable,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { IRedisSMQParsedConfig } from '../../../config-manager/index.js';
import { IMessageTransferable } from '../../../message/index.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParsedParams } from '../../../queue-manager/index.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
  TUnacknowledgementResult,
} from './types/index.js';
import {
  InvalidMessageHandlerSignatureError,
  InvalidMessageHandlerTypeError,
  MessageHandlerFileError,
  MessageHandlerFilenameExtensionError,
} from '../../../errors/index.js';
import { MessageUnacknowledger } from './message-unacknowledger.js';
import { eventPublisher } from './event-publisher.js';
import {
  TConsumerMessageHandler,
  TConsumerMessageHandlerCallback,
  TConsumerMessageHandlerFn,
  TConsumerMessageHandlerPromise,
} from '../types/index.js';
import { ERedisConnectionAcquisitionMode } from '../../../common/redis/redis-connection-pool/types/connection-pool.js';
import { RedisConnectionPool } from '../../../common/redis/redis-connection-pool/redis-connection-pool.js';
import { IConsumerContext } from '../../types/consumer-context.js';
import { MessageAcknowledger } from './message-acknowledger.js';
import { IConsumerParsedOptions } from '../../types/index.js';

export type TConsumerConsumeMessageEvent = {
  messageAcknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  messageUnacknowledged: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
    unacknowledgmentCause: EMessageUnacknowledgementCause,
  ) => void;
  messageDeadLettered: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
    deadLetterCause: EMessageDeadLetterCause,
  ) => void;
  messageRequeued: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  messageDelayed: (
    messageId: string,
    queue: IQueueParsedParams,
    consumerId: string,
  ) => void;
  next: () => void;
  error: (err: Error, consumerId: string, queue: IQueueParsedParams) => void;
};

// Type guard to check if handler is callback-based
const isCallbackHandler = (
  handler: TConsumerMessageHandlerFn,
): handler is TConsumerMessageHandlerCallback => {
  return handler.length === 2; // Functions with 2 parameters (msg, cb)
};

// Type guard to check if handler is Promise-based
const isPromiseHandler = (
  handler: TConsumerMessageHandlerFn,
): handler is TConsumerMessageHandlerPromise => {
  return handler.length === 1; // Functions with 1 parameter (msg)
};

export class ConsumeMessage extends Runnable<TConsumerConsumeMessageEvent> {
  protected readonly consumerId: string;
  protected readonly config: IRedisSMQParsedConfig;
  protected readonly logger: ILogger;
  protected readonly keyQueueProperties: string;
  protected readonly keyQueueProcessing: string;
  protected readonly keyQueueAcknowledged: string;
  protected readonly queue: IQueueParsedParams;
  protected readonly messageHandler: TConsumerMessageHandler;
  protected readonly messageHandlerId: string;
  protected readonly consumerOptions: IConsumerParsedOptions;

  private redisClient: IRedisClient | null = null;
  private consumeMessageWorker: CallableWorker<
    IMessageTransferable,
    void
  > | null = null;
  private messageUnacknowledger: MessageUnacknowledger;
  private messageAcknowledger: MessageAcknowledger;

  constructor(
    consumerContext: IConsumerContext,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    messageHandler: TConsumerMessageHandler,
  ) {
    super();
    this.consumerId = consumerContext.consumerId;
    this.logger = consumerContext.logger.createLogger(this.constructor.name);
    this.config = consumerContext.config;
    this.consumerOptions = consumerContext.consumerOptions;
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.messageHandlerId = messageHandlerId;

    // Initialize MessageAcknowledger
    this.messageAcknowledger = this.initializeMessageAcknowledger();

    // Initialize MessageUnacknowledger
    this.messageUnacknowledger = this.initializeMessageUnacknowledger();

    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
    );
    const { keyQueueProperties, keyQueueAcknowledged } = redisKeys.getQueueKeys(
      this.queue.queueParams.ns,
      this.queue.queueParams.name,
      this.queue.groupId,
    );
    this.keyQueueProperties = keyQueueProperties;
    this.keyQueueAcknowledged = keyQueueAcknowledged;
    this.keyQueueProcessing = keyQueueProcessing;

    eventPublisher(this);
    this.logger.debug(
      `${this.constructor.name} initialized for queue ${queue.queueParams.name}@${queue.queueParams.ns}`,
    );
  }

  protected initializeMessageAcknowledger(): MessageAcknowledger {
    const messageAcknowledger = new MessageAcknowledger(
      this.queue,
      this.consumerId,
      this.logger,
      this.consumerOptions,
    );

    messageAcknowledger.on('messageAcknowledger.error', (err) => {
      this.handleError(err);
    });

    messageAcknowledger.on(
      'messageAcknowledger.messageAcknowledged',
      (message: MessageEnvelope) => {
        this.onMessageAcknowledged(message);
      },
    );

    return messageAcknowledger;
  }

  protected initializeMessageUnacknowledger(): MessageUnacknowledger {
    const messageUnacknowledger = new MessageUnacknowledger(
      this.consumerId,
      this.queue,
      this.logger,
      this.consumerOptions,
    );

    // Set up event handlers
    messageUnacknowledger.on('messageUnacknowledger.error', (err) => {
      this.handleError(err);
    });

    messageUnacknowledger.on(
      'messageUnacknowledger.messagesUnacknowledged',
      (status: TUnacknowledgementResult) => {
        this.handleUnacknowledgementResult(status);
      },
    );

    return messageUnacknowledger;
  }

  handleReceivedMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    this.logger.debug(`Received message ${messageId}`);

    if (!this.isOperational()) {
      this.logger.warn(`Ignoring message ${messageId} - consumer not running`);
      return;
    }

    if (message.getSetExpired()) {
      this.logger.info(`Message ${messageId} expired, unacknowledging`);
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgementCause.TTL_EXPIRED,
      );
    } else {
      this.logger.debug(
        `Message ${messageId} valid, proceeding with consumption`,
      );
      this.consumeMessage(message);
    }
  }

  protected acknowledgeMessage(message: MessageEnvelope): void {
    if (this.messageAcknowledger) {
      this.messageAcknowledger.add(message);
    } else {
      this.logger.error('MessageAcknowledger not initialized');
    }
    this.emit('next');
  }

  protected unacknowledgeMessage(
    message: MessageEnvelope,
    cause: EMessageUnacknowledgementCause,
  ): void {
    this.messageUnacknowledger.add(message, cause);
    this.emit('next');
  }

  private onMessageAcknowledged(message: MessageEnvelope): void {
    const messageId = message.getId();
    this.logger.info(`Message ${messageId} acknowledged successfully`);
    this.emit('messageAcknowledged', messageId, this.queue, this.consumerId);
  }

  private handleUnacknowledgementResult(
    result: TUnacknowledgementResult,
  ): void {
    const messageCount = Object.keys(result).length;
    if (messageCount === 0) return;

    this.logger.debug(
      `Handling unacknowledgement result for ${messageCount} messages`,
    );

    for (const [messageId, details] of Object.entries(result)) {
      this.logger.info(
        `Message ${messageId} unacknowledged: ${EMessageUnacknowledgementCause[details.cause]}`,
      );

      this.emit(
        'messageUnacknowledged',
        messageId,
        this.queue,
        this.consumerId,
        details.cause,
      );

      if (details.action === EMessageUnacknowledgementAction.DEAD_LETTER) {
        this.logger.info(`Message ${messageId} moved to dead letter queue`);
        this.emit(
          'messageDeadLettered',
          messageId,
          this.queue,
          this.consumerId,
          details.deadLetterCause,
        );
      } else if (details.action === EMessageUnacknowledgementAction.DELAY) {
        this.logger.info(`Message ${messageId} delayed for retry`);
        this.emit('messageDelayed', messageId, this.queue, this.consumerId);
      } else {
        this.logger.info(`Message ${messageId} re-queued for retry`);
        this.emit('messageRequeued', messageId, this.queue, this.consumerId);
      }
    }
  }

  private consumeMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    this.logger.debug(`Consuming message ${messageId}`);

    let isCallbackHandled = false;

    try {
      let onConsumed: ICallback<void> = (err) => {
        if (isCallbackHandled) {
          this.logger.debug(`Callback for ${messageId} already handled`);
          return;
        }
        isCallbackHandled = true;

        if (!this.isOperational()) {
          this.logger.debug(
            `Consumer not running, ignoring callback for ${messageId}`,
          );
          return;
        }

        if (err) {
          this.logger.error(`Error consuming ${messageId}: ${err.message}`);
          let reason = EMessageUnacknowledgementCause.UNACKNOWLEDGED;
          if (err instanceof AsyncCallbackTimeoutError) {
            reason = EMessageUnacknowledgementCause.TIMEOUT;
          }
          if (err instanceof InvalidMessageHandlerSignatureError) {
            reason = EMessageUnacknowledgementCause.INVALID_HANDLER_SIGNATURE;
          }
          this.unacknowledgeMessage(message, reason);
          return;
        }

        this.logger.debug(`Message ${messageId} consumed successfully`);
        this.acknowledgeMessage(message);
      };

      const consumeTimeout = message.producibleMessage.getConsumeTimeout();
      if (consumeTimeout) {
        this.logger.debug(
          `Setting timeout ${consumeTimeout}ms for ${messageId}`,
        );
        onConsumed = async.withTimeout(onConsumed, consumeTimeout);
      }

      this.invokeMessageHandler(
        this.messageHandler,
        message.transfer(),
        onConsumed,
      );
    } catch (error) {
      this.logger.error(`Exception consuming ${messageId}: ${error}`);
      isCallbackHandled = true;
      this.unacknowledgeMessage(
        message,
        EMessageUnacknowledgementCause.CONSUME_ERROR,
      );
      this.emit('next');
    }
  }

  private invokeMessageHandler(
    handler: TConsumerMessageHandler,
    msg: IMessageTransferable,
    cb: ICallback<void>,
  ): void {
    const messageId = msg.id;

    if (typeof handler === 'string') {
      this.getWorker(handler).call(msg, (err) => {
        if (err) {
          this.logger.error(
            `Worker handler failed for ${messageId}: ${err.message}`,
          );
        }
        cb(err);
      });
      return;
    }

    let isCompleted = false;

    const complete = (err?: Error | null) => {
      if (isCompleted) return;
      isCompleted = true;

      if (err) {
        this.logger.error(`Handler failed for ${messageId}: ${err.message}`);
        cb(err);
      } else {
        this.logger.debug(`Handler succeeded for ${messageId}`);
        cb(null);
      }
    };

    try {
      // Determine handler type by arity (number of parameters)
      if (isPromiseHandler(handler)) {
        // Promise-based handler (1 parameter)
        const result = handler(msg);

        if (result && typeof result.then === 'function') {
          result
            .then(() => complete())
            .catch((err) => {
              const error =
                err instanceof Error
                  ? err
                  : new Error(String(err ?? 'Promise rejected'));
              complete(error);
            });
        } else {
          // Handler claimed to be Promise-based but didn't return a Promise
          this.logger.warn(`Handler for ${messageId} didn't return a Promise`);
          complete();
        }
      } else if (isCallbackHandler(handler)) {
        // Callback-based handler (2 parameters)
        handler(msg, (err?: Error | null) => {
          complete(err ?? undefined);
        });
      } else {
        // Unknown function signature
        this.logger.error(`Handler for ${messageId} has invalid signature`);
        complete(
          new InvalidMessageHandlerSignatureError({
            metadata: {
              queue: this.queue,
            },
          }),
        );
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error(String(err || 'Handler threw error'));
      complete(error);
    }
  }

  private getWorker(
    filename: string,
  ): CallableWorker<IMessageTransferable, void> {
    if (!this.consumeMessageWorker) {
      this.logger.debug(`Creating worker for ${filename}`);
      this.consumeMessageWorker = new CallableWorker(filename, this.logger);
    }
    return this.consumeMessageWorker;
  }

  private validateHandler = (cb: ICallback<void>): void => {
    const messageHandler: unknown = this.messageHandler;

    if (typeof messageHandler === 'function') {
      if (![1, 2].includes(this.messageHandler.length)) {
        this.logger.debug('Function-based handler has invalid signature');
        return cb(
          new InvalidMessageHandlerSignatureError({
            metadata: {
              queue: this.queue,
            },
          }),
        );
      }
      return cb();
    }

    if (typeof messageHandler === 'string') {
      const ext = path.extname(messageHandler);
      if (!['.js', '.cjs'].includes(ext)) {
        this.logger.error(`Invalid extension: ${ext}`);
        return cb(new MessageHandlerFilenameExtensionError());
      }

      return stat(messageHandler, (err) => {
        if (err) {
          this.logger.error(`Handler file not found: ${messageHandler}`);
          return cb(new MessageHandlerFileError());
        }
        this.logger.debug(`Handler validated: ${messageHandler}`);
        cb();
      });
    }

    this.logger.debug('Invalid message handler type');
    return cb(
      new InvalidMessageHandlerTypeError({
        metadata: {
          queue: this.queue,
        },
      }),
    );
  };

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      // Step 1: Initialize Redis client
      (cb: ICallback) => {
        this.logger.debug('Initializing Redis client');
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, client) => {
            if (err) {
              this.logger.error(`Redis client failed: ${err.message}`);
              return cb(err);
            }
            if (!client) return cb(new CallbackEmptyReplyError());
            this.redisClient = client;
            cb();
          },
        );
      },

      // Step 2: Start MessageUnacknowledger
      (cb: ICallback) => {
        this.logger.debug('Starting MessageUnacknowledger');
        this.messageUnacknowledger.run((err) => {
          if (err) {
            this.logger.error(
              `Failed to start MessageUnacknowledger: ${err.message}`,
            );
            return cb(err);
          }
          this.logger.debug('MessageUnacknowledger started');
          cb();
        });
      },

      // Step 3: Start MessageAcknowledger
      (cb: ICallback) => {
        this.messageAcknowledger.run((err) => {
          if (err) {
            this.logger.error(
              `Failed to start MessageAcknowledger: ${err.message}`,
            );
            return cb(err);
          }
          this.logger.debug('MessageAcknowledger started');
          cb();
        });
      },

      // Step 4: Validate message handler
      (cb: ICallback) => {
        this.logger.debug('Validating message handler');
        this.validateHandler(cb);
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      // Step 1: Shutdown MessageAcknowledger (flushes pending acks)
      (cb: ICallback<void>) => {
        if (this.messageAcknowledger) {
          this.logger.info('Shutting down MessageAcknowledger');
          this.messageAcknowledger.shutdown(cb);
        } else {
          cb();
        }
      },

      // Step 2: Shutdown MessageUnacknowledger (flushes pending batches)
      (cb: ICallback<void>) => {
        this.logger.debug('Shutting down MessageUnacknowledger');
        this.messageUnacknowledger.shutdown(cb);
      },

      // Step 3: Shutdown worker
      (cb: ICallback<void>) => {
        if (this.consumeMessageWorker) {
          this.consumeMessageWorker.shutdown((err) => {
            if (err) this.logger.warn(`Worker shutdown error: ${err.message}`);
            cb();
          });
        } else {
          cb();
        }
      },

      // Step 4: Release Redis client
      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  protected override handleError(err: unknown): void {
    if (!this.isOperational()) return;

    const error = err instanceof Error ? err : new Error(String(err));
    this.emit('error', error, this.consumerId, this.queue);
    super.handleError(err);
  }
}
