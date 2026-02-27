/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../message/message-envelope.js';
import { ICallback, ILogger, IRedisClient, Runnable } from 'redis-smq-common';
import { Configuration } from '../../../config/index.js';
import { ERedisScriptName } from '../../../common/redis/scripts.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
} from '../../../queue-manager/index.js';
import { TConsumerParsedOptions } from '../../types/index.js';
import {
  InvalidQueueStateError,
  QueueLockedError,
  QueueNotFoundError,
  QueueStoppedError,
  UnexpectedScriptReplyError,
} from '../../../errors/index.js';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';

export interface IMessageAcknowledgementPending {
  messageId: string;
  keyMessage: string;
  message: MessageEnvelope;
}

export type TMessageAcknowledgerEvent = {
  'messageAcknowledger.error': (error: unknown) => void;
  'messageAcknowledger.messageAcknowledged': (message: MessageEnvelope) => void;
};

export class MessageAcknowledger extends Runnable<TMessageAcknowledgerEvent> {
  private readonly redisClient: IRedisClient;
  private readonly keyQueueProcessing: string;
  private readonly keyQueueAcknowledged: string;
  private readonly keyQueueProperties: string;

  private pending: IMessageAcknowledgementPending[] = [];
  private timer: NodeJS.Timeout | null = null;
  private pendingCallbacks: ICallback<void>[] = [];

  protected readonly queue: IQueueParsedParams;
  protected readonly logger: ILogger;
  protected readonly useBatchAcks: boolean;
  protected readonly batchSize: number;
  protected readonly batchTimeoutMs: number;

  constructor(
    queue: IQueueParsedParams,
    consumerId: string,
    logger: ILogger,
    redisClient: IRedisClient,
    consumerOptions: TConsumerParsedOptions,
  ) {
    super();
    this.queue = queue;
    this.logger = logger.createLogger(this.constructor.name);
    this.redisClient = redisClient;
    const { keyQueueProperties, keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queue.queueParams.ns,
      queue.queueParams.name,
      queue.groupId,
    );
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue.queueParams,
      consumerId,
    );
    this.keyQueueProcessing = keyQueueProcessing;
    this.keyQueueAcknowledged = keyQueueAcknowledged;
    this.keyQueueProperties = keyQueueProperties;

