/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../message/message-envelope.js';
import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  Runnable,
} from 'redis-smq-common';
import { IQueueParsedParams } from '../../../queue-manager/index.js';
import { TConsumerParsedOptions } from '../../types/index.js';
import { _executeAcknowledgementScript } from './_/_execute-acknowledgement-script.js';

export type TMessageAcknowledgerEvent = {
  'messageAcknowledger.error': (error: unknown) => void;
  'messageAcknowledger.messageAcknowledged': (message: MessageEnvelope) => void;
};

export class MessageAcknowledger extends Runnable<TMessageAcknowledgerEvent> {
  private pending: MessageEnvelope[] = [];
  private timer: NodeJS.Timeout | null = null;
  private pendingCallbacks: ICallback<void>[] = [];

  protected readonly consumerId: string;
  protected readonly queue: IQueueParsedParams;
  protected readonly logger: ILogger;
  protected readonly useBatchAcks: boolean;
  protected readonly batchSize: number;
  protected readonly batchTimeoutMs: number;

  constructor(
    queue: IQueueParsedParams,
    consumerId: string,
    logger: ILogger,
    consumerOptions: TConsumerParsedOptions,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumerId;
    this.logger = logger.createLogger(this.constructor.name);

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

    if (!this.useBatchAcks) {
      const messages = [message];
      _executeAcknowledgementScript(
        this.queue,
        this.consumerId,
        messages,
        (err, result) =>
          this.handleAcknowledgementResult(err, result, messages),
      );
      return;
    }

    this.pending.push(message);
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

    _executeAcknowledgementScript(
      this.queue,
      this.consumerId,
      batch,
      (err, result) => {
        this.handleAcknowledgementResult(err, result, batch);
        const callbacks = [...this.pendingCallbacks];
        this.pendingCallbacks = [];
        callbacks.forEach((callback) => callback());
      },
    );
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

  private handleAcknowledgementResult(
    err: Error | null | undefined,
    result: (0 | 1)[] | undefined,
    messages: MessageEnvelope[],
  ): void {
    if (err) {
      this.logger.error(`Message acknowledgement failed due to: ${err}`);
      this.handleError(err);
      return;
    }
    if (!result) {
      this.handleError(
        new CallbackEmptyReplyError({
          message: `_executeAcknowledgementScript() returned an empty result.`,
        }),
      );
      return;
    }
    result.forEach((result, index) => {
      const message = messages[index];
      const messageId = message.getId();
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
