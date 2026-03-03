/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { _getMessages } from '../../../message-manager/_/_get-message.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParams } from '../../../queue-manager/index.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
  EUnacknowledgementAction,
  TUnacknowledgementBatch,
  TUnacknowledgementResolution,
  TUnacknowledgementResult,
} from './types/index.js';
import { withSharedPoolConnection } from '../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { TConsumerParsedOptions } from '../../types/index.js';
import { _executeUnacknowledgementScript } from './_/_execute-unacknowledgement-script.js';

export type TMessageUnacknowledgerEvent = {
  'messageUnacknowledger.error': (error: unknown) => void;
  'messageUnacknowledger.messagesUnacknowledged': (
    recoveryStatus: TUnacknowledgementResult,
  ) => void;
};

/**
 * Handles unacknowledgement of messages for a specific queue with optional batching.
 */
export class MessageUnacknowledger extends Runnable<TMessageUnacknowledgerEvent> {
  private readonly consumerId: string;
  private readonly queue: IQueueParams;
  private readonly queueRef: string;
  private readonly useBatchUnacks: boolean;
  private readonly batchSize: number;
  private readonly batchTimeoutMs: number;
  private readonly batch: TUnacknowledgementBatch;

  protected readonly logger: ILogger;

  constructor(
    consumerId: string,
    queue: IQueueParams,
    logger: ILogger,
    consumerOptions: TConsumerParsedOptions,
  ) {
    super();
    this.consumerId = consumerId;
    this.queue = queue;
    this.queueRef = `${queue.name}@${queue.ns}`;
    this.logger = logger.createLogger(`${this.constructor.name.toLowerCase()}`);
    this.useBatchUnacks = consumerOptions.enableBatchUnacks;
    this.batchSize = consumerOptions.batchSize;
    this.batchTimeoutMs = consumerOptions.batchTimeoutMs;

    this.batch = {
      messages: [],
      callbacks: [],
      timer: null,
    };

    this.logger.debug(
      `MessageUnacknowledger initialized for queue ${this.queueRef}`,
    );
  }

  private getResolution(
    message: MessageEnvelope,
    cause: EMessageUnacknowledgementCause,
  ): TUnacknowledgementResolution {
    // TTL expired always goes to DLQ
    if (cause === EMessageUnacknowledgementCause.TTL_EXPIRED) {
      return {
        cause,
        action: EUnacknowledgementAction.DEAD_LETTER,
        deadLetterCause: EMessageDeadLetterCause.TTL_EXPIRED,
      };
    }

    // Periodic messages are never retried - they're rescheduled by the scheduler
    if (message.isPeriodic()) {
      return {
        cause,
        action: EUnacknowledgementAction.DEAD_LETTER,
        deadLetterCause: EMessageDeadLetterCause.PERIODIC_MESSAGE,
      };
    }

    // Check if retry threshold exceeded
    if (message.hasRetryThresholdExceeded()) {
      return {
        cause,
        action: EUnacknowledgementAction.DEAD_LETTER,
        deadLetterCause: EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED,
      };
    }

    // Determine if message should be delayed or requeued immediately
    const delay = message.producibleMessage.getRetryDelay();
    return delay
      ? { cause, action: EUnacknowledgementAction.DELAY }
      : { cause, action: EUnacknowledgementAction.REQUEUE };
  }

  private buildPendingMessages(
    messages: MessageEnvelope[],
    cause: EMessageUnacknowledgementCause,
  ): TUnacknowledgementBatch['messages'] {
    return messages.map((m) => {
      const resolution = this.getResolution(m, cause);
      const { keyMessage } = redisKeys.getMessageKeys(m.getId());
      return {
        messageId: m.getId(),
        keyMessage,
        message: m,
        resolution,
      };
    });
  }

  private processBatch(): void {
    if (this.batch.timer) {
      clearTimeout(this.batch.timer);
      this.batch.timer = null;
    }

    if (this.batch.messages.length === 0) {
      this.batch.callbacks.forEach((cb) => cb(null, {}));
      this.batch.callbacks = [];
      return;
    }

    const messages = [...this.batch.messages];
    const callbacks = [...this.batch.callbacks];
    this.batch.messages = [];
    this.batch.callbacks = [];

    this.logger.debug(
      `Processing batch of ${messages.length} messages for queue ${this.queue.ns}:${this.queue.name}`,
    );

    withSharedPoolConnection(
      (client, done) => {
        _executeUnacknowledgementScript(
          this.queue,
          messages,
          this.consumerId,
          this.logger,
          (err, result) => {
            if (err) {
              callbacks.forEach((cb) => cb(err));
              return done(err);
            }
            if (result) {
              this.emit('messageUnacknowledger.messagesUnacknowledged', result);
              callbacks.forEach((cb) => cb(null, result));
            }
            done();
          },
        );
      },
      (err) => {
        if (err) this.handleError(err);
      },
    );
  }

  private getMessagesFromQueue(
    client: IRedisClient,
    cb: ICallback<MessageEnvelope[]>,
  ): void {
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue,
      this.consumerId,
    );

