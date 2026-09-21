/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import { stat } from 'fs';
import {
  AsyncCallbackTimeoutError,
  CallableWorker,
  ICallback,
  ILogger,
} from 'redis-smq-common';
import { MessageEnvelope } from '../message/message-envelope.js';
import {
  InvalidMessageHandlerSignatureError,
  InvalidMessageHandlerTypeError,
  MessageHandlerFileError,
  MessageHandlerFilenameExtensionError,
} from '../errors/index.js';
import {
  EMessageUnacknowledgementCause,
  IMessageTransferable,
} from '../../contracts/index.js';
import { TConsumerMessageHandler } from '../../contracts/index.js';
import { IQueueParsedParams } from '../../contracts/index.js';

/**
 * The control interface MessageConsumer uses to record the outcome of a
 * message. Implemented by AcknowledgementPipeline in production; a test
 * can substitute a plain object that records calls.
 *
 * The methods are synchronous — the acknowledger and unacknowledger
 * pipelines batch internally and return immediately.
 *
 * Each implementation is expected to guard itself against being called
 * while it is not operational (the AcknowledgementPipeline does this via
 * its inherited `isOperational()` check). MessageConsumer does not
 * consult the control's state; it just records the outcome and lets the
 * control decide whether to accept it.
 */
export interface IMessageControl {
  ack(message: MessageEnvelope): void;
  unack(message: MessageEnvelope, cause: EMessageUnacknowledgementCause): void;
}

/**
 * Invokes the user's message handler and records the outcome on the
 * control object.
 *
 * Pure logic, no lifecycle. No Redis connection, no state beyond a
 * lazily-created worker for module-path handlers. The only timer it
 * creates is the per-message consume timeout, and that timer is cleared
 * as soon as the handler completes or the timeout fires.
 *
 * Dispatch model:
 *
 *   The handler is invoked with both the message and a completion
 *   callback, unconditionally. The outcome is recorded based on whichever
 *   of the following fires first:
 *     - a synchronous throw from the handler,
 *     - the return value being a thenable that resolves or rejects,
 *     - the completion callback being invoked,
 *     - the consume timeout, if `consumeTimeout > 0`.
 *
 * Timeout:
 *
 *   When `message.producibleMessage.getConsumeTimeout() > 0`, a timer is
 *   set. Whichever of the timer and the handler completion fires first
 *   records the outcome; the other becomes a no-op via the `settled`
 *   flag. A timeout records an unack with cause `TIMEOUT`. The handler
 *   (or worker) keeps running to completion when the timer wins; its
 *   eventual callback is discarded.
 *
 * Logging:
 *   - debug on consume progression and timeout setup
 *   - debug on duplicate callback invocation
 *   - error on handler failure, transfer() failure, and timeout
 *   - warn on non-promise handler returning a non-thenable
 */
export class MessageConsumer {
  protected readonly logger: ILogger;
  protected readonly handler: TConsumerMessageHandler;
  protected readonly queue: IQueueParsedParams;
  protected readonly control: IMessageControl;
  protected worker: CallableWorker<IMessageTransferable, void> | null = null;

  constructor(
    handler: TConsumerMessageHandler,
    queue: IQueueParsedParams,
    control: IMessageControl,
    logger: ILogger,
  ) {
    this.handler = handler;
    this.queue = queue;
    this.control = control;
    this.logger = logger.createLogger(this.constructor.name);
  }

