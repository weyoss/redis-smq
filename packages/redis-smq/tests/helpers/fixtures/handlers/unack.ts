/**
 * Fixture: unacknowledging message handler.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/unack.js')`. Tests that exercise the file-based handler path
 * reference this file to verify that RedisSMQ loads a worker, invokes
 * it with a message, and processes a *failure* outcome correctly.
 *
 * Behaviour: calls `cb(new Error(...))` immediately. RedisSMQ
 * interprets this as "the handler failed to process this message" and
 * routes the message through the unacknowledgement pipeline:
 *
 *   - The message is unacknowledged (`consumer.messageUnacknowledged`
 *     fires with cause `UNACKNOWLEDGED`).
 *   - The pipeline then decides the resolution based on the message's
 *     retry policy and the number of attempts so far:
 *       * attempts < retryThreshold → requeued (or delayed, if retryDelay > 0)
 *       * attempts == retryThreshold → dead-lettered
 *   - With the default test config (`retryThreshold: 3, retryDelay: 0`),
 *     a single produce of a message and a single delivery will requeue it
 *     twice and dead-letter it on the third failure.
 *
 * Tests that want a *dead-letter on the first attempt* use
 * `.setRetryThreshold(0)` on the produced message.
 *
 * For the synchronous-throw variant (which also ends in an unack but
 * exercises a different code path in RedisSMQ's error handling), see
 * `throw.ts`.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. Tests
 *   reference `unack.js`, and the test build must emit a sibling `.js` for
 *   this file. See `ack.ts` for the full build-note rationale.
 */

import type { ICallback } from 'redis-smq-common';
import type { IMessageTransferable } from '../../../../src/index.js';

export default function unack(
  _msg: IMessageTransferable,
  cb: ICallback<void>,
): void {
  cb(new Error('unack: simulated handler failure'));
}