    async.waterfall(
      [
        (next: ICallback<string[]>) => {
          client.lrange(keyQueueProcessing, 0, -1, (err, reply) =>
            next(err, reply ?? []),
          );
        },
        (ids: string[], next: ICallback<MessageEnvelope[]>) => {
          if (!ids.length) return next(null, []);
          _getMessages(client, ids, next);
        },
      ],
      cb,
    );
  }

  protected override goingDown(): Array<(cb: ICallback<void>) => void> {
    return [
      (next: ICallback) => {
        if (this.batch.messages.length === 0) {
          this.logger.debug('No pending batch to flush during shutdown');
          return next();
        }

        this.logger.info(
          `Flushing pending batch of ${this.batch.messages.length} messages on shutdown`,
        );

        this.flush((err) => {
          if (err) {
            this.logger.error(
              `Error flushing batch during shutdown: ${err.message}`,
            );
          }
          next();
        });
      },
      (next: ICallback) => {
        this.logger.info('Unacknowledging messages in processing queue');
        this.unacknowledgeProcessingQueue(
          EMessageUnacknowledgementCause.SHUTTING_DOWN,
          () => next(),
        );
      },
    ];
  }

  protected override handleError(err: unknown): void {
    if (!this.isOperational()) return;

    const error = err instanceof Error ? err : new Error(String(err));
    this.logger.error(`MessageUnacknowledger error: ${error.message}`);
    this.emit('messageUnacknowledger.error', error);
    super.handleError(err);
  }

  /**
   * Add a single message to be unacknowledged
   */
  public add(
    message: MessageEnvelope,
    cause: EMessageUnacknowledgementCause,
  ): void {
    if (!this.isOperational()) {
      this.logger.warn(
        `Cannot add message ${message.getId()} - not operational`,
      );
      return;
    }

    // Non-batch mode - process immediately
    if (!this.useBatchUnacks) {
      this.unacknowledgeMessage(message, cause, (err, result) => {
        if (err) this.handleError(err);
        if (result) {
          this.emit('messageUnacknowledger.messagesUnacknowledged', result);
        }
      });
      return;
    }

    const resolution = this.getResolution(message, cause);

    this.logger.debug(
      `Adding message ${message.getId()} to unacknowledger, action: ${resolution.action}`,
    );

    this.batch.messages.push({
      message,
      resolution,
    });

    // Flush if batch is full
    if (this.batch.messages.length >= this.batchSize) {
      this.logger.debug(`Batch full, flushing immediately`);
      this.processBatch();
    }
    // Set timer if this is the first message in a new batch
    else if (!this.batch.timer) {
      this.logger.debug(`Setting timer: ${this.batchTimeoutMs}ms`);
      this.batch.timer = setTimeout(() => {
        if (this.batch.messages.length > 0) {
          this.logger.debug(`Timer expired, flushing`);
          this.processBatch();
        }
      }, this.batchTimeoutMs);
      this.batch.timer.unref();
    }
  }

  /**
   * Unacknowledge a single message immediately (bypasses batching).
   */
  public unacknowledgeMessage(
    message: MessageEnvelope,
    cause: EMessageUnacknowledgementCause,
    cb: ICallback<TUnacknowledgementResult>,
  ): void {
    if (!this.isOperational()) {
      return cb(
        new PanicError({ message: 'MessageUnacknowledger not operational' }),
      );
    }

    const resolution = this.getResolution(message, cause);

    this.logger.debug(`Immediately unacknowledging message ${message.getId()}`);
    _executeUnacknowledgementScript(
      this.queue,
      [
        {
          message,
          resolution,
        },
      ],
      this.consumerId,
      this.logger,
      cb,
    );
  }

  /**
   * Unacknowledge all messages currently in the processing queue.
   */
  public unacknowledgeProcessingQueue(
    cause: EMessageUnacknowledgementCause,
    cb: ICallback<TUnacknowledgementResult>,
  ): void {
    // this method is allowed to run in all states except when the instance is fully shutdown
    if (this.isDown() && !this.isGoingUp()) {
      return cb(
        new PanicError({ message: 'MessageUnacknowledger is fully down' }),
      );
    }

    const queueRef = `${this.queue.ns}:${this.queue.name}`;
    this.logger.info(
      `Unacknowledging all messages in processing queue ${queueRef}`,
    );

    async.waterfall(
      [
        (next: ICallback<MessageEnvelope[]>) => {
          withSharedPoolConnection((client, done) => {
            this.getMessagesFromQueue(client, done);
          }, next);
        },
        (
          messages: MessageEnvelope[],
          next: ICallback<TUnacknowledgementResult>,
        ) => {
          const messageCount = messages?.length || 0;
          this.logger.debug(
            `Found ${messageCount} messages in processing queue ${queueRef}`,
          );

          const pending = this.buildPendingMessages(messages || [], cause);
          _executeUnacknowledgementScript(
            this.queue,
            pending,
            this.consumerId,
            this.logger,
            next,
          );
        },
      ],
      (err, result) => {
        if (err) {
          this.logger.error(
            `Failed to unacknowledge queue ${queueRef}: ${err.message}`,
          );
        }
        if (result) {
          const unackedCount = Object.keys(result).length;
          this.logger.info(
            `Unacknowledged ${unackedCount} messages from processing queue ${queueRef}`,
          );
          this.emit('messageUnacknowledger.messagesUnacknowledged', result);
        }
        cb(err, result);
      },
    );
  }

  /**
   * Flush any pending messages in the batch.
   */
  public flush(cb?: ICallback<TUnacknowledgementResult>): void {
    if (this.isDown() && !this.isGoingUp()) {
      return cb?.(
        new PanicError({ message: 'MessageUnacknowledger is fully down' }),
      );
    }

    if (this.batch.messages.length === 0) {
      this.logger.debug('No pending messages to flush');
      cb?.(null, {});
      return;
    }

    this.logger.debug(
      `Flushing ${this.batch.messages.length} pending messages`,
    );

    if (cb) this.batch.callbacks.push(cb);
    this.processBatch();
  }
}