  /**
   * Consume one message.
   *
   * The callback is invoked exactly once, after the outcome has been
   * recorded (ack, unack, or unack-with-TIMEOUT) or after the transfer
   * step failed and a CONSUME_ERROR unack was recorded. The callback
   * always receives `null` — success and failure are both normal
   * outcomes, and the pipeline is where observability lives.
   */
  consume(message: MessageEnvelope, cb: ICallback): void {
    const messageId = message.getId();
    this.logger.debug(`Consuming message ${messageId}`);

    // message.transfer() can throw if the envelope is malformed
    let transferable: IMessageTransferable;
    try {
      transferable = message.transfer();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Exception consuming ${messageId}: ${e.message}`);
      this.control.unack(message, EMessageUnacknowledgementCause.CONSUME_ERROR);
      return cb();
    }

    let settled = false;
    let timer: NodeJS.Timeout | undefined;

    // Single point where an outcome is recorded. `settled` guards the
    // race between the handler's completion and the timeout: whichever
    // fires first records the outcome, the other becomes a no-op.
    const recordOutcome = (err?: Error | null): void => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);

      if (err) {
        const cause = this.classifyError(err);
        this.logger.error(`Error consuming ${messageId}: ${err.message}`);
        this.control.unack(message, cause);
      } else {
        this.logger.debug(`Message ${messageId} consumed successfully`);
        this.control.ack(message);
      }
      cb();
    };

    const consumeTimeout = message.producibleMessage.getConsumeTimeout();
    if (consumeTimeout) {
      this.logger.debug(`Setting timeout ${consumeTimeout}ms for ${messageId}`);
      timer = setTimeout(() => {
        recordOutcome(new AsyncCallbackTimeoutError());
      }, consumeTimeout);
      timer.unref();
    }

    this.invokeHandler(transferable, (err) => {
      recordOutcome(err);
    });
  }

  /**
   * Validate the handler's shape. Called by MessageHandler during
   * goingUp, before any message is processed, so an invalid handler
   * fails startup rather than the first delivery.
   */
  validateHandler(cb: ICallback): void {
    const handler: unknown = this.handler;

    if (typeof handler === 'function') {
      if (![1, 2].includes(handler.length)) {
        return cb(
          new InvalidMessageHandlerSignatureError({
            metadata: { queue: this.queue },
            message:
              `Message handler for queue ${this.queue.queueParams.name} ` +
              `has unsupported arity (${handler.length}). ` +
              `Expected a function with 1 or 2 parameters.`,
          }),
        );
      }
      return cb();
    }

    if (typeof handler === 'string') {
      const ext = path.extname(handler);
      if (!['.js', '.cjs'].includes(ext)) {
        return cb(new MessageHandlerFilenameExtensionError());
      }
      stat(handler, (err) => {
        if (err) cb(new MessageHandlerFileError());
        else cb();
      });
      return;
    }

    cb(
      new InvalidMessageHandlerTypeError({
        metadata: { queue: this.queue },
      }),
    );
  }

  /**
   * Shut down the lazily-created worker, if any. Called by the handler
   * during goingDown. Idempotent. Does NOT touch the timeout — a timer
   * for an in-flight message is cleared by the timer's own callback or by
   * `recordOutcome`.
   */
  shutdown(cb: ICallback): void {
    const worker = this.worker;
    if (!worker) return cb();
    this.worker = null;
    worker.shutdown((err) => {
      if (err) {
        this.logger.warn(`Worker shutdown error: ${err.message}`);
      }
      cb();
    });
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  /**
   * Invoke the user's handler.
   *
   * The handler is called with `(msg, once)`. The `once` closure is
   * guarded so double-invocation is safe. The first of the following
   * signals to fire wins:
   *
   *   - synchronous throw from the handler
   *   - the handler returns a thenable and it resolves or rejects
   *   - the handler calls `once`
   *
   * After the synchronous portion of the call returns, if `once` has not
   * been invoked and the return value is not a thenable, the handler's
   * arity is consulted as a hint:
   *
   *   - arity 2: a callback-style handler that defers its call. Wait.
   *   - arity <= 1: a promise-style handler that returned nothing. Warn
   *     and treat as complete.
   */
  protected invokeHandler(msg: IMessageTransferable, cb: ICallback): void {
    const handler = this.handler;

    if (typeof handler === 'string') {
      return this.invokeWorker(handler, msg, cb);
    }

    if (typeof handler !== 'function') {
      return cb(
        new InvalidMessageHandlerTypeError({
          metadata: { queue: this.queue },
        }),
      );
    }

    let settled = false;
    const once = (err?: Error | null) => {
      if (settled) {
        this.logger.debug(`Callback for ${msg.id} already handled`);
        return;
      }
      settled = true;
      cb(err ?? null);
    };

    let result: unknown;
    try {
      // Both arguments are passed unconditionally. A promise-based
      // handler ignores the second; a callback-based handler uses it.
      // This decouples invocation from the function's arity, which is
      // unreliable under mocks, wrappers, default parameters, and rest
      // parameters.
      result = handler(msg, once);
    } catch (err) {
      return once(err instanceof Error ? err : new Error(String(err)));
    }

    // Handler called `once` synchronously. Callback-style handlers —
    // including vi.fn-wrapped ones — reach this path.
    if (settled) return;

    // Handler returned a thenable: promise-based.
    if (
      result &&
      typeof result === 'object' &&
      'then' in result &&
      typeof result.then === 'function'
    ) {
      result.then(
        () => once(),
        (err: unknown) =>
          once(err instanceof Error ? err : new Error(String(err))),
      );
      return;
    }

    // Neither `once` nor a thenable. Consult arity as a hint.
    if (handler.length === 2) {
      // Callback-style handler that defers its call. Wait for `once`.
      return;
    }

    // Arity <= 1, non-thenable return
    this.logger.warn(`Handler for ${msg.id} didn't return a Promise`);
    once();
  }

  /**
   * Module-path handler. The worker is created lazily on first use and
   * reused for subsequent calls.
   */
  protected invokeWorker(
    filename: string,
    msg: IMessageTransferable,
    cb: ICallback,
  ): void {
    if (!this.worker) {
      this.logger.debug(`Creating worker for ${filename}`);
      this.worker = new CallableWorker(filename, this.logger);
    }
    this.worker.call(msg, cb);
  }

  /**
   * Map an arbitrary error to the closest unacknowledgement cause.
   */
  protected classifyError(err: Error): EMessageUnacknowledgementCause {
    if (err instanceof AsyncCallbackTimeoutError) {
      return EMessageUnacknowledgementCause.TIMEOUT;
    }
    if (err instanceof InvalidMessageHandlerSignatureError) {
      return EMessageUnacknowledgementCause.INVALID_HANDLER_SIGNATURE;
    }
    return EMessageUnacknowledgementCause.UNACKNOWLEDGED;
  }
}