    this.useBatchAcks = consumerOptions.enableBatchAcks;
    this.batchSize = consumerOptions.batchSize;
    this.batchTimeoutMs = consumerOptions.batchTimeoutMs;
  }

  add(message: MessageEnvelope): void {
    const messageId = message.getId();

    if (!this.isOperational()) {
      this.logger.warn(
        `Rejecting message ${messageId} - MessageAcknowledger is not operational`,
      );
      //  rely on ReapConsumersWorker to unack processing queue messages
      return;
    }

    const { keyMessage } = redisKeys.getMessageKeys(messageId);

    if (!this.useBatchAcks) {
      this.executeAck([message], [messageId], [keyMessage]);
      return;
    }

    this.pending.push({ messageId, keyMessage, message });
    this.logger.debug(
      `Queued message ${messageId} for batch. Queue size: ${this.pending.length}`,
    );

    if (this.pending.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchTimeoutMs);
    }
  }

  flush(cb?: ICallback<void>): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0) {
      if (cb) cb();
      return;
    }

    if (cb) this.pendingCallbacks.push(cb);

    const batch = [...this.pending];
    this.pending = [];

    this.logger.debug(`Flushing batch of ${batch.length} acknowledgments`);

    const messages = batch.map((item) => item.message);
    const messageIds = batch.map((item) => item.messageId);
    const messageKeys = batch.map((item) => item.keyMessage);

    this.executeAck(messages, messageIds, messageKeys, () => {
      const callbacks = [...this.pendingCallbacks];
      this.pendingCallbacks = [];
      callbacks.forEach((callback) => callback());
    });
  }

  protected override goingDown(): Array<(cb: ICallback<void>) => void> {
    return [
      (cb: ICallback<void>) => {
        this.logger.info(
          `Shutting down with ${this.pending.length} pending acknowledgments`,
        );
        this.flush(cb);
      },
    ];
  }

  private executeAck(
    messages: MessageEnvelope[],
    messageIds: string[],
    messageKeys: string[],
    onComplete?: ICallback<void>,
  ): void {
    const { enabled, queueSize, expire } =
      Configuration.getConfig().messageAudit.acknowledgedMessages;

    const argv = this.buildAckArgs(messageIds, enabled, queueSize, expire);
    const keys = [
      this.keyQueueProcessing,
      this.keyQueueAcknowledged,
      this.keyQueueProperties,
      ...messageKeys,
    ];

    this.redisClient.runScript(
      ERedisScriptName.ACKNOWLEDGE_MESSAGE,
      keys,
      argv,
      (err, reply) => {
        if (err) {
          this.logger.error(`Acknowledgment failed: ${err.message}`);
          this.handleAcknowledgementError(err);
          return;
        }

        this.handleAckResponse(reply, messages, messageIds);
        if (onComplete) onComplete();
      },
    );
  }

  private buildAckArgs(
    messageIds: string[],
    enabled: boolean,
    queueSize: number,
    expire: number,
  ): (string | number)[] {
    return [
      Number(enabled), // ARGV[1]: storeMessages
      expire, // ARGV[2]: expireStoredMessages
      queueSize * -1, // ARGV[3]: storedMessagesSize
      Date.now(), // ARGV[4]: messageAcknowledgedAt
      EQueueProperty.OPERATIONAL_STATE, // ARGV[5]: state field
      EQueueOperationalState.ACTIVE, // ARGV[6]: active state
      EQueueOperationalState.PAUSED, // ARGV[7]: paused state
      EQueueOperationalState.STOPPED, // ARGV[8]: stopped state
      EQueueOperationalState.LOCKED, // ARGV[9]: locked state
      EMessageProperty.STATUS, // ARGV[10]: status field
      EMessagePropertyStatus.ACKNOWLEDGED, // ARGV[11]: acknowledged status
      EMessageProperty.ACKNOWLEDGED_AT, // ARGV[12]: acknowledged at field
      EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT, // ARGV[13]: acknowledged count field
      EQueueProperty.PROCESSING_MESSAGES_COUNT, // ARGV[14]: processing count field
      ...messageIds, // ARGV[15+]: message IDs
    ];
  }

  private handleAckResponse(
    reply: unknown,
    messages: MessageEnvelope[],
    messageIds: string[],
  ): void {
    if (!Array.isArray(reply)) {
      this.handleAcknowledgementError(reply);
      return;
    }
    this.handleBatchResponse(reply as (0 | 1)[], messages, messageIds);
  }

  private handleAcknowledgementError(error: unknown): void {
    this.logger.error(`Message acknowledgement failed due to: ${error}`);

    if (error instanceof Error) {
      this.emit('messageAcknowledger.error', error);
      return;
    }

    if (error === 'QUEUE_STOPPED') {
      this.emit(
        'messageAcknowledger.error',
        new QueueStoppedError({
          metadata: {
            queue: this.queue.queueParams,
          },
        }),
      );
      return;
    }

    if (error === 'QUEUE_LOCKED') {
      this.emit(
        'messageAcknowledger.error',
        new QueueLockedError({
          metadata: {
            queue: this.queue.queueParams,
          },
        }),
      );
      return;
    }

    if (error === 'QUEUE_NOT_FOUND') {
      this.emit(
        'messageAcknowledger.error',
        new QueueNotFoundError({
          metadata: {
            queue: this.queue.queueParams,
          },
        }),
      );
      return;
    }

    if (error === 'QUEUE_INVALID_STATE') {
      this.emit(
        'messageAcknowledger.error',
        new InvalidQueueStateError({
          metadata: {
            queue: this.queue.queueParams,
          },
        }),
      );
      return;
    }

    this.emit(
      'messageAcknowledger.error',
      new UnexpectedScriptReplyError({
        metadata: {
          reply: error,
        },
      }),
    );
  }

  private handleBatchResponse(
    results: (0 | 1)[],
    messages: MessageEnvelope[],
    messageIds: string[],
  ): void {
    results.forEach((result, index) => {
      const message = messages[index];
      const messageId = messageIds[index];

      if (result === 0) {
        this.logger.info(
          `Message ${messageId} was already acknowledged or something else`,
        );
        // ignoring it
        return;
      }

      this.logger.debug(`Message ${messageId} acknowledged successfully`);
      this.emit('messageAcknowledger.messageAcknowledged', message);
    });
  }
}
