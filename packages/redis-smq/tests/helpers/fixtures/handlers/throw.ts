/**
 * Fixture: synchronously-throwing message handler.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/throw.js')`. Tests that exercise the file-based handler path
 * reference this file to verify that RedisSMQ catches a synchronous
 * exception thrown from a handler and routes it through the same
 * unacknowledgement pipeline as a callback-reported failure.
 *
 * Behaviour: throws immediately, without calling `cb`. RedisSMQ's
 * handler runner catches the throw, converts it to a failure, and the
 * message is unacknowledged. From the message pipeline's perspective the
 * outcome is identical to `unack.ts` — the difference is where in the
 * framework the failure is detected:
 *
 *   - `unack.ts` → handler returns normally, callback reports the error.
 *   - `throw.ts` → handler throws before the callback is invoked; the
 *                 runner's try/catch converts it to a failure.
 *
 * Both paths must produce a correct unack. A regression that only affects
 * the synchronous-throw path (e.g. the runner's try/catch is removed, or
 * an `async` handler's rejection is not wired up) would pass every test
 * that uses `unack.ts` and fail only tests that load this fixture. That is
 * why both fixtures exist.
 *
 * Async variant: an `async` function that `throw`s produces a rejected
 * Promise; RedisSMQ handles it via the same mechanism. See
 * `async-throw.ts` if you need to exercise that specific path — a fixture
 * distinct from this one so a failure in one path doesn't mask a failure in
 * the other.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. Tests
 *   reference `throw.js`, and the test build must emit a sibling `.js` for
 *   this file. See `ack.ts` for the full build-note rationale.
 */

import type { ICallback } from 'redis-smq-common';
import type { IMessageTransferable } from '../../../../src/index.js';

export default function throwHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _msg: IMessageTransferable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cb: ICallback<void>,
): void {
  throw new Error('throw: simulated synchronous handler failure');
}
