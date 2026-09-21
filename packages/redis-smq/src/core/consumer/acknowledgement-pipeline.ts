/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, Runnable } from 'redis-smq-common';
import { MessageEnvelope } from '../message/message-envelope.js';
import { MessageAcknowledger } from './message-acknowledger.js';
import { MessageUnacknowledger } from './message-unacknowledger.js';
import { IMessageControl } from './message-consumer.js';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
} from '../../contracts/index.js';
import { IQueueParsedParams } from '../../contracts/index.js';
import { IConsumerParsedOptions } from '../../contracts/index.js';
import { TUnacknowledgementResult } from './types/message-unacknowledgement.js';

/**
 * Events emitted by the pipeline.
 *
 * - `error`: forwarded from a sub-component (acknowledger or
 *   unacknowledger) or raised by the pipeline's own `handleError`. The
 *   handler subscribes to this event and treats it as fatal: the runner
 *   tears the handler instance down.
 *
 * - the five message-outcome events: emitted per message as the
 *   sub-components process their batches. The handler enriches them with
 *   queue and consumerId and forwards them to the EventMultiplexer.
 */
export type TAcknowledgementPipelineEvent = {
  messageAcknowledged: (message: MessageEnvelope) => void;
  messageUnacknowledged: (
    messageId: string,
    cause: EMessageUnacknowledgementCause,
  ) => void;
  messageDeadLettered: (
    messageId: string,
    deadLetterCause: EMessageDeadLetterCause,
  ) => void;
  messageRequeued: (messageId: string) => void;
  messageDelayed: (messageId: string) => void;
  error: (err: Error) => void;
};

/**
 * Owns the acknowledger and unacknowledger sub-components and exposes the
 * `IMessageControl` surface for MessageConsumer.
 *
 * Responsibility split:
 *   - MessageConsumer decides *what* to do (ack or unack).
 *   - The pipeline decides *how* — routes to the appropriate sub-component
 *     and translates their batched results into per-message events.
 *
 * Lifecycle (matches pre-Step-6 ConsumeMessage):
 *   - goingUp:   start the unacknowledger, then the acknowledger
 *   - goingDown: stop the acknowledger, then the unacknowledger
 *
 * Error handling:
 *   - Sub-component errors are routed to `handleError`, which emits the
 *     pipeline's `error` event and delegates to `Runnable.handleError`.
 *     The base class shuts the pipeline down; the parent handler observes
 *     the event and tears its own instance down.
 *   - `handleError` requires the pipeline to be operational. Errors that
 *     fire while the pipeline is already going down are dropped, matching
 *     the base class's guard.
 */
export class AcknowledgementPipeline
  extends Runnable<TAcknowledgementPipelineEvent>
  implements IMessageControl
{
  protected readonly queue: IQueueParsedParams;
  protected readonly consumerId: string;
  protected readonly logger: ILogger;
  protected readonly acknowledger: MessageAcknowledger;
  protected readonly unacknowledger: MessageUnacknowledger;

  constructor(
    queue: IQueueParsedParams,
    consumerId: string,
    logger: ILogger,
    consumerOptions: IConsumerParsedOptions,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumerId;
    this.logger = logger.createLogger(this.constructor.name);

    this.acknowledger = new MessageAcknowledger(
      queue,
      consumerId,
      logger,
      consumerOptions,
    );
    this.acknowledger.on('messageAcknowledger.error', (err) => {
      this.handleError(err);
    });
    this.acknowledger.on(
      'messageAcknowledger.messageAcknowledged',
      (message) => {
        this.emit('messageAcknowledged', message);
      },
    );

    this.unacknowledger = new MessageUnacknowledger(
      consumerId,
      queue,
      logger,
      consumerOptions,
    );
    this.unacknowledger.on('messageUnacknowledger.error', (err) => {
      this.handleError(err);
    });
    this.unacknowledger.on(
      'messageUnacknowledger.messagesUnacknowledged',
      (result: TUnacknowledgementResult) => {
        this.emitUnacknowledgementEvents(result);
      },
    );
  }

  /**
   * Record a successful outcome. Called by MessageConsumer.
   *
   * Synchronous — the acknowledger batches internally and the call
   * returns immediately. Any error from the batch surfaces later via the
   * acknowledger's own error event, which routes through `handleError`.
   *
   * Drops the call with a debug log if the pipeline is not operational.
   * This happens when the handler is going down but a message is still
   * in flight.
   */
  ack(message: MessageEnvelope): void {
    if (!this.isOperational()) {
      this.logger.debug(
        `Ack for message ${message.getId()} dropped: pipeline not operational`,
      );
      return;
    }
    this.acknowledger.add(message);
  }

  /**
   * Record a failed outcome. Called by MessageConsumer, and by
   * MessageHandler's own timeout path.
   *
   * Synchronous, same contract as `ack`. Logging of the underlying error
   * is the caller's responsibility (MessageConsumer logs it before
   * calling unack); the pipeline only routes the request.
   */
  unack(message: MessageEnvelope, cause: EMessageUnacknowledgementCause): void {
    if (!this.isOperational()) {
      this.logger.debug(
        `Unack for message ${message.getId()} dropped: pipeline not operational`,
      );
      return;
    }
    this.unacknowledger.add(message, cause);
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super
      .goingUp()
      .concat([
        (cb: ICallback) => this.unacknowledger.run(cb),
        (cb: ICallback) => this.acknowledger.run(cb),
      ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => this.acknowledger.shutdown(cb),
      (cb: ICallback) => this.unacknowledger.shutdown(cb),
    ].concat(super.goingDown());
  }

  /**
   * Fatal error path. Emits the pipeline's `error` event once, then
   * delegates to `Runnable.handleError`, which logs and initiates the
   * pipeline's own shutdown.
   *
   * The base class's `handleError` does NOT emit on the same emitter — it
   * only logs and calls `shutdown()`. So there is no double-emit; the
   * explicit `emit` above is the single source of the `error` event.
   */
  protected override handleError(err: unknown): void {
    if (!this.isOperational()) return;
    this.emit('error', toError(err));
    super.handleError(err);
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  /**
   * Translate a batched unacknowledgement result into one event per
   * message. The result maps messageId -> resolution; each resolution
   * carries a cause and an action, and the action determines which
   * specific event to emit in addition to the common
   * `messageUnacknowledged`.
   *
   * Order: `messageUnacknowledged` first (the general signal), then the
   * action-specific event. Subscribers that only care about the general
   * signal are insulated from the action-specific ones.
   */
  private emitUnacknowledgementEvents(result: TUnacknowledgementResult): void {
    for (const [messageId, details] of Object.entries(result)) {
      this.emit('messageUnacknowledged', messageId, details.cause);

      if (details.action === EMessageUnacknowledgementAction.DEAD_LETTER) {
        this.emit('messageDeadLettered', messageId, details.deadLetterCause);
      } else if (details.action === EMessageUnacknowledgementAction.DELAY) {
        this.emit('messageDelayed', messageId);
      } else {
        // REQUEUE — the only remaining action.
        this.emit('messageRequeued', messageId);
      }
    }
  }
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}
